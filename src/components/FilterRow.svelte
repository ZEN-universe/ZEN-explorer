<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		content: Snippet<[string]>;
	}
	let { label, content: children }: Props = $props();
	let id: string = $props.id();
</script>

<div class="row mb-2">
	<div class="col-sm-3">
		<label for={id} class="fw-medium fs-4">{label}</label>
	</div>
	<div class="col-sm-9">
		{@render children(id)}
	</div>
</div>
