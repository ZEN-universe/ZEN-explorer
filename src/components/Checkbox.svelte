<script lang="ts">
	interface Props {
		label: string;
		value: boolean;
		disabled?: boolean;
		onUpdate?: (value: boolean) => void;
	}

	let { label, value = $bindable(), disabled = false, onUpdate = () => {} }: Props = $props();
</script>

<h3>{label}</h3>
<input
	type="checkbox"
	class="btn-check"
	id="btn-check-outlined"
	autocomplete="off"
	bind:checked={value}
	onchange={() => onUpdate(value)}
	{disabled}
/>
<label class="btn btn-outline-primary" for="btn-check-outlined">
	{value ? 'on' : 'off'}
</label>
