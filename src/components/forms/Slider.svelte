<script lang="ts">
	import { onMount, tick, type Snippet } from 'svelte';

	import { getURLParam, updateURLParam } from '@/lib/queryParams.svelte';

	import FilterLabel from '$components/FilterLabel.svelte';

	const MAX_NUMBER_OF_TICKS = 8;

	interface Props {
		value: number;
		min: number;
		max: number;
		step: number;
		label: string;
		urlParam?: string;
		helpText?: Snippet;
		onUpdate?: (newValue: number) => void;
	}

	let {
		value = $bindable(),
		min,
		max,
		step,
		label,
		urlParam,
		helpText,
		onUpdate = () => {}
	}: Props = $props();
	const formId = $props.id();

	let ticks = $derived.by(() => {
		let tickStep = step;

		while (Math.floor((max - min) / tickStep) + 1 > MAX_NUMBER_OF_TICKS) {
			tickStep *= 2;
		}

		const numTicks = Math.floor((max - min) / tickStep) + 1;
		const ticks = Array.from({ length: numTicks }, (_, i) => min + i * tickStep);
		if (!ticks.includes(max)) ticks.push(max); // Ensure max is always a tick
		return ticks;
	});

	function getPercent(val: number) {
		return (val - min) / (max - min);
	}

	function markerPosition(val: number) {
		const p = getPercent(val);
		// Thumb is ~20px wide; nudge the bubble so it stays centred over the thumb
		return `calc(${p * 100}% + ${(0.5 - p) * 20}px)`;
	}

	// Reset value if it goes out of bounds (e.g. if max changes)
	$effect(() => {
		if (value < min || value > max) {
			value = min;
			onUpdate(min);
		}
	});

	// Initialize value from URL param on mount
	onMount(() => {
		if (urlParam === undefined) return;
		value = parseInt(getURLParam(urlParam) ?? '0', 10);
	});

	// Update URL param when value changes
	$effect(() => {
		if (urlParam === undefined) return;
		value;
		tick().then(() => {
			updateURLParam(urlParam, value.toString());
		});
	});
</script>

<FilterLabel {label} {formId} {helpText}></FilterLabel>

<div class="mb-2 flex flex-col items-center justify-center">
	<div class="flex w-full flex-col gap-2">
		<!-- Slider track + marker wrapper -->
		<div class="relative pt-10">
			<!-- Floating marker bubble -->
			<div
				class="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col items-center"
				style:left={markerPosition(value)}
			>
				<div
					class="
                        rounded-md border border-blue-500 bg-blue-500 px-2 py-0.5
                        font-mono text-sm font-semibold text-white
                        shadow-md/20
                        transition-colors duration-75
                    "
				>
					{value}
				</div>
				<!-- Stem -->
				<div class="h-2 w-[2px] bg-gray-800 dark:bg-gray-200"></div>
			</div>

			<!-- Track background -->
			<div
				class="group relative h-[6px] rounded-full bg-gray-400 inset-ring ring-gray-800 dark:bg-gray-600 dark:ring-gray-400"
			>
				<!-- Native range input — invisible but fully interactive -->
				<input
					id={formId}
					type="range"
					bind:value
					{min}
					{max}
					{step}
					class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
				/>

				<!-- Custom thumb dot -->
				<div
					class="
                        pointer-events-none absolute top-1/2 h-5
                        w-5 -translate-x-1/2 -translate-y-1/2
                        rounded-full border-2 border-blue-500
                        bg-white ring-blue-500/40
                        group-hover:ring-4 dark:bg-gray-800
                    "
					style:left={markerPosition(value)}
				></div>
				<!-- group-hover:shadow-[0_0_0_4px_rgba(108,71,255,0.2)] group-focus:shadow-[0_0_0_4px_rgba(108,71,255,0.2)] -->
			</div>
		</div>

		<!-- Bottom ticks — positioned with same calc() as the thumb -->
		<div class="relative mt-1 h-6">
			{#each ticks as tick (tick)}
				<div
					class="absolute flex -translate-x-1/2 flex-col items-center gap-1"
					style:left={markerPosition(tick)}
				>
					<div class="h-1.5 w-px bg-gray-800 dark:bg-gray-200"></div>
					<span class="text-xs text-gray-600 dark:text-gray-300">{tick}</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	/* Remove default thumb so our custom one shows */
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
	}
	input[type='range']::-moz-range-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
	}
</style>
