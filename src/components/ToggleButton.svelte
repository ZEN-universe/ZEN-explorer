<script lang="ts">
	interface Props {
		value: boolean;
		texts?: string[];
		change: () => void;
	}

	let { value = $bindable(), texts = ['on', 'off'], change }: Props = $props();
	let id = $props.id();

	function dispatchEvent() {
		change();
	}
</script>

<div class="toggle">
	<input
		type="checkbox"
		class="btn-check"
		id={`btn-check-outlined-${id}`}
		bind:checked={value}
		onchange={dispatchEvent}
	/>
	<label class="btn btn-outline-primary btn-sm" for={`btn-check-outlined-${id}`}>
		{value ? texts[0] : texts[1]}
	</label>
</div>
