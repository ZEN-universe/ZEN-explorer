<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		title: string;
	}

	let { children, title }: Props = $props();
	let id = $props.id();
</script>

<div class="accordion-item">
	<h2 class="accordion-header">
		<button
			class="accordion-button"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target={'#collapse' + id}
			aria-expanded="true"
			aria-controls={'collapse' + id}
		>
			{title}
		</button>
	</h2>
	<div id={'collapse' + id} class="accordion-collapse collapse show">
		<div class="accordion-body">
			{@render children?.()}
		</div>
	</div>
</div>
