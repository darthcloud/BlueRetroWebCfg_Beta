<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';

	interface Props {
		onItemSelect?: VoidFunction;
	}

	let classesActive = $derived((href: string) =>
		page.url.pathname.includes(href) ? '!preset-filled-primary-500 pl-6 rounded' : 'pl-4');
	
	let { onItemSelect = $bindable() }: Props = $props();
</script>

<nav class="list-nav">
	<ul>
		<p class="font-bold text-xl">Controller</p>
		<li class="flex flex-col">
			<a
				onclick={onItemSelect}
				class={classesActive('/controller/global')}
				href="{base}/controller/global">Global</a
			>
		</li>
		<li class="flex flex-col">
			<a
				onclick={onItemSelect}
				class={classesActive('/controller/output')}
				href="{base}/controller/output">Output</a
			>
		</li>
		<li class="flex flex-col">
			<a onclick={onItemSelect} class={classesActive('/controller/n64')} href="{base}/controller/n64"
				>N64 Controller Pack</a
			>
		</li>
		<li class="flex flex-col">
			<a onclick={onItemSelect} class={classesActive('/controller/dcvmu')} href="{base}/controller/dcvmu"
				>DC VMU Manager</a
			>
		</li>
		<p class="font-bold text-xl">Button Mappings</p>
		<li class="flex flex-col">
			<a
				onclick={onItemSelect}
				class={classesActive('/controller/presets')}
				href="{base}/controller/presets">Presets</a
			>
		</li>
		<li class=" flex flex-col">
			<a
				onclick={onItemSelect}
				class={classesActive('/controller/buttons')}
				href="{base}/controller/buttons">Custom</a
			>
		</li>

		<p class="font-bold text-xl">System</p>
		<li class="flex flex-col">
			<a onclick={onItemSelect} class={classesActive('/system/files')} href="{base}/system/files"
				>Files</a
			>
		</li>
		<li class="flex flex-col">
			<a onclick={onItemSelect} class={classesActive('/system/manage')} href="{base}/system/manage"
				>Manage</a
			>
		</li>
		<li class="flex flex-col">
			<a onclick={onItemSelect} class={classesActive('/system/update')} href="{base}/system/update"
				>Update</a
			>
		</li>
		<li class="flex flex-col">
			<a onclick={onItemSelect} class={classesActive('/system/debug')} href="{base}/system/debug"
				>Debug</a
			>
		</li>
	</ul>
</nav>
