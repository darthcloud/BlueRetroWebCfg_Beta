<script lang="ts">
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';
	import { block, brUuid, mtu, vmuSize } from '$lib/constants';
	import { downloadFile, toaster, getService } from '$lib/utilities';
	import { isFullyInitialized, device } from '$lib/stores';
	import { ActivityProgress } from '$lib/components';
	import { IconUpload, IconX } from '@tabler/icons-svelte';

	let progress = $state(0);
	let isDoingSomething = $state(false);
	let isCanceled = $state(false);
	let files: FileList | undefined = $state();
	let activityProgressLabel = $state('');


	const dcReadFileRecursive = async (
		chrc: BluetoothRemoteGATTCharacteristic,
		data: Uint8Array,
		offset: number
	): Promise<Uint8Array> => {
		if (isCanceled) {
			isCanceled = false;
			throw new Error('Canceled');
		}
		progress = Math.round((offset / vmuSize) * 100);
		const value = await chrc.readValue();
		var tmp = new Uint8Array(value.buffer);
		data.set(tmp, offset);
		offset += value.byteLength;
		if (offset < vmuSize) {
			return await dcReadFileRecursive(chrc, data, offset);
		} else {
			return data;
		}
	};

	const dcReadFile = async () => {
		const serv = await getService();
		var data = new Uint8Array(vmuSize);
		var offset = new Uint32Array(1);
		let ctrl_chrc = await serv.getCharacteristic(brUuid[10]);
		offset[0] = 0;
		await ctrl_chrc.writeValue(offset);
		const chrc = await serv.getCharacteristic(brUuid[11]);
		await dcReadFileRecursive(chrc, data, 0);
		return data;
	};

	const onReadClick = async () => {
		isDoingSomething = true;
		activityProgressLabel = 'Reading...';
		try {
			const data = await dcReadFile();
			let view = new DataView(data.buffer);
			for (let i = 0; i < vmuSize; i += 4) {
				view.setUint32(i, view.getUint32(i), true)
			}
			downloadFile(new Blob([data.buffer], { type: 'application/bin' }),`vmu.bin`);
			toaster.success({ title: 'Success reading controller vmu'});
		} catch (error: any) {
			if(error.message !== 'Canceled') {
				toaster.error({ title: 'There was an error reading the controller vmu!'});
			}
		}
		isDoingSomething = false;
		progress = 0;
	};

	const dcWriteRecursive = async (
		chrc: BluetoothRemoteGATTCharacteristic,
		data: ArrayBuffer,
		offset: number
	) => {
		var curBlock = ~~(offset / block) + 1;
		if (isCanceled) {
			isCanceled = false;
			throw new Error('Canceled');
		}
		progress = Math.round((offset / data.byteLength) * 100);
		let tmpViewSize = curBlock * block - offset;
		if (tmpViewSize > mtu) {
			tmpViewSize = mtu;
		}
		var tmpView = new DataView(data, offset, tmpViewSize);
		await chrc.writeValue(tmpView);
		offset += tmpViewSize;
		if (offset < data.byteLength) {
			await dcWriteRecursive(chrc, data, offset);
		}
	};

	const dcWriteFile = async (data: ArrayBuffer) => {
		const serv = await getService();
		const ctrl_chrc = await serv.getCharacteristic(brUuid[10]);
		const offset = new Uint32Array(1);
		offset[0] = 0;
		await ctrl_chrc.writeValue(offset);
		const chrc = await serv.getCharacteristic(brUuid[11]);
		await dcWriteRecursive(chrc, data, 0);
	};

	

	const onWriteClick = async () => {
		isDoingSomething = true;
		activityProgressLabel = 'Writing...';
		if(files?.length) {
			try {
				const reader = new FileReader();
				reader.onabort = (_) => {
					console.log('File write canceled');
					toaster.error({ title: 'File write was canceled'});
					isDoingSomething = false;
					progress = 0;
				};
				reader.onload = async (_) => {
					try {
						const data = reader.result?.slice(0, vmuSize);

						if (data && data instanceof ArrayBuffer) {
							let view = new DataView(data);
							for (let i = 0; i < vmuSize; i += 4) {
								view.setUint32(i, view.getUint32(i), true)
							}
							await dcWriteFile(data);
							toaster.success({ title: 'Success writing'});
						} else {
							toaster.error({ title: 'Unable to read file!'});
						}
						
					} catch (error: any) {
						if(error.message !== 'Canceled') {
							toaster.error({ title: 'Unable to write the file!'});
						}
					}

					isDoingSomething = false;
					progress = 0;
				};

				// Read in the image file as a binary string.
				reader.readAsArrayBuffer(files[0]);
			} catch {
				toaster.error({ title: 'There was an error writing!'});
				isDoingSomething = false;
				progress = 0;
			}
		}
	};

	const cancelClick = () => {
		isCanceled = true;
	};

	const onFileChange = (details: any) => {
		files = details.acceptedFiles;
	}
	const removeFile = () => {
		files = undefined;
	}
</script>

<div class="flex flex-col gap-4 p-4">
	<div class="flex md:flex-row gap-4 md:items-center flex-col">
		<button
			onclick={onReadClick}
			class="btn preset-tonal border border-surface-500 flex-row gap-4"
			disabled={isDoingSomething || !$isFullyInitialized}
		>
			Read
		</button>


		<div class="flex flex-row items-center gap-4">
			{#if !files?.length}
			<FileUpload
				name="files"
				classes="w-full"
				onFileChange={onFileChange} maxFiles={1}
				disabled={isDoingSomething || !$device}>
				
				<button class="btn preset-tonal border border-surface-500 w-full">
					<IconUpload class="size-4" />
					<span>Select .BIN file to write</span>
				</button>
				</FileUpload>
			{:else}
				<div class="flex flex-row gap-2 items-center">
					<div>
						{files[0].name}
					</div>
					<button
						onclick={removeFile}
						class="btn"
						disabled={isDoingSomething}
					>
						<IconX class="text-red-800 border border-red-800 rounded-md" />
					</button>
				</div>
				
			{/if}
		</div>

		<button
			onclick={onWriteClick}
			class="btn preset-tonal border border-surface-500 flex-row gap-4"
			disabled={isDoingSomething || !$isFullyInitialized || !files?.length}
		>
			Write
		</button>
	</div>
	<ActivityProgress 
		max={100}
		{isDoingSomething}
		onCancelClick={cancelClick} 
		{progress} 
		labelText={activityProgressLabel}
	/>
</div>
