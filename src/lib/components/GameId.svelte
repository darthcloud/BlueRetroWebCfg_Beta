<script lang="ts">
	import {
		brUuid,
		cfg_cmd_get_cfg_src,
		cfg_cmd_set_default_cfg,
		cfg_cmd_set_gameid_cfg
	} from '$lib/constants';
	import { deviceConfig, isFullyInitialized } from '$lib/stores';
	import { getGameId, getGameName, toaster, getService } from '$lib/utilities';
	import { Segment, Tooltip } from '@skeletonlabs/skeleton-svelte';
	import { IconInfoCircle, IconRefresh } from '@tabler/icons-svelte';

	interface Props {
		gameId: string;
		configType: ControllerConfigType
	}

	let { 
		gameId = $bindable(),
		configType = $bindable('global'),
	}: Props = $props();
	let gameName: string | undefined = $state();
	let isTooltipOpen: boolean = $state(false);
	let isRefreshingGame: boolean = $state(false);

	const tooltip = 'You can modify the button mappings globally, per console, or on a per game basis.' + 
	' If you wish to modify the mappings for a specific game, have the game turned on and controller '+ 
	'disconnected before pressing the Game ID button.  You can also press the refresh button to update the selected game.'


	const getConfigSource = async (): Promise<ControllerConfigType> => {
		const serv = await getService();
		const cmd_chrc = await serv.getCharacteristic(brUuid[7]);
		await cmd_chrc.writeValue(new Uint8Array([cfg_cmd_get_cfg_src]));
		const value = await cmd_chrc.readValue();
		return value.getUint8(0) === 0 ? 'global' : 'gameid';
	};

	const setConfig = async (configValue: number) => {
		const serv = await getService();
		const chrc = await serv.getCharacteristic(brUuid[7]);
		await chrc.writeValue(new Uint8Array([configValue]));
	};

	const setDefaultConfig = async () => {
		await setConfig(cfg_cmd_set_default_cfg);
	};

	const setGameIdConfig = async () => {
		await setConfig(cfg_cmd_set_gameid_cfg);
	};

	const onChange = async (e: any) => {
		configType = e.value;
		if (configType === 'gameid' || configType === 'console') {
			if(!gameId) {
				try {
					isRefreshingGame = true;
					await setGameIdConfig();
					deviceConfig.update((c) => ({
						...c,
						source: 'gameid'
					}));
					await refreshGame();
				} catch (error) {
					console.log('there was an error switching to gameid mode', error);
					toaster.error({ title: 'There was an error switching to gameid mode'});
				}
			}
		} else {
			try {
				await setDefaultConfig();
				deviceConfig.update((c) => ({
					...c,
					source: 'global'
				}));
				gameId = '';
				gameName = '';
			} catch (error) {
				console.log('there was an error switching to global mode', error);
				toaster.error({ title: 'There was an error switching to global mode'});
			}
		}
	};

	const refreshGame = async () => {
		isRefreshingGame = true;
		try{
			const serv = await getService();
			gameId = await getGameId(serv);
			console.log('game id detected: ', gameId);
			gameName = (await getGameName(gameId))?.toString() || '';
			console.log('game name: ', gameName);

		} catch (error) {
			console.log('there was an error refreshing the game data', error);
			toaster.error({ title: 'There was an error refreshing the game data'});
		}
		isRefreshingGame = false;
	}

</script>

<div class="flex flex-col gap-1 h-24 shrink-0 mb-1">
	<!-- svelte-ignore a11y_label_has_associated_control -->

	<label class="label flex flex-row gap-2 align-center font-bold">
		Configuration Options
		<Tooltip
		open={isTooltipOpen}
		onOpenChange={(e) => (isTooltipOpen = e.open)}
		positioning={{ placement: 'bottom' }}
		triggerBase="underline"
		contentBase="card preset-filled p-4 w-2xs md:w-96"
		openDelay={200}
		zIndex={"2"}
		>
		{#snippet trigger()}<IconInfoCircle onclick={() => (isTooltipOpen = true)} />{/snippet}
		{#snippet content()}
			<div class=" text-pretty wrap-break-word" >
				{tooltip}
			</div>
		{/snippet}
		</Tooltip>
	</label>
	
	<div class="flex flex-row gap-2 md:gap-4">
		<Segment
			onValueChange={onChange}
			value={configType}
			name="configType"
			disabled={!$isFullyInitialized}
			classes="align-center md:gap-2"
			indicatorBg="bg-surface-500"
			gap="1"
		>
			<Segment.Item value="global">Global</Segment.Item>
			<Segment.Item value="console">Console</Segment.Item>
			<Segment.Item value="gameid">Game ID</Segment.Item>
		</Segment>
		<button 
			disabled={!$isFullyInitialized}
			onclick={refreshGame}
			class="btn preset-tonal border border-surface-300">
			<IconRefresh class="size-4" />
		</button>
	</div>

	{#if !isRefreshingGame }
		{#if configType === 'gameid'}
			{#if gameName}
				<p class="text-sm">
					Selected Game: <span class="font-bold">{gameName}</span>
				</p>
			{:else}
				<p class="text-sm">
					No game detected.  Please insert a game and press the refresh button.
				</p>
			{/if}
			
		{:else if configType === 'console'}
			{#if gameName}
				<p class="text-sm">
					A game is inserted.  Please remove the game and press the refresh button.
				</p>
			{:else}
				<p class="text-sm">
					Selected Console: <span class="font-bold">{gameId}</span>
				</p>
			{/if}
		{/if}
	{/if}
	
	
</div>
