<script lang="ts">
	import {
		brUuid,
		cfg_cmd_sys_deep_sleep,
		cfg_cmd_sys_factory,
		cfg_cmd_sys_reset
	} from '$lib/constants';
	import { isFullyInitialized } from '$lib/stores';
	import { getService, toaster } from '$lib/utilities';
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';

	let isDoingSomething = $state(false);
	let isSettingDeepSleep = $state(false);
	let isResetting = $state(false);
	let isFactoryResetting = $state(false);

	const setDeepSleep = async () => {
		isDoingSomething = true;
		isSettingDeepSleep = true;
		try {
			const serv = await getService();
			const chrc = await serv.getCharacteristic(brUuid[7]);
			await chrc.writeValue(new Uint8Array([cfg_cmd_sys_deep_sleep]));
			toaster.success({ title: `Success puting device to sleep.`});
		} catch (error) {
			toaster.error({ title: `Hardware and firmware mismatch!`});
			console.log('error putting device to sleep', error);
		}
		isSettingDeepSleep = false;
		isDoingSomething = false;
	};

	const setReset = async () => {
		isDoingSomething = true;
		isResetting = true;
		try {
			const serv = await getService();
			const chrc = await serv.getCharacteristic(brUuid[7]);
			await chrc.writeValue(new Uint8Array([cfg_cmd_sys_reset]));
			toaster.success({ title: `Success resetting the device.`});
		} catch (error) {
			toaster.error({ title: `Error resetting the device!`});
			console.log('error resetting the device', error);
		}
		isResetting = false;
		isDoingSomething = false;
	};

	const setFactoryReset = async () => {
		isDoingSomething = true;
		isFactoryResetting = true;
		try {
			const serv = await getService();
			const chrc = await serv.getCharacteristic(brUuid[7]);
			await chrc.writeValue(new Uint8Array([cfg_cmd_sys_factory]));
			toaster.success({ title: `Success factory resetting the device.`});
		} catch (error) {
			toaster.error({ title: `Error factory resetting the device!`});
			console.log('error factory resetting the device', error);
		}
		isDoingSomething = false;
		isFactoryResetting = false;
	};
</script>

<div class="flex flex-col md:flex-row gap-4">
	<button
		onclick={setDeepSleep}
		disabled={!$isFullyInitialized || isDoingSomething}
		class="btn preset-tonal border border-surface-500 flex-row gap-4"
	>
		Deep Sleep
		{#if isSettingDeepSleep}
			<ProgressRing classes="w-6 h-6" value={null} />
		{/if}
	</button>
	<button
		onclick={setReset}
		disabled={!$isFullyInitialized || isDoingSomething}
		class="btn preset-tonal border border-surface-500 flex-row gap-4"
	>
		Reset
		{#if isResetting}
			<ProgressRing classes="w-6 h-6" value={null} />
		{/if}
	</button>
	<button
		onclick={setFactoryReset}
		disabled={!$isFullyInitialized || isDoingSomething}
		class="btn preset-tonal border border-surface-500 flex-row gap-4"
	>
		Factory Reset
		{#if isFactoryResetting}
			<ProgressRing classes="w-6 h-6" value={null} />
		{/if}
	</button>
</div>
