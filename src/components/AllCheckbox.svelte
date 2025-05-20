<script lang="ts">
	interface Props {
		label: string;
		elements: any[];
		value: any[];
		disabled?: boolean;
		onUpdate: (value: any[]) => void;
	}

	let {
		label,
		elements,
		value = $bindable(elements),
		disabled = false,
		onUpdate
	}: Props = $props();
	let id = $props.id();

	let areAllSelected: boolean = $derived(value.length == elements.length);

	function toggleAll() {
		if (areAllSelected) {
			value = [];
		} else {
			value = elements;
		}
		onUpdate(value);
	}

	function dispatchEvent() {
		onUpdate(value);
	}
</script>

<div class="h3">{label}</div>
<div class="form-group">
	{#if elements.length == 0}
		<div class="text-muted">No elements available to select.</div>
	{:else}
		<button
			class="btn btn-outline-primary btn-sm"
			style:min-width="100px"
			{disabled}
			onclick={toggleAll}
		>
			{#if areAllSelected}
				Deselect all
			{:else}
				Select all
			{/if}
		</button>
		{#each elements as element, i}
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					id={`${element}Checkbox${id}`}
					type="checkbox"
					value={element}
					bind:group={value}
					{disabled}
					onchange={dispatchEvent}
				/>
				<label class="form-check-label" for={`${element}Checkbox${id}`}>
					{element}
				</label>
			</div>
		{/each}
	{/if}
</div>
