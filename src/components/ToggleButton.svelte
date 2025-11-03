<script lang="ts">
	interface Props {
		value: boolean;
		texts?: string[];
		label: string;
		onUpdate?: () => void;
	}

	let { value = $bindable(), texts = ['on', 'off'], label, onUpdate }: Props = $props();
	const formId = $props.id();

	function dispatchEvent() {
		onUpdate?.();
	}
</script>

<div class="uppercase text-gray-600 dark:text-gray-400 tracking-wide text-sm mb-1">
	<div class="fw-medium fs-4">{label}</div>
</div>

<div class="relative mb-2">
	<input
		class="appearance-none absolute inset-y-0 w-12"
		type="checkbox"
		role="switch"
		id={formId}
		bind:checked={value}
		onchange={dispatchEvent}
	/>
	<label class="inline-flex" for={formId}>
		<div
			class={[
				'h-6 w-12 rounded-full flex me-2 px-1',
				value ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'
			]}
		>
			<div
				class={[
					'bg-white h-4 w-4 rounded-full transition-transform duration-300 mt-1',
					value ? 'translate-x-6' : ''
				]}
			></div>
		</div>
		{value ? texts[0] : texts[1]}
	</label>
</div>
