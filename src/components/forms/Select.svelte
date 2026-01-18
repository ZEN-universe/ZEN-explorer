<script lang="ts" generics="T extends string | string[]">
	import { slide } from 'svelte/transition';

	interface Option {
		text: string;
		value: string;
	}

	interface Props {
		id: string;
		label: string;
		placeholderText?: string;
		multiple?: boolean;
		disabled?: boolean;
		options: Option[];
		value: T | null;
		onUpdate: (value: T) => void;
	}
	let {
		id,
		label,
		placeholderText = 'Select an option',
		multiple = false,
		disabled = false,
		options,
		value = $bindable(multiple ? ([] as string[]) : null) as T | null,
		onUpdate
	}: Props = $props();

	let open: boolean = $state(false);

	let container = $state<HTMLElement>();

	let selectedOptions: string[] = $derived.by(() => {
		if (multiple) {
			// return selected values in the same order as options
			return options
				.filter((opt) => (value as string[]).includes(opt.value))
				.map((opt) => opt.value);
		}
		return [value] as string[];
	});

	function getLabel(val: T | null): string {
		const option = options.find((opt) => opt.value === val);
		return option ? option.text : '';
	}

	function isSelected(option: Option): boolean {
		if (multiple) {
			return (value as string[]).includes(option.value);
		} else {
			return value === option.value;
		}
	}

	function openDropdown() {
		if (disabled) return;
		open = !open;
	}

	function selectOption(newValue: string) {
		if (multiple) {
			const newValueArray = Array.isArray(value) ? value.slice() : [];
			if (newValueArray?.includes(newValue)) {
				newValueArray.splice(newValueArray.indexOf(newValue), 1);
			} else {
				newValueArray?.push(newValue);
			}
			value = newValueArray as T;
		} else {
			open = false;
			if (newValue === value) return;
			value = newValue as T;
		}
		onUpdate(value as T);
	}

	function deselectOption(event: Event, deselectedValue: string) {
		event.stopPropagation();
		selectOption(deselectedValue);
		(container?.firstChild as HTMLElement)?.focus();
	}

	function loseFocus(event: FocusEvent) {
		// close dropdown when clicking outside the component
		if (!(event.relatedTarget instanceof HTMLElement) || !container) {
			open = false;
			return;
		}
		const relatedTarget = event.relatedTarget;
		if (container?.contains(relatedTarget)) return;
		open = false;
	}

	let previousOptions: string | null = null;

	function optionsTag(): string {
		return JSON.stringify(options.map((opt) => opt.value));
	}

	$effect(() => {
		// break infinite loop by checking if options have changed
		if (previousOptions !== null && previousOptions === optionsTag()) return;
		previousOptions = optionsTag();

		// if value is not in options, reset it and print warning
		if (multiple && (value as string[]).some((val) => !options.find((opt) => opt.value === val))) {
			const validValues = (value as string[]).filter((val) =>
				options.find((opt) => opt.value === val)
			);
			console.warn(
				`[Select] ${label}: Some selected values are not in options. Resetting value to valid selections:`,
				validValues
			);
			value = validValues as T;
		} else if (!multiple && value && !options.find((opt) => opt.value === value)) {
			console.warn(
				`[Select] ${label}: Selected value "${value}" is not in options. Resetting value to \`null\`.`
			);
			value = null;
		}
		onUpdate(value as T);
	});
</script>

<input type="hidden" bind:value {id} />
<div class="mb-4 relative" bind:this={container}>
	<div
		class={[
			'relative rounded-md pl-2 pr-6 py-2 cursor-pointer w-full',
			'bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600'
		]}
		class:opacity-50={disabled}
		onclick={openDropdown}
		onkeypress={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				openDropdown();
				e.preventDefault();
			}
		}}
		onblur={loseFocus}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls={id + '-listbox'}
		aria-label={label}
		role="combobox"
		tabindex={0}
	>
		{#if !multiple && value}
			<div class="block truncate">
				{getLabel(value)}
			</div>
		{:else if multiple && Array.isArray(value) && value.length > 0}
			<div class="flex flex-wrap gap-2 my-0.5">
				{#each selectedOptions as val (val)}
					<div class="flex items-center bg-blue-500 rounded-md text-xs text-white truncate">
						<div class="px-2 py-0.5">
							{getLabel(val as T)}
						</div>
						<button
							class="border-l border-black dark:border-white text-lg/1 py-0 px-0.5"
							onclick={(event) => deselectOption(event, val)}
							aria-label="Deselect option"
						>
							<i class="bi bi-x"></i>
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-gray-500 dark:text-gray-400 truncate">
				{placeholderText}
			</div>
		{/if}
		<div
			class={[
				'handle absolute inset-y-0 right-0 flex items-center pr-2',
				'transition-transform duration-300',
				open && '-scale-y-100'
			]}
		>
			<i class={['bi bi-chevron-down']}></i>
		</div>
	</div>

	{#if open}
		<div
			class={[
				'absolute z-10 w-full max-h-60 py-1 overflow-auto focus:outline-none',
				'flex flex-col items-start',
				'bg-white dark:bg-gray-800',
				'rounded-md shadow-lg shadow-black/20 dark:shadow-white/10 ring-1 ring-black dark:ring-gray-400'
			]}
			id={id + '-listbox'}
			transition:slide={{ duration: 300 }}
		>
			{#each options as option (option.value)}
				<button
					class={[
						'cursor-pointer select-none relative py-2 pl-2 pr-6 w-full text-left',
						isSelected(option)
							? 'bg-blue-200 dark:bg-blue-800 hover:bg-blue-300 dark:hover:bg-blue-700'
							: 'hover:bg-gray-100 dark:hover:bg-gray-700'
					]}
					onclick={() => selectOption(option.value)}
					onblur={loseFocus}
					role="option"
					aria-selected={isSelected(option)}
					aria-label={option.text}
				>
					<span class="block truncate">{option.text}</span>
					{#if isSelected(option)}
						<span
							class="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-600 dark:text-gray-300"
						>
							<i class="bi bi-check-lg"></i>
						</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
