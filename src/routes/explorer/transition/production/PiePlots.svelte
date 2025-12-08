<script lang="ts">
	import Chart from '$components/Chart.svelte';
	import ContentBox from '$components/ContentBox.svelte';
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

	let hasMultipleSolutions = $derived(new Set(datasets.map((d) => d.stack)).size > 1);

	function getPlotOptions() {
		return {
			animation: {
				duration: 0
			},
			maintainAspectRatio: true,
			radius: '90%',
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
			}
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
	<ContentBox>
		<div class="text-center text-muted my-4">
			Click on a bar to see a production and consumption breakdown.
		</div>
	</ContentBox>
{:else}
	<div class="grid grid-cols-2 gap-4">
		<ContentBox>
			<h3 class="font-semibold text-lg mb-4">
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
			<h3 class="font-semibold text-lg mb-4">
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
