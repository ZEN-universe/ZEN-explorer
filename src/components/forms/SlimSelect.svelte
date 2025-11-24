<script lang="ts" generics="T extends string | string[]">
	import SlimSelect, { Option } from 'slim-select';
	import { onDestroy, untrack } from 'svelte';

	interface Props {
		id: string;
		label: string;
		value: T | null;
		options: { text: string; value: string }[];
		disabled?: boolean;
		multiple?: boolean;
		onUpdate: (value: T) => void;
	}
	let {
		id,
		label,
		value = $bindable(),
		options,
		disabled,
		multiple = false,
		onUpdate
	}: Props = $props();

	let slimSelect: SlimSelect | undefined = undefined;
	let flip: boolean = $state(false);
	let lastOptions: string = '';

	function renderDropdown(element: HTMLSelectElement) {
		untrack(() => {
			slimSelect = new SlimSelect({
				select: element,
				data: cloneOptions(),
				settings: {
					id: id,
					ariaLabel: label,
					isMultiple: multiple || false,
					showSearch: false,
					maxValuesShown: 100,
					allowDeselect: true,
					closeOnSelect: !multiple
				},
				cssClasses: {
					deselect: 'hidden'
				},
				events: {
					afterChange: (selected) => {
						if (multiple) {
							updateValue(selected.map((s) => s.value) as T);
						} else {
							updateValue(selected[0]?.value as T);
						}
					},
					beforeChange(newValue) {
						if (multiple || newValue.length > 0) return;
						slimSelect?.close();
						return false;
					}
				}
			});
			lastOptions = JSON.stringify(options);

			if (Array.isArray(value)) {
				slimSelect.setSelected(
					value.map((v: string) => v.toString()),
					false
				);
			} else {
				slimSelect.setSelected(value || ('' as string), false);
			}
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
			const previousValue = slimSelect.getSelected();
			slimSelect.setData(cloneOptions());

			let newValue;
			if (multiple) {
				newValue = previousValue.filter((opt) => options.find((o) => o.value === opt));
			} else {
				newValue = options.some((o) => o.value === previousValue[0]) ? previousValue[0] : '';
			}
			slimSelect.setSelected(newValue, false);
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

	function updateValue(newVal: T) {
		value = newVal;
		flip = true;
		onUpdate(newVal);
	}

	function cloneOptions() {
		return $state.snapshot(options.map((opt) => new Option({ ...opt })));
	}
</script>

<select class="slim mb-2" {multiple} {@attach renderDropdown}></select>
