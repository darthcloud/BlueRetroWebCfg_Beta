<script lang="ts">
	import '../app.css';
	import { Toaster, ProgressRing, Modal, Progress } from '@skeletonlabs/skeleton-svelte';
	import {
		IconBrandGithub,
		IconBrandDiscord,
		IconMenu2,
		IconBluetoothConnected,
		IconDownload
	} from '@tabler/icons-svelte';
	import { deviceConfig, device, service, latestVersion } from '$lib/stores';
	import { NavigationMenu, ActivityProgress } from '$lib/components';
	import { getService, toaster } from '$lib/utilities';
	import { urlLatestRelease } from '$lib/constants';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let isGettingService = $state(false);
	let isDrawerOpen = $state(false);
	let isConnectedModalOpen = $state(false);
	let isIntentionallyDisconnecting = $state(false);
	let cancellationToken: ICancellationToken = $state({ isCanceled: false })

	const unselectDevice = () => {
		device.set(undefined);
		deviceConfig.set(undefined);
		service.set(undefined);
	};

	const initializeDevice = async () => {
		isGettingService = true;
		try {
			await getService(0, cancellationToken);
			if(!cancellationToken.isCanceled) {
				toaster.success({ title: 'Successfully connected to the BlueRetro service' });
			}
			
			isGettingService = false;
		} catch (error) {
			console.log('Error initializing device', error);
			if(!cancellationToken.isCanceled) {
				toaster.error({ title: 'Error initializing connection to BlueRetro device' });
			}
			isGettingService = false;
		}
	};

	onMount(async () => {
		const response = await fetch(urlLatestRelease);
		const json = await response.json();
		latestVersion.set(json.tag_name);
	});

	let upgradeAvailable = $derived($latestVersion && $deviceConfig?.appVersion?.indexOf($latestVersion) == -1);

	const onMenuClick = () => {
		isDrawerOpen = true;
	};

	const onSwitchDeviceClick = async () => {
		isIntentionallyDisconnecting = true;
		cancellationToken.isCanceled = false;
		if ($device?.gatt?.connected) {
			$device.gatt.disconnect();
		}
		unselectDevice();
		await initializeDevice();
		isConnectedModalOpen = false;
	};

	const onDisconnectClick = async () => {
		isIntentionallyDisconnecting = true;
		cancellationToken.isCanceled = false;
		if ($device?.gatt?.connected) {
			$device.gatt.disconnect();
		}
		unselectDevice();
		isConnectedModalOpen = false;
	};

	const onDisconnectedListener = async (_: Event) => {
		if(isIntentionallyDisconnecting) {
			isIntentionallyDisconnecting = false;
		} else if(!isIntentionallyDisconnecting && $device) {
			toaster.error({ title: 'The connection to the BlueRetro device was lost. Attempting to reestablish a connection' });
			deviceConfig.set(undefined);
			service.set(undefined);
			await initializeDevice();
		}
	}

	const onConnectCancelClick = () => {
		cancellationToken.isCanceled = true;
		unselectDevice();
		isGettingService = false;
	}

	const onSelectDeviceClick = async () => {
		cancellationToken.isCanceled = false;
		await initializeDevice();
	}

	$effect(() => {
		$device?.addEventListener('gattserverdisconnected', onDisconnectedListener)
	})
</script>

<Modal
	open={isDrawerOpen}
	onOpenChange={(e: any) => (isDrawerOpen = e.open)}
	triggerBase="btn preset-tonal"
	contentBase="bg-surface-100-900 p-4 space-y-4 shadow-xl w-64 h-screen"
	positionerJustify="justify-start"
	positionerAlign=""
	positionerPadding=""
	transitionsPositionerIn={{ x: -480, duration: 200 }}
	transitionsPositionerOut={{ x: -480, duration: 200 }}
>
	{#snippet content()}
		<NavigationMenu onItemSelect={() => (isDrawerOpen = false)} />
	{/snippet}
</Modal>
<!-- App Shell -->
<div class="overflow-hidden h-dvh flex flex-col">
	<!-- App Bar -->
	<header class="preset-filled-surface-100-900 border-bottom p-2 md:p-2 flex flex-row  items-center justify-between">
		<div class="flex flex-row md:gap-4 gap-2 items-center">
			
			<button class="btn md:hidden" onclick={onMenuClick}>
				<IconMenu2 />
			</button>
			<img src="{base}/icon.png" alt="blueretro icon" class="h-9 md:pl-2" />
			<strong class="text-xl">BlueRetro</strong>
		</div>
		<div>
			<a
				class="btn-icon"
				href="https://discord.gg/EXqV7W8MtY"
				target="_blank"
				rel="noreferrer"
			>
				<IconBrandDiscord />
			</a>
			<a
				class="btn-icon"
				href="https://github.com/darthcloud/BlueRetro"
				target="_blank"
				rel="noreferrer"
			>
				<IconBrandGithub />
			</a>
		</div>
	</header>
	<div class="flex flex-row overflow-hidden flex-1">
		<aside
			class="bg-surface-500/5 md:p-4 sticky top-0 w-64 hidden h-screen md:block"
		>
			<NavigationMenu />
		</aside>
		<div class="flex-1 flex flex-col max-w-2xl">
			<div class="p-2 md:p-4 gap-4 flex lg:flex-row flex-col">
				{#if isGettingService}
					<div
						class="flex flex-1 flex-col text-xl font-bold gap-4"
					>
						<div class="flex flex-row justify-center" >
							Connecting...
						</div>
						<ActivityProgress 
							progress={null} 
							onCancelClick={onConnectCancelClick} 
							isDoingSomething={true}
						/>
					</div>
					
				{:else if $deviceConfig && $device}
						<Modal
							open={isConnectedModalOpen}
							onOpenChange={(e: any) => (isConnectedModalOpen = e.open)}
							triggerBase="btn btn preset-tonal border rounded-base border-tertiary-500"
							contentBase="p-4 space-y-4 shadow-xl max-w-screen-sm"
							backdropClasses="backdrop-blur-sm"
						>
							{#snippet trigger()}
								<!-- <button class="btn btn-icon h-10"> -->
								<IconBluetoothConnected class="h-10" />

								<div class="flex flex-col" >
									<div class="flex md:flex-row md:gap-4 flex-col" >
										<div class="flex flex-row gap-1">
											<div class="font-bold"> Connection:</div>
											{$device?.name || '...'} 
										</div>
										<div class="flex flex-row gap-1">
											<div class="font-bold">Version:</div>
											{$deviceConfig?.appVersion || '...'}
										</div>
									</div>
									<div class="flex flex-row gap-1 md:justify-center">
										<div class="font-bold">Address:</div>
										{$deviceConfig?.bluetoothAddress || '...'}
									</div>
								</div>
								<!-- </button> -->
							{/snippet}
							{#snippet content()}
								<div class="card p-4 max-w-sm">
									<div class="grid grid-cols-1 gap-2">
										<button class="btn" onclick={onDisconnectClick}>Disconnect</button>
										<button class="btn" onclick={onSwitchDeviceClick}>Switch Device</button>
									</div>
									<div class="arrow bg-surface-100-900"></div>
								</div>
							{/snippet}
						</Modal>
						{#if upgradeAvailable}
							<a class="btn preset-tonal-tertiary border rounded-base border-tertiary-500" href="/system/update">
								Upgrade Available!
								<IconDownload class="size-4" />
							</a>
						{/if}
				{:else}
					<div class="flex-col">
						<div class="flex gap-4 items-center">
							<button type="button" class="btn preset-filled-primary-500" onclick={onSelectDeviceClick}>
								Select Device
							</button>
						</div>

						<p class="text-sm">Disconnect all controllers from BlueRetro before connecting.</p>
					</div>
				{/if}
			</div>

			<div class="p-2 md:p-4 flex flex-col gap-4 max-w-2xl overflow-auto flex-1">
				{@render children?.()}
			</div>
		</div>
	</div>
	<!-- Page Route Content -->
</div>

<Toaster {toaster}></Toaster>
