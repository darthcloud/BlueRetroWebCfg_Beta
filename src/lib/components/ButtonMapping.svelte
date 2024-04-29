<script lang="ts">
	import { Slider } from '@skeletonlabs/skeleton-svelte';
	import {
		btnList,
		maxOutput,
		maxMax,
		maxThres,
		turboMask,
		scaling as scalingOptions,
		diagScaling
	} from '$lib/constants';
	import { IconChevronDown, IconChevronUp, IconX } from '@tabler/icons-svelte';

	const turboOptions: { [key: string]: number } = turboMask;


	interface Props {
		sourceSystem: number;
		destinationSystem: number;
		onRemoveClicked: (index: number) => void;
		index: number;
		source?: number | undefined;
		destination?: number | undefined;
		destinationId?: number | undefined;
		max?: number;
		threshold?: number;
		deadzone?: number;
		turbo?: number | undefined;
		scaling?: number | undefined;
		diagonal?: number | undefined;
		hideNotSelected: boolean
	}

	let {
		sourceSystem,
		destinationSystem,
		onRemoveClicked,
		index,
		hideNotSelected,
		source = $bindable(undefined),
		destination = $bindable(undefined),
		destinationId = $bindable(undefined),
		max = $bindable(100),
		threshold = $bindable(50),
		deadzone = $bindable(135),
		turbo = $bindable(undefined),
		scaling = $bindable(undefined),
		diagonal = $bindable(undefined)
	}: Props = $props();

	let isShowingMore = $state(false);

	const toggleShowMore = () => {
		isShowingMore = !isShowingMore;
	};
let shouldBeHidden = $derived( hideNotSelected 
	&& !btnList[source ?? -1][sourceSystem]
	&& !btnList[destination ?? -1][destinationSystem]
)

</script>

{#if !shouldBeHidden}
	
<div class="border rounded-base border-primary-500 flex flex-col gap-4">
	<div class="flex flex-row flex-start gap-4 justify-between">
		<div class="flex flex-col gap-4 pl-4 pt-4 flex-1">
			<div class="flex flex-col gap-4 md:flex-row">
				<label class="label">
					<span>Source</span>
					<select class="select" bind:value={source}>
						{#each btnList as button, i}
							<option value={i}>{button[sourceSystem]}</option>
						{/each}
					</select>
				</label>

				<label class="label ">
					<span>Destination</span>
					<select class="select" bind:value={destination}>
						{#each btnList as button, i}
							<option value={i}>{button[destinationSystem]}</option>
						{/each}
					</select>
				</label>

				<label class="label">
					<span>Destination ID</span>
					<select class="select" bind:value={destinationId}>
						{#each { length: maxOutput } as _, i}
							<option value={i}>{i + 1}</option>
						{/each}
					</select>
				</label>
			</div>
			{#if isShowingMore}
				<Slider 
					name="range-slider" 
					value={[max]} 
					max={maxMax} 
					markers={[...Array(Math.floor(maxMax / 15)).keys().map(x => x * 15), maxMax]} 
					onValueChange={(e) => (max = e.value[0])}
					step={5}
				/>
				<div class="flex justify-between items-center">
					<div class="font-bold">Max</div>
					<div class="text-xs">{max} / {maxMax}</div>
				</div>
				<Slider 
					name="range-slider" 
					value={[threshold]} 
					max={maxThres} 
					step={5} 
					markers={[...Array(Math.floor(maxThres / 5)).keys().map(x => x * 5), maxThres]}
					onValueChange={(e) => (threshold = e.value[0])}
				/>
				<div class="flex justify-between items-center">
					<div class="font-bold">Threshold</div>
					<div class="text-xs">{threshold} / {maxThres}</div>
				</div>
				<Slider 
					name="range-slider" 
					value={[deadzone]} 
					max={maxMax} 
					markers={[...Array(Math.floor(maxMax / 15)).keys().map(x => x * 15), maxMax]} 
					onValueChange={(e) => (deadzone = e.value[0])}
					step={5}
					
				/>
				<div class="flex justify-between items-center">
					<div class="font-bold">Deadzone</div>
					<div class="text-xs">{deadzone / 1000}% / {maxMax / 1000}%</div>
				</div>
				<div class="flex flex-col gap-4 md:flex-row">
					<label class="label">
						<span>Turbo</span>
						<select class="select" bind:value={turbo}>
							{#each Object.keys(turboOptions) as turboOption}
								<option value={turboOptions[turboOption]}>{turboOption}</option>
							{/each}
						</select>
					</label>
					<label class="label">
						<span>Scaling</span>
						<select class="select" bind:value={scaling}>
							{#each scalingOptions as scalingOption, i}
								<option value={i}>{scalingOption}</option>
							{/each}
						</select>
					</label>
					<label class="label">
						<span>Diagonal Scaling</span>
						<select class="select" bind:value={diagonal}>
							{#each diagScaling as scalingOption, i}
								<option value={i}>{scalingOption}</option>
							{/each}
						</select>
					</label>
				</div>
			{/if}
		</div>

		<div>
			<button type="button" class="btn-icon" onclick={() => onRemoveClicked(index)}>
				<IconX />
			</button>
		</div>
	</div>

	<div class="flex flex-row justify-center">
		<button class="btn btn-sm" onclick={toggleShowMore}>
			Show {isShowingMore ? 'Less' : 'More'}
			{#if isShowingMore}
				<IconChevronUp />
			{:else}
				<IconChevronDown />
			{/if}
		</button>
	</div>
</div>
{/if}

