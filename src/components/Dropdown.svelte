<script lang="ts">
	interface Props {
		label: string;
		options: { label: string; value: string }[];
		value?: string | null;
		disabled?: boolean;
		onUpdate?: (value: any) => void;
	}

	let {
		label,
		options,
		value = $bindable(options.length > 0 ? options[0].value : undefined),
		disabled = false,
		onUpdate
	}: Props = $props();
	let id = $props.id();

	function update_selection() {
		onUpdate?.(value);
	}
</script>

<div class="mb-2 row">
	<div class="col-sm-3">
		<label for={'dropdown' + id} class="form-label fw-medium fs-4">{label}</label>
	</div>
	<div class="col-sm-9">
		<select
			id={'dropdown' + id}
			class="form-select"
			bind:value
			onchange={() => update_selection()}
			{disabled}
		>
			{#each options as option}
				<option value={option.value}>
					{option.label}
				</option>
			{/each}
		</select>
	</div>
</div>
