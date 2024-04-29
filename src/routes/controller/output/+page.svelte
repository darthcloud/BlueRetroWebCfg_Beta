<script lang="ts">
	import { service, isFullyInitialized } from '$lib/stores';
	import { devCfg as outputModes, accCfg as accessories, maxOutput, brUuid } from '$lib/constants';
	import { getService, toaster } from '$lib/utilities';
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';

	let output: number = $state(0);
	let accessory: number = $state(0);
	let mode: number = $state(0);
	let isDoingSomething = $state(false);

	const loadOutputConfig = async () => {
		isDoingSomething = true;
		try {
			const serv = await getService();
			let chrc = await serv.getCharacteristic(brUuid[2]);
			await chrc.writeValue(new Uint16Array([output]));

			chrc = await serv.getCharacteristic(brUuid[3]);
			const value = await chrc.readValue();

			mode = value.getUint8(0);
			accessory = value.getUint8(1);
		} catch (error) {
			console.log(
				`There was and error trying to retrieve your configuration for output ${output + 1}`,
				error
			);
			toaster.error({ title: `There was an error trying to retrieve your configuration for output ${output + 1}!`});
		}
		isDoingSomething = false;
	};

	const saveOutputConfig = async () => {
		const serv = await getService();
		isDoingSomething = true;
		try {
			var data = new Uint8Array([mode, accessory]);
			let chrc = await serv.getCharacteristic(brUuid[2]);

			var outputCtrl = new Uint16Array([output]);
			await chrc.writeValue(outputCtrl);

			chrc = await serv.getCharacteristic(brUuid[3]);
			await chrc.writeValue(data);
			toaster.success({ title: `Success updating output ${output + 1}`});
		} catch (error) {
			console.log(`There was and error trying to save output ${output + 1}`, error);
			toaster.error({ title: `There was an error trying to save output ${output + 1}!`});
		}
		isDoingSomething = false;
	};

	$effect.pre(() => {
		if($isFullyInitialized) {
			loadOutputConfig();
		}
	})
</script>

<label class="label">
	<span>Output #</span>
	<select
		class="select"
		bind:value={output}
		onchange={loadOutputConfig}
		disabled={!$isFullyInitialized || isDoingSomething}
	>
		{#each { length: maxOutput } as _, i}
			<option value={i}>{i + 1}</option>
		{/each}
	</select>
</label>
<label class="label">
	<span>Mode</span>
	<select class="select" bind:value={mode} disabled={!$isFullyInitialized || isDoingSomething}>
		{#each outputModes as outputMode, i}
			<option value={i}>{outputMode}</option>
		{/each}
	</select>
</label>
<label class="label">
	<span>Accessories</span>
	<select class="select" bind:value={accessory} disabled={!$isFullyInitialized || isDoingSomething}>
		{#each accessories as accessory, i}
			<option value={i}>{accessory}</option>
		{/each}
	</select>
</label>
<button
	disabled={!$isFullyInitialized || isDoingSomething}
	onclick={saveOutputConfig}
	type="button"
	class="btn preset-filled flex flex-row gap-4"
>
	Save
	{#if $isFullyInitialized && isDoingSomething}
		<ProgressRing classes="w-6 h-6" value={null} />
	{/if}
</button>
