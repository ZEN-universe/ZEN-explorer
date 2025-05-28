<script lang="ts">
	interface Props {
		label: string;
		elements: any[];
		value: any[];
		disabled?: boolean;
		onUpdate?: (value: any[]) => void;
	}

	let {
		label,
		elements,
		value = $bindable(elements),
		disabled = false,
		onUpdate = () => {}
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

<div class="row mb-2">
	<div class="col-sm-3 d-flex justify-content-between">
		<label for={'checkbox' + id} class="form-label fw-medium fs-4">
			{label}
		</label>
		<div>
			<button
				class="btn btn-outline-primary btn-sm align-self-baseline px-3"
				{disabled}
				onclick={toggleAll}
			>
				{#if areAllSelected}
					Deselect all
				{:else}
					Select all
				{/if}
			</button>
		</div>
	</div>

	<div class="col-sm-9 form-group">
		{#if elements.length == 0}
			<div class="text-muted">No elements available to select.</div>
		{:else}
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
</div>
