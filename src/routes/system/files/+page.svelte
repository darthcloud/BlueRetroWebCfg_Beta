<script lang="ts">
	import { run } from 'svelte/legacy';

	import {
		brUuid,
		cfg_cmd_close_dir,
		cfg_cmd_del_file,
		cfg_cmd_get_file,
		cfg_cmd_open_dir
	} from '$lib/constants';
	import { getGameName, getService, toaster } from '$lib/utilities';
	import { device, deviceConfig, isFullyInitialized } from '$lib/stores';
	import { IconTrash } from '@tabler/icons-svelte';
	import type { IBlueRetroFile } from '$lib/interfaces';
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';

	let isDoingSomething = $state(false);
	let deletingFileNumber: number | undefined = $state();

	const readFileRecursive = async (
		chrc: BluetoothRemoteGATTCharacteristic,
		files: IBlueRetroFile[]
	) => {
		const value = await chrc.readValue();
		if (value.byteLength > 0) {
			let enc = new TextDecoder('utf-8');
			let name = enc.decode(value);
			try {
				const gameName = (await getGameName(name))?.toString();
				files.push({ name, gameName });
			} catch {
				files.push({ name });
			}

			await readFileRecursive(chrc, files);
		}
		return files;
	};

	const deleteFileCmd = async (filename: string) => {
		const serv = await getService();
		var cmd = new Uint8Array([cfg_cmd_del_file]);
		const chrc = await serv.getCharacteristic(brUuid[7]);
		let enc = new TextEncoder();
		let file = enc.encode(filename);
		let combined = new Uint8Array([...cmd, ...file]);
		await chrc.writeValue(combined);
	};

	const deleteFile = async (filename: string, index: number) => {
		deletingFileNumber = index;
		isDoingSomething = true;
		try {
			await deleteFileCmd(filename);
			deviceConfig.update((c) => ({
				...c,
				files: c?.files?.filter((_, i) => i !== index)
			}));
			toaster.success({ title: `Success updating firmware`});
		} catch (error) {
			toaster.error({ title: `Error updating firmware!`});
			console.log(`error deleting file: ${filename}`, error);
		}
		isDoingSomething = false;
		deletingFileNumber = undefined;
	};

	const getFiles = async () => {
		isDoingSomething = true;
		try {
			const serv = await getService();
			if (serv) {
				var cmd = new Uint8Array([cfg_cmd_open_dir]);
				const cmd_chrc = await serv.getCharacteristic(brUuid[7]);
				await cmd_chrc.writeValue(cmd);
				cmd[0] = cfg_cmd_get_file;
				await cmd_chrc.writeValue(cmd);
				const files = await readFileRecursive(cmd_chrc, []);
				cmd[0] = cfg_cmd_close_dir;
				await cmd_chrc.writeValue(cmd);
				deviceConfig.update((c) => ({
					...c,
					files
				}));
			}
		} catch (error) {}
		isDoingSomething = false;
	};

	$effect.pre(() => {
		if ($isFullyInitialized && ($deviceConfig?.files?.length || 0) == 0) {
			getFiles();
		}
	});
</script>

{#if isDoingSomething && !$deviceConfig?.files}
	<div class="flex flex-col items-center gap-4 p-4">
		<ProgressRing classes="w-6 h-6" value={null} />
		Fetching Files...
	</div>
{:else}
<div class="flex flex-row">
	<ul class="list flex-col flex-none">
		{#if $device && $deviceConfig?.files?.length}
			{#each $deviceConfig.files as file, i}
				<li class="flex flex-row gap-4">
					<span class="flex-1">{file.gameName ?? file.name}</span>
					<button
						onclick={async () => await deleteFile(file.name, i)}
						class="btn-icon btn-icon-sm hover:preset-filled-error-500"
						disabled={isDoingSomething}
					>
						{#if deletingFileNumber === i}
							<ProgressRing classes="w-6 h-6" value={null} />
						{:else}
							<IconTrash />
						{/if}
					</button>
				</li>
			{/each}
		{/if}
	</ul>
</div>
{/if}
