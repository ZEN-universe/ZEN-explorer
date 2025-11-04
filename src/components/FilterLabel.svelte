<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		formId?: string;
		label: string;
		rightSide?: Snippet;
	}
	let { formId, label, rightSide }: Props = $props();
</script>

<div class="flex justify-between items-center mb-1">
	<div class="uppercase text-gray-600 dark:text-gray-400 tracking-wide text-sm">
		{#if formId}
			<label for={formId} class="fw-medium fs-4">{label}</label>
		{:else}
			<div class="fw-medium fs-4">{label}</div>
		{/if}
	</div>

	{@render rightSide?.()}
</div>
