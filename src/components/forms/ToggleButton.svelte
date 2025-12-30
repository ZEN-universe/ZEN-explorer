<script lang="ts">
	import FilterLabel from '$components/FilterLabel.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		value: boolean;
		texts?: string[];
		label: string;
		helpText?: Snippet;
		disabled?: boolean;
		onUpdate?: () => void;
	}

	let {
		value = $bindable(),
		texts = ['on', 'off'],
		label,
		helpText,
		disabled = false,
		onUpdate
	}: Props = $props();
	const formId = $props.id();

	function dispatchEvent() {
		onUpdate?.();
	}
</script>

<FilterLabel {label} {formId} {helpText}></FilterLabel>

<div class="relative mb-2">
	<input
		class="appearance-none absolute inset-y-0 w-12"
		type="checkbox"
		role="switch"
		id={formId}
		bind:checked={value}
		{disabled}
		onchange={dispatchEvent}
	/>
	<label class={['inline-flex', disabled && 'opacity-50 cursor-not-allowed']} for={formId}>
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
