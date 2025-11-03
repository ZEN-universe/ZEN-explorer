<script lang="ts">
	interface Props {
		options: ({ value: string; label: string } | string)[];
		value: string;
		label: string;
		disabled?: boolean;
		onUpdate?: (newValue: string) => void;
	}

	let {
		options: initialOptions,
		value = $bindable(),
		label,
		disabled = false,
		onUpdate = () => {}
	}: Props = $props();

	let options = $derived.by(() => {
		return initialOptions.map((option) => {
			if (typeof option === 'string') {
				return { label: option, value: option };
			} else {
				return option;
			}
		});
	});

	function updateSelection() {
		onUpdate(value);
	}
</script>

<div class="uppercase text-gray-600 dark:text-gray-400 tracking-wide text-sm mb-1">
	<div class="fw-medium fs-4">{label}</div>
</div>

<div class="flex gap-2 mb-2" role="radiogroup">
	{#each options as option}
		<div class="relative">
			<input
				class="appearance-none absolute inset-y-0 w-4"
				id={'radio-' + option.value}
				type="radio"
				bind:group={value}
				value={option.value}
				{disabled}
				onchange={updateSelection}
			/>
			<label class="flex items-center" for={'radio-' + option.value}>
				<div
					class={[
						'h-4 w-4 border-2 rounded-full me-2 flex items-center justify-center',
						!disabled && value === option.value
							? 'border-blue-500'
							: 'border-gray-400 dark:border-gray-600'
					]}
				>
					{#if value === option.value}
						<div class="bg-blue-500 h-2 w-2 rounded-full"></div>
					{/if}
				</div>
				{option.label}
			</label>
		</div>
	{/each}
</div>
