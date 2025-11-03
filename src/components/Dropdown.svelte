<script lang="ts">
	import SlimSelect, { Option } from 'slim-select';
	import { tick, untrack } from 'svelte';

	interface Props {
		formId: string;
		options: ({ label: string; value: string } | string)[];
		value: string | null;
		disabled?: boolean;
		onUpdate?: (value: any) => void;
	}

	let {
		formId,
		options: initialOptions,
		value = $bindable(),
		disabled = false,
		onUpdate
	}: Props = $props();

	let flip: boolean = $state(false);

	let options = $derived.by(() => {
		return initialOptions.map((option) => {
			if (typeof option === 'string') {
				return { text: option, value: option };
			} else {
				return option;
			}
		});
	});

	function updateValue(newVal: string) {
		value = newVal;
		flip = true;
		onUpdate?.(newVal);
		console.log('[Dropdown] value updated', newVal);
	}

	let slimSelect: SlimSelect | undefined = undefined;

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
			console.log('[Dropdown] options changed', $state.snapshot(options));
			
			if (!slimSelect) return;
			await tick();
			slimSelect.setData($state.snapshot(options.map((opt) => (new Option(opt)))));
			console.log('[Dropdown] options set in SlimSelect', slimSelect.getData());
			
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

	$inspect('[Dropdown] value', value);
	$inspect('[Dropdown] options', options);
</script>

<select
	class="bg-white dark:bg-gray-800"
	{disabled}
	style:color="inherit"
	style:background-color="inherit"
	{@attach renderDropdown}
>
	<!-- {#each options as option}
		<option value={option.value} style:color="inherit" style:background-color="inherit">
			{option.label}
		</option>
	{/each} -->
</select>
