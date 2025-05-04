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

<div class="form-check form-switch">
	<input
		class="form-check-input"
		type="checkbox"
		role="switch"
		id={`switch-check-${id}`}
		bind:checked={value}
		onchange={dispatchEvent}
	/>
	<label class="form-check-label" for={`switch-check-${id}`}>
		{value ? texts[0] : texts[1]}
	</label>
</div>
