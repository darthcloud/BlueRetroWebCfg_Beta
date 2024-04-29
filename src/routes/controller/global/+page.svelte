<script lang="ts">
	import { deviceConfig, isFullyInitialized } from '$lib/stores';
	import {
		systemCfg as systems,
		multitapCfg as multitaps,
		inquiryMode as inquiryModes,
		brUuid
	} from '$lib/constants';
	import type { IGlobalConfig } from '$lib/interfaces';
	import { getService, toaster } from '$lib/utilities';
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';

	let system: number = $state(0);
	let multitap: number = $state(0);
	let inquiryMode: number | undefined = $state();
	let bank: number | undefined = $state();

	let isDoingSomething = $state(false);

	const getApiVersion = async () => {
		console.log('Reading Api version...');
		const serv = await getService();
		const characteristics = await serv.getCharacteristic(brUuid[6]);
		const dataview = await characteristics.readValue();
		return dataview.getUint8(0);
	};

	const loadGlobalConfig = async () => {
		isDoingSomething = true;
		try {
			const serv = await getService();
			const charactristic = await serv.getCharacteristic(brUuid[1]);
			const dataview = await charactristic.readValue();

			const globalConfig: IGlobalConfig = {
				apiVersion: await getApiVersion(),
				system: dataview.getUint8(0),
				multitap: dataview.getUint8(1)
			};

			if (globalConfig.apiVersion > 0) {
				globalConfig.inquiryMode = dataview.getUint8(2);
			}
			if (globalConfig.apiVersion > 1) {
				globalConfig.bank = dataview.getUint8(3);
			}

			deviceConfig.update((c) => ({
				...c,
				globalConfig
			}));

			system = globalConfig.system;
			multitap = globalConfig.multitap;
			inquiryMode = globalConfig.inquiryMode;
			bank = globalConfig.bank;
		} catch (error) {
			console.log('there was an error getting your current global config', error);
			toaster.error({ title: 'There was an error getting your current global config'});
		}

		isDoingSomething = false;
	};

	$effect.pre(() => {
		if (!!$isFullyInitialized && !$deviceConfig?.globalConfig) {
			console.log('loading global config');
			loadGlobalConfig();
		}
	});

	const saveGlobal = async () => {
		isDoingSomething = true;
		if ($deviceConfig?.globalConfig) {
			try {
				let globalConfig: Uint8Array;
				if ($deviceConfig.globalConfig.apiVersion > 1) {
					globalConfig = new Uint8Array(4);
				} else if ($deviceConfig.globalConfig.apiVersion > 0) {
					globalConfig = new Uint8Array(3);
				} else {
					globalConfig = new Uint8Array(2);
				}
				globalConfig[0] = system;
				globalConfig[1] = multitap;
				if ($deviceConfig.globalConfig.apiVersion > 0 && inquiryMode != undefined) {
					globalConfig[2] = inquiryMode;
				}
				if ($deviceConfig.globalConfig.apiVersion > 1 && bank != undefined) {
					globalConfig[3] = bank;
				}
				const serv = await getService();
				const chrc = await serv.getCharacteristic(brUuid[1]);
				await chrc.writeValue(globalConfig);

				deviceConfig.update((c) => ({
					...c,
					globalConfig: {
						apiVersion: c!.globalConfig!.apiVersion,
						multitap,
						system,
						bank,
						inquiryMode
					}
				}));
				toaster.success({ title: 'Success updating global configuration!'});

			} catch (error) {
				console.log('there was an error saving the global config', error);
				toaster.error({ title: 'There was an error saving the global config'});
			}
		}
		isDoingSomething = false;
	};
</script>

<label class="label">
	<span>System</span>
	<select class="select" bind:value={system} disabled={isDoingSomething || !$isFullyInitialized}>
		{#each systems as s, i}
			<option value={i}>{s}</option>
		{/each}
	</select>
</label>
<label class="label">
	<span>Multitap</span>
	<select class="select" bind:value={multitap} disabled={isDoingSomething || !$isFullyInitialized}>
		{#each multitaps as m, i}
			<option value={i}>{m}</option>
		{/each}
	</select>
</label>
<label class="label">
	<span>Inquiry Mode</span>
	<select class="select" bind:value={inquiryMode} disabled={isDoingSomething || !$isFullyInitialized}>
		{#each inquiryModes as m, i}
			<option value={i}>{m}</option>
		{/each}
	</select>
</label>
<label class="label">
	<span>Memory Card Bank</span>
	<select class="select" bind:value={bank} disabled={isDoingSomething || !$isFullyInitialized}>
		{#each { length: 4 } as _, i}
			<option value={i}>Bank {i + 1}</option>
		{/each}
		<option value={219}>Debug Mode</option>
	</select>
</label>

<button
	disabled={!$isFullyInitialized || isDoingSomething}
	type="button"
	class="btn preset-filled flex-row gap-4"
	onclick={saveGlobal}
>
	Save
	{#if $isFullyInitialized && isDoingSomething}
		<ProgressRing classes="w-6 h-6" value={null} />
	{/if}
</button>
