<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		formId?: string;
		label: string;
		rightSide?: Snippet;
	}
	let { formId, label, rightSide }: Props = $props();
</script>

<div class="mb-1 flex items-center justify-between">
	<div class="text-sm tracking-wide text-gray-600 uppercase dark:text-gray-400">
		{#if formId}
			<label for={formId} class="fw-medium fs-4">{label}</label>
		{:else}
			<div class="fw-medium fs-4">{label}</div>
		{/if}
	</div>

	{@render rightSide?.()}
</div>
