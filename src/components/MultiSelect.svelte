<script lang="ts">
	import SlimSelect, { Option } from 'slim-select';
	import { untrack } from 'svelte';

	interface Props {
		label: string;
		options: string[];
		value: string[];
		disabled?: boolean;
		onUpdate?: (value: string[]) => void;
	}

	let {
		options: initialOptions,
		value = $bindable(initialOptions),
		label,
		disabled = false,
		onUpdate = () => {}
	}: Props = $props();
	const formId = $props.id();

	let slimSelect: SlimSelect | undefined = undefined;

	let flip: boolean = $state(false);
	let lastOptions: string = '';

	let options = $derived.by(() => {
		return initialOptions.map((option) => {
			if (typeof option === 'string') {
				return { text: option, value: option };
			} else {
				return option;
			}
		});
	});

	function updateValue(newVal: string[]) {
		value = newVal;
		flip = true;
		onUpdate?.(newVal);
	}

	function renderDropdown(element: HTMLSelectElement) {
		slimSelect = new SlimSelect({
			select: element,
			settings: {
				id: formId,
				isMultiple: true,
				showSearch: false,
				maxValuesShown: 100
			},
			cssClasses: {
				// option: 'bg-white dark:bg-gray-800',
				// selected: 'bg-blue-500 dark:bg-blue-600'
			},
			data: options,
			events: {
				afterChange: (selected) => {
					updateValue(selected.map((s) => s.value));
				}
			}
		});
		lastOptions = JSON.stringify(options);
		slimSelect.setSelected(
			value.map((v) => v.toString()),
			false
		);

		return () => {
			slimSelect?.destroy();
		};
	}

	$effect(() => {
		value;
		untrack(async () => {
			if (flip) {
				flip = false;
				return;
			}
			if (!slimSelect) return;
			slimSelect.setSelected(value || [], false);
		});
	});

	$effect(() => {
		options;

		untrack(async () => {
			if (JSON.stringify(options) === lastOptions) return;
			lastOptions = JSON.stringify(options);

			if (!slimSelect) return;
			slimSelect.setData($state.snapshot(options.map((opt) => new Option(opt))));
		});
	});

	$effect(() => {
		disabled;

		untrack(() => {
			if (!slimSelect) return;

			if (!disabled) slimSelect.enable();
			else slimSelect.disable();
		});
	});

	let areAllSelected: boolean = $derived(value.length == options.length);

	function toggleAll() {
		if (areAllSelected) {
			value = [];
		} else {
			value = options.map((o) => o.value);
		}
		onUpdate(value);
	}
</script>

<div class="flex justify-between items-center">
	<div class="uppercase text-gray-600 dark:text-gray-400 tracking-wide text-sm mb-1">
		<label for={formId} class="fw-medium fs-4">{label}</label>
	</div>

	<button class="text-blue-500 block ml-auto" onclick={toggleAll}>
		{#if areAllSelected}
			<i class="bi bi-x"></i>
		{:else}
			<i class="bi bi-check2-all"></i>
		{/if}
		{areAllSelected ? 'Deselect all' : 'Select all'}
	</button>
</div>

<select class="slim mb-2" multiple {@attach renderDropdown}></select>
