<script lang="ts">
	import BarPlot from '$components/BarPlot.svelte';
	import type { ChartDataset, ChartTypeRegistry, TooltipItem } from 'chart.js';

	interface Props {
		datasets: ChartDataset<'bar'>[];
		labels: string[];
		year: string | null;
		tooltipSuffix: string;
	}
	let { datasets, labels, year, tooltipSuffix }: Props = $props();

	let dataForActiveYear = $derived.by(() => {
		if (year == null) return [];

		const idx = labels.findIndex((label) => label === year);
		return datasets.map((d) => {
			return {
				data: d.data.find((_, i) => i === idx),
				color: d.backgroundColor,
				label: d.label
			};
		});
	});

	function getPlotOptions(label: string) {
		return {
			animation: {
				duration: 0
			},
			responsive: true,
			plugins: {
				tooltip: {
					callbacks: {
						label: (item: TooltipItem<keyof ChartTypeRegistry>) =>
							`${item.dataset.label}: ${item.formattedValue}${tooltipSuffix}`
					}
				},
				legend: {
					position: 'top' as const
				},
				title: {
					display: true,
					text: year ? `Breakdown of ${label} for ${year}` : 'Select a year'
				}
			}
		};
	}

	function filterDatasets(
		criteria: (value: number) => boolean,
		label: string
	): ChartDataset<'bar'>[] {
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
		] as ChartDataset<'bar'>[];
	}

	function filterLabels(criteria: (value: number) => boolean): string[] {
		if (year == null) return [];

		return dataForActiveYear
			.filter((d) => d.data && criteria(Number(d.data)))
			.map((d) => d.label || '');
	}

	let productionDatasets = $derived(filterDatasets((value) => value > 1.0e-6, 'Production'));
	let productionLabels = $derived(filterLabels((value) => value > 1.0e-6));
	let productionOptions = $derived(getPlotOptions('Production'));

	let consumptionDatasets = $derived(filterDatasets((value) => value < -1.0e-6, 'Consumption'));
	let consumptionLabels = $derived(filterLabels((value) => value < -1.0e-6));
	let consumptionOptions = $derived(getPlotOptions('Consumption'));
</script>

{#if year == null}
	<div class="text-center text-muted">Click on a bar to see a production and consumption breakdown.</div>
{:else}
	<div class="row">
		<div class="col-lg-6">
			<BarPlot
				type="pie"
				datasets={productionDatasets}
				labels={productionLabels}
				options={productionOptions}
				downloadable={false}
			></BarPlot>
		</div>
		<div class="col-lg-6">
			<BarPlot
				type="pie"
				datasets={consumptionDatasets}
				labels={consumptionLabels}
				options={consumptionOptions}
				downloadable={false}
			></BarPlot>
		</div>
	</div>
{/if}
