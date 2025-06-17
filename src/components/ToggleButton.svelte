<script lang="ts">
	interface Props {
		formId: string;
		value: boolean;
		texts?: string[];
		onUpdate?: () => void;
	}

	let { formId, value = $bindable(), texts = ['on', 'off'], onUpdate }: Props = $props();
	let id = $props.id();

	function dispatchEvent() {
		onUpdate?.();
	}
</script>

<div class="form-check form-switch">
	<input
		class="form-check-input"
		type="checkbox"
		role="switch"
		id={formId}
		bind:checked={value}
		onchange={dispatchEvent}
	/>
	<label class="form-check-label" for={formId}>
		{value ? texts[0] : texts[1]}
	</label>
</div>
