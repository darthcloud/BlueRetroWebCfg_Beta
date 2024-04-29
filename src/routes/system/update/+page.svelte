<script lang="ts">
	import {
		brUuid,
		cfg_cmd_ota_abort,
		cfg_cmd_ota_end,
		cfg_cmd_ota_start,
		mtu,
	} from '$lib/constants';
	import { device, deviceConfig, service, isFullyInitialized, latestVersion } from '$lib/stores';
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';
	import { toaster, getService } from '$lib/utilities';
	import { ActivityProgress } from '$lib/components';
	import { IconUpload, IconX } from '@tabler/icons-svelte';

	
	let isDoingSomething = $state(false);
	let progress = $state(0);
	let isCanceling = false;
	let files: FileList | undefined = $state();

	

	let isHw2 =
		$derived($deviceConfig?.appVersion?.indexOf('hw2') != -1 || $deviceConfig?.appName?.indexOf('hw2') != -1);

	const otaWriteFwRecursive = async (
		chrc: BluetoothRemoteGATTCharacteristic,
		data: ArrayBuffer,
		offset: number
	) => {
		if (isCanceling) {
			isCanceling = false;
			isDoingSomething = false;
			throw new Error('Cancelled');
		}
		progress = Math.round((offset / data.byteLength) * 100);
		var tmpViewSize = data.byteLength - offset;
		if (tmpViewSize > mtu) {
			tmpViewSize = mtu;
		}
		var tmpView = new DataView(data, offset, tmpViewSize);
		await chrc.writeValue(tmpView);
		offset += Number(mtu);
		if (offset < data.byteLength) {
			await otaWriteFwRecursive(chrc, data, offset);
		}
	};

	const otaWriteFirmware = async (service: BluetoothRemoteGATTService, data: ArrayBuffer) : Promise<boolean> => {
		const cmd = new Uint8Array([cfg_cmd_ota_start]);
		let characteristics: BluetoothRemoteGATTCharacteristic | undefined = undefined;

		try {
			characteristics = await service.getCharacteristic(brUuid[7]);
			characteristics.writeValue(cmd);
			const chrc = await service.getCharacteristic(brUuid[8]);
			await otaWriteFwRecursive(chrc, data, 0);
			cmd[0] = cfg_cmd_ota_end;
			await characteristics.writeValue(cmd);

			return true;
		} catch ( e ){
			cmd[0] = cfg_cmd_ota_abort;
			characteristics?.writeValue(cmd);
			return false;
		}
	};

	const onWriteClick = async () => {
		if(files?.length) {
			try {
				isDoingSomething = true;
				const serv = await getService();
				const reader = new FileReader();
				reader.onabort = (_) => {
					console.log('File read cancelled');
				};
				reader.onload = async (_) => {
					if (reader.result) {
						var decoder = new TextDecoder('utf-8');
						var header = decoder.decode(reader.result.slice(0, 256) as ArrayBuffer);
						let isNewFirmwareFileHw2 = header.indexOf('hw2') != -1;
						if (isHw2 == isNewFirmwareFileHw2) {
							var success = await otaWriteFirmware(serv, reader.result as ArrayBuffer);

							if(success) {
								toaster.success({ title: 'Success updating firmware'});
							} else {
								toaster.error({ title: 'There was an error updating the firmware!'});
							}
							
							device.set(undefined);
						} else {
							toaster.error({ title: 'Hardware and firmware mismatch!'});
						}
					}

					isDoingSomething = false;
					progress = 0;
					$device?.gatt?.disconnect();
					device.set(undefined);
					deviceConfig.set(undefined);
					service.set(undefined);
				};

				// Read in the image file as a binary string.
				reader.readAsArrayBuffer(files[0]);
			} catch {
				toaster.error({ title: 'There was an error updating the firmware!'});
				isDoingSomething = false;
				progress = 0;
			}
		}
	};

	const cancelClick = () => {
		isCanceling = true;
	};

	const onFileChange = (details: any) => {
		files = details.acceptedFiles;
	}
	const removeFile = () => {
		files = undefined;
	}
</script>

<p>
	Latest Verison: {$latestVersion} available at
	<a class="anchor" href="https://darthcloud.itch.io/blueretro">itch.io</a>
</p>

<div class="flex md:flex-row gap-4 md:items-center flex-col">
	<div class="flex flex-row items-center gap-4">
		{#if !files?.length}
			<FileUpload
			name="files"
			onFileChange={onFileChange} maxFiles={1}
			disabled={isDoingSomething || !$device}>
			
			<button class="btn preset-tonal-tertiary">
				<IconUpload class="size-4" />
				<span>Select Firmware.bin</span>
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
		class="btn preset-tonal"
		disabled={!$isFullyInitialized || isDoingSomething || !$device || !files?.length}
	>
		Write</button
	>
</div>
<ActivityProgress max={100} onCancelClick={cancelClick} {progress} {isDoingSomething} labelText="Updating..." />
