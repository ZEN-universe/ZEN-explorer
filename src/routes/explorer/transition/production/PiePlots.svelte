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

	function filterDatasets(
		criteria: (value: number) => boolean,
		label: string
	): ChartDataset<'pie'>[] {
		if (year == null) return [];

		const entries = dataForActiveYear.filter((d) => d.data && criteria(Number(d.data)));

		const data = entries.map((d) => d.data);
		const color = entries.map((d) => d.color);

		return [
			{
				label: label,
				data: data,
				backgroundColor: color
			}
		] as ChartDataset<'pie'>[];
	}

	function filterLabels(criteria: (value: number) => boolean): string[] {
		if (year == null) return [];

		return dataForActiveYear
			.filter((d) => d.data && criteria(Number(d.data)))
			.map((d) => d.label || '');
	}

	let productionDatasets = $derived(
		filterDatasets((value) => value > 1.0e-6, 'Production')
	) as unknown as ChartDataset<'pie'>[];
	let productionLabels = $derived(filterLabels((value) => value > 1.0e-6));
	let productionOptions = $derived(getPlotOptions(tooltipSuffix));

	let consumptionDatasets = $derived(
		filterDatasets((value) => value < -1.0e-6, 'Consumption')
	) as unknown as ChartDataset<'pie'>[];
	let consumptionLabels = $derived(filterLabels((value) => value < -1.0e-6));
	let consumptionOptions = $derived(getPlotOptions(tooltipSuffix));
</script>

{#if year == null || solution == null}
	<ContentBox>
		<div class="text-muted my-2 text-center text-xl">
			Click on a bar to see a production and consumption breakdown.
		</div>
	</ContentBox>
{:else}
	<div class="grid grid-cols-2 gap-4">
		<ContentBox>
			<h3 class="mb-4 text-lg font-semibold">
				Breakdown of Production for {year}
				{hasMultipleSolutions ? ` (${solution})` : ''}
			</h3>
			<Chart
				type="pie"
				datasets={productionDatasets}
				labels={productionLabels}
				options={productionOptions}
				boxed={false}
			></Chart>
		</ContentBox>
		<ContentBox>
			<h3 class="mb-4 text-lg font-semibold">
				Breakdown of Consumption for {year}
				{hasMultipleSolutions ? ` (${solution})` : ''}
			</h3>
			<Chart
				type="pie"
				datasets={consumptionDatasets}
				labels={consumptionLabels}
				options={consumptionOptions}
				boxed={false}
			></Chart>
		</ContentBox>
	</div>
{/if}
