<script lang="ts">
	import FilterLabel from '$components/FilterLabel.svelte';
	import SlimSelect, { Option } from 'slim-select';
	import { tick, untrack } from 'svelte';

	interface Props {
		options: ({ label: string; value: string } | string)[];
		value: string | null;
		label: string;
		disabled?: boolean;
		onUpdate?: (value: any) => void;
	}

	let {
		options: initialOptions,
		value = $bindable(),
		label,
		disabled = false,
		onUpdate
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
				return { text: option.label, value: option.value };
			}
		});
	});

	function updateValue(newVal: string) {
		value = newVal;
		flip = true;
		onUpdate?.(newVal);
	}

	function renderDropdown(element: HTMLSelectElement) {
		slimSelect = new SlimSelect({
			select: element,
			data: options,
			settings: {
				id: formId,
				showSearch: false
			},
			events: {
				afterChange: (selected: Option[]) => {
					updateValue(selected[0]?.value);
				}
			}
		});
		lastOptions = JSON.stringify(options);
		slimSelect.setSelected(value || '', false);

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
			slimSelect.setSelected(value || '', false);
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
</script>

<FilterLabel {label} {formId}></FilterLabel>

<select class="slim mb-2" {disabled} {@attach renderDropdown}> </select>
