<script lang="ts">
	import { onMount } from 'svelte';
	import { btn, maxMainInput } from '$lib/constants';
	import { isFullyInitialized } from '$lib/stores';
	import type { IPreset, IPresetFile } from '$lib/interfaces';
	import { getService, toaster, writeInputConfig } from '$lib/utilities';
	import { GameId } from '$lib/components';
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';
	import { base } from '$app/paths';

	const consoles: { [key: string]: IPreset[] } = $state({});
	let preset: IPreset | undefined = $state(undefined);
	let konsole: string | undefined = $state(undefined);
	let input: number = $state(0);
	let isDoingSomething = $state(false);
	let gameId: string = $state('');
	let configType: ControllerConfigType = $state('global');

	const getFiles = async (): Promise<IPresetFile[]> => {
		const response = await fetch(
			'https://api.github.com/repos/darthcloud/BlueRetroWebCfg/contents/map/'
		);
		return response.json();
	};

	const fetchMap = async (files: IPresetFile[]) => {
		files.forEach(async (presetFile) => {
			const response = await fetch(`${base}/config/presets/` + presetFile.name);
			const p: IPreset = await response.json();
			consoles[p.console] = [...(consoles[p.console] || []), p];
		});
	};

	const savePresetInput = async () => {
		const btnMap: { [key: string]: number } = btn;
		isDoingSomething = true;
		if (preset && $isFullyInitialized) {
			var nbMapping = preset.map.length;
			var cfgSize = nbMapping * 8 + 3;
			var cfg = new Uint8Array(cfgSize);
			var j = 0;
			cfg[j++] = 0;
			cfg[j++] = 0;
			cfg[j++] = nbMapping;
			for (var i = 0; i < nbMapping; i++) {
				cfg[j++] = btnMap[preset.map[i][0]];
				cfg[j++] = btnMap[preset.map[i][1]];
				cfg[j++] = +preset.map[i][2] + input;
				cfg[j++] = +preset.map[i][3];
				cfg[j++] = +preset.map[i][4];
				cfg[j++] = +preset.map[i][5];
				cfg[j++] = +preset.map[i][6];
				cfg[j++] = +preset.map[i][7] | (+preset.map[i][8] << 4);
			}

			try {
				await writeInputConfig(input, cfg, await getService());
				toaster.success({ title: `Success updating output configuration!`});
			} catch (error) {
				console.log('there was an error writing your preset configuration', error);
				toaster.error({ title: `There was an error saving`});
			}
		}
		isDoingSomething = false;
	};

	onMount(async () => {
		isDoingSomething = true;
		try {
			const configFiles = await getFiles();
			await fetchMap(configFiles);
		} catch (error) {
			console.log('there was an error fetching the presets', error);
			toaster.error({ title: `There was an error fetching the presets`});
		}
		isDoingSomething = false;
	});

	let saveButtonEnabled = $derived(preset);
</script>

<GameId bind:gameId bind:configType />

<label class="label">
	<span>Input #</span>
	<select class="select" bind:value={input} disabled={!$isFullyInitialized || isDoingSomething}>
		{#each { length: maxMainInput } as _, i}
			<option value={i}>{i + 1}</option>
		{/each}
	</select>
</label>

<label class="label">
	<span>Console</span>
	<select
		class="select"
		bind:value={konsole}
		onchange={() => {
			preset = undefined;
		}}
		disabled={!$isFullyInitialized || isDoingSomething}
	>
		{#if configType !== 'console'}
			<option>Any</option>
		{/if}
		{#each Object.keys(consoles) as console}
			<option value={console}>{console}</option>
		{/each}
	</select>
</label>

<label class="label">
	<span>Preset</span>
	<select class="select" bind:value={preset} disabled={!$isFullyInitialized || isDoingSomething}>
		{#if konsole && (konsole !== 'Any' || configType === 'console')}
			{#each consoles[konsole] as preset}
				<option value={preset}>{preset.name}</option>
			{/each}
		{:else if konsole === 'Any' }
			{#each Object.keys(consoles) as konsole}
				{#each consoles[konsole] as preset}
					<option value={preset}>{preset.name}</option>
				{/each}
			{/each}
		{/if}
	</select>
</label>

<button
	onclick={savePresetInput}
	type="button"
	class="btn preset-filled flex-row gap-4"
	disabled={!saveButtonEnabled || !$isFullyInitialized || isDoingSomething}
>
	Save
	{#if $isFullyInitialized && isDoingSomething}
		<ProgressRing classes="w-6 h-6" value={null} />
	{/if}
</button>
