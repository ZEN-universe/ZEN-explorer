<script lang="ts">
	interface Props {
		label: string;
		options: any[];
		value?: any;
		disabled?: boolean;
		onUpdate?: (selected_option: any) => void;
	}

	let {
		label,
		options,
		value = $bindable(options[0]),
		disabled = false,
		onUpdate = () => {}
	}: Props = $props();

	function updateSelection() {
		onUpdate(value);
	}
</script>

<div class="row mb-2">
	<div class="col-sm-3">
		<label for={'radio' + label} class="form-label fw-medium fs-4">
			{label}
		</label>
	</div>
	<div class="col-sm-9" role="radiogroup">
		{#each options as option}
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					id={'radio-' + option}
					type="radio"
					bind:group={value}
					value={option}
					{disabled}
					onchange={updateSelection}
				/>
				<label class="form-check-label" for={'radio-' + option}>
					{option}
				</label>
			</div>
		{/each}
	</div>
</div>
