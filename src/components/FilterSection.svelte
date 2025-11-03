<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		title: string;
	}

	let { children, title }: Props = $props();
	let id = $props.id();
</script>

<div class="">
	<h3 class="sr-only">
		<button
			class=""
			type="button"
			data-bs-toggle="collapse"
			data-bs-target={'#collapse' + id}
			aria-expanded="true"
			aria-controls={'collapse' + id}
		>
			{title}
		</button>
	</h3>
	<div id={'collapse' + id}>
		<div class="">
			{@render children?.()}
		</div>
	</div>
</div>
