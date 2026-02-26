<script lang="ts">
	import Chart from '$components/Chart.svelte';
	import ContentBox from '$components/ContentBox.svelte';
	import {
		getDataForActiveYear,
		getPlotOptions,
		hasMultipleSolutions as hasMultipleSolutionsFn
	} from '@/lib/piePlots';
	import type { ChartDataset } from 'chart.js';

	interface Props {
		datasets: ChartDataset<'bar'>[];
		labels: string[];
		year: string | null;
		solution: string | null;
		tooltipSuffix: string;
	}
	let { datasets, labels, year, solution, tooltipSuffix }: Props = $props();

	let dataForActiveYear = $derived(getDataForActiveYear(datasets, year, solution, labels));

	let hasMultipleSolutions = $derived(hasMultipleSolutionsFn(datasets));

	let costsDatasets = $derived.by(() => {
		if (year == null) return [];

		const data = dataForActiveYear.map((d) => d.data);
		const color = dataForActiveYear.map((d) => d.color);

		return [
			{
				label: 'Costs',
				data,
				backgroundColor: color
			}
		] as ChartDataset<'pie'>[];
	});

	let costsLabels = $derived.by(() => {
		if (year == null) return [];
		return dataForActiveYear.map((d) => d.label || '');
	});

	let getCostsPlotOptions = () => getPlotOptions(tooltipSuffix);
</script>

{#if year == null || solution == null}
	<ContentBox>
		<div class="text-muted my-2 text-center text-xl">Click on a bar to see a costs breakdown.</div>
	</ContentBox>
{:else}
	<ContentBox>
		<h3 class="mb-4 text-lg font-semibold">
			Breakdown of Costs for {year}
			{hasMultipleSolutions ? ` (${solution})` : ''}
		</h3>
		<div class="grid grid-cols-2 items-start gap-4">
			<Chart
				type="pie"
				labels={costsLabels}
				getDatasets={() => costsDatasets}
				getOptions={getCostsPlotOptions}
				boxed={false}
			></Chart>
		</div>
	</ContentBox>
{/if}
