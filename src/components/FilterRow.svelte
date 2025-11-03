<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		content: Snippet<[string]>;
	}
	let { label, content: children }: Props = $props();
	let id: string = $props.id();
</script>

<div class="mb-2">
	<div class="uppercase text-gray-600 dark:text-gray-400 tracking-wide text-sm mb-1">
		<label for={id} class="fw-medium fs-4">{label}</label>
	</div>
	<div>
		{@render children(id)}
	</div>
</div>
