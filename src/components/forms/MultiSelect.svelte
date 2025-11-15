<script lang="ts">
	import FilterLabel from '$components/FilterLabel.svelte';
	import SlimSelect, { Option } from 'slim-select';
	import { onDestroy, untrack } from 'svelte';

	interface Props {
		label: string;
		options: string[];
		value: string[];
		emptyText?: string;
		disabled?: boolean;
		onUpdate?: (value: string[]) => void;
	}

	let {
		options: initialOptions,
		value = $bindable(initialOptions),
		label,
		emptyText = 'No options available.',
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
		untrack(() => {
			slimSelect = new SlimSelect({
				select: element,
				settings: {
					id: formId,
					isMultiple: true,
					showSearch: false,
					maxValuesShown: 100,
					allowDeselect: true,
					closeOnSelect: false,
				},
				cssClasses: {
					deselect: 'hidden'
				},
				data: options,
				events: {
					afterChange: (selected) => {
						// return;
						updateValue(selected.map((s) => s.value));
					}
				}
			});
			lastOptions = JSON.stringify(options);
			slimSelect.setSelected(
				value.map((v) => v.toString()),
				false
			);
		});
	}

	onDestroy(() => {
		if (slimSelect) {
			slimSelect.destroy();
			slimSelect = undefined;
		}
	});

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

<FilterLabel {label} {formId}>
	{#snippet rightSide()}
		<button class="text-blue-500 block ml-auto" onclick={toggleAll}>
			{#if areAllSelected}
				<i class="bi bi-x"></i>
			{:else}
				<i class="bi bi-check2-all"></i>
			{/if}
			{areAllSelected ? 'Deselect all' : 'Select all'}
		</button>
	{/snippet}
</FilterLabel>

{#if options.length == 0}
	<div class="text-gray-500 italic text-sm mb-2">{emptyText}</div>
{:else}
	<select class="slim mb-2" multiple {@attach renderDropdown}></select>
{/if}
