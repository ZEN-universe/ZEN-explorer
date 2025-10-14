<script lang="ts">
	import Chart from '$components/Chart.svelte';
	import type { ActivatedSolution } from '$lib/types';
	import type { ChartDataset, ChartTypeRegistry, TooltipItem } from 'chart.js';

	interface Props {
		datasets: ChartDataset<'bar'>[];
		labels: string[];
		year: string | null;
		solution: string | null;
		tooltipSuffix: string;
	}
	let { datasets, labels, year, solution, tooltipSuffix }: Props = $props();

	let dataForActiveYear = $derived.by(() => {
		if (year == null) return [];

		const idx = labels.findIndex((label) => label === year);
		return datasets
			.filter((d) => d.stack === solution)
			.map((d) => {
				return {
					data: d.data.find((_, i) => i === idx),
					color: d.backgroundColor,
					label: d.label
				};
			});
	});

	function getPlotOptions() {
		return {
			animation: {
				duration: 0
			},
			responsive: true,
			plugins: {
				tooltip: {
					callbacks: {
						label: (item: TooltipItem<keyof ChartTypeRegistry>) => {
							const value = Number(item.raw || 0);
							const total = item.dataset.data
								.map((val) => Number(val || 0))
								.reduce((acc, val) => acc + val, 0);
							const percentage = ((value * 100) / total).toFixed(2);
							return `${item.dataset.label}: ${item.formattedValue}${tooltipSuffix} (${percentage}%)`;
						}
					}
				},
				legend: {
					position: 'top' as const
				}
			},
			radius: '90%'
		};
	}

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
	) as unknown as ChartDataset<keyof ChartTypeRegistry>[];
	let productionLabels = $derived(filterLabels((value) => value > 1.0e-6));
	let productionOptions = $derived(getPlotOptions());

	let consumptionDatasets = $derived(
		filterDatasets((value) => value < -1.0e-6, 'Consumption')
	) as unknown as ChartDataset<keyof ChartTypeRegistry>[];
	let consumptionLabels = $derived(filterLabels((value) => value < -1.0e-6));
	let consumptionOptions = $derived(getPlotOptions());
</script>

{#if year == null || solution == null}
	<div class="text-center text-muted mb-2">
		Click on a bar to see a production and consumption breakdown.
	</div>
{:else}
	<div class="row mb-2">
		<div class="col-lg-6">
			<h3 class="text-center h5">Breakdown of Production for {year} ({solution})</h3>
			<Chart
				type="pie"
				datasets={productionDatasets}
				labels={productionLabels}
				options={productionOptions}
				downloadable={false}
			></Chart>
		</div>
		<div class="col-lg-6">
			<h3 class="text-center h5">Breakdown of Consumption for {year} ({solution})</h3>
			<Chart
				type="pie"
				datasets={consumptionDatasets}
				labels={consumptionLabels}
				options={consumptionOptions}
				downloadable={false}
			></Chart>
		</div>
	</div>
{/if}
