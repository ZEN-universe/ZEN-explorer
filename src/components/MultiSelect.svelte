<script lang="ts" generics="T extends number | string">
	import SlimSelect from 'slim-select';

	interface Props {
		formId: string;
		label: string;
		options: T[];
		value: T[];
		disabled?: boolean;
		onUpdate?: (value: T[]) => void;
	}

	let {
		formId,
		label,
		options: options,
		value = $bindable(options),
		disabled = false,
		onUpdate = () => {}
	}: Props = $props();
	let id: string = $props.id();

	let areAllSelected: boolean = $derived(value.length == options.length);

	function toggleAll() {
		if (areAllSelected) {
			value = [];
		} else {
			value = options;
		}
		onUpdate(value);
	}

	function emitUpdate() {
		onUpdate(value);
	}

	function renderDropdown(element: HTMLSelectElement) {
		const slimSelect = new SlimSelect({
			select: element,
			settings: {
				showSearch: false
			},
			cssClasses: {
				// option: 'bg-white dark:bg-gray-800',
				// selected: 'bg-blue-500 dark:bg-blue-600'
			}
		});

		return () => {
			slimSelect.destroy();
		};
	}
</script>

<div class="">
	{#if options.length == 0}
		<div class="text-gray-500">No elements available to select.</div>
	{:else}
		<select
			id={formId}
			class="bg-white dark:bg-gray-800"
			bind:value
			{disabled}
			multiple
			onchange={emitUpdate}
			{@attach renderDropdown}
		>
			{#each options as option}
				<option value={option}>
					{option}
				</option>
			{/each}
		</select>
	{/if}
</div>
