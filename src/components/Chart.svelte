<script lang="ts" generics="Type extends ChartType = ChartType">
	import BaseChart from 'chart.js/auto';
	import zoomPlugin from 'chartjs-plugin-zoom';
	import type { Action } from 'svelte/action';
	import { onDestroy, onMount, tick } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartType, LegendItem, Plugin } from 'chart.js/auto';

	import ColorBox, { type ColorBoxItem } from '$components/ColorBox.svelte';
	import HelpTooltip from './HelpTooltip.svelte';
	import ContentBox from './ContentBox.svelte';

	BaseChart.register(zoomPlugin);

	interface Props {
		id?: string;
		type: Type;
		labels?: string[];
		datasets: ChartDataset<Type>[];
		options?: ChartOptions<Type>;
		plugins?: Plugin<ChartType>[];
		pluginOptions?: ChartOptions<ChartType>['plugins'];
		zoom?: boolean;
		plotName?: string;
		narrow?: boolean;
		zoomLevel?: [number, number] | null;
		patterns?: ColorBoxItem[];
		boxed?: boolean;
		generateLabels?: (chart: BaseChart) => LegendItem[];
		onClickLegend?: (item: LegendItem, chart: BaseChart) => void;
		onClickBar?: (label: string, datasetIndex: number) => void;
	}

	let {
		id = 'chart',
		type,
		labels,
		datasets,
		options,
		pluginOptions = {},
		plugins = [],
		zoom = false,
		plotName = 'plot_data',
		narrow = false,
		zoomLevel = $bindable(null),
		patterns = [],
		boxed = true,
		generateLabels,
		onClickLegend,
		onClickBar
	}: Props = $props();

	let chart: BaseChart | undefined = undefined;

	let manualChartDatasets: ChartDataset[] | undefined = undefined;

	const handleChart: Action<HTMLCanvasElement> = (element) => {
		chart = new BaseChart(element, {
			type: type,
			data: {
				labels: labels,
				datasets: manualChartDatasets ?? ($state.snapshot(datasets) as ChartDataset[])
			},
			options: getOptions(),
			plugins: [htmlLegend, ...plugins]
		});

		$effect(() => {
			if (chart == undefined || chart.canvas == null) {
				return;
			}
			chart.data = {
				labels: labels,
				datasets: manualChartDatasets ?? ($state.snapshot(datasets) as ChartDataset[])
			};
			Object.assign(chart.options, getOptions());
			chart.update();
		});
	};

	export function updateChart(datasets: ChartDataset<Type>[]) {
		if (chart == undefined || chart.canvas == null) {
			return;
		}
		manualChartDatasets = $state.snapshot(datasets) as ChartDataset[];
		chart.data.datasets = manualChartDatasets;
		chart.update();
		updateZoomLevel();
	}

	onDestroy(() => {
		chart?.destroy();
	});

	function getOptions(): ChartOptions {
		const optionsSnapshot = {
			...$state.snapshot(options as ChartOptions),
			plugins: {
				...(options?.plugins ?? {}),
				...pluginOptions
			} as Record<string, any>
		};

		optionsSnapshot.plugins.legend = {
			display: false
		};

		if (!zoom) {
			return optionsSnapshot as ChartOptions;
		}

		// Ensure the zoom options are set
		optionsSnapshot.plugins.zoom = optionsSnapshot.plugins.zoom ?? {};
		optionsSnapshot.plugins.zoom.pan = optionsSnapshot.plugins.zoom.pan ?? {};
		optionsSnapshot.plugins.zoom.zoom = optionsSnapshot.plugins.zoom.zoom ?? {};

		// Set pan and zoom options
		optionsSnapshot.plugins.zoom.pan.onPanComplete = setZoomLevel;
		optionsSnapshot.plugins.zoom.zoom.onZoomComplete = setZoomLevel;

		return optionsSnapshot as ChartOptions;
	}

	//#region Colors for dark mode support

	// Used to temporarily hide and show the chart when updating colors
	let showChart: boolean = $state(true);

	onMount(() => {
		updateDefaultColor();
		window.addEventListener('themeChange', onUpdateColor);
	});

	onDestroy(() => {
		window.removeEventListener('themeChange', onUpdateColor);
	});

	async function onUpdateColor() {
		showChart = false;
		updateDefaultColor();
		await tick();
		showChart = true;
	}

	function updateDefaultColor() {
		const isDark = window.localStorage.getItem('theme') === 'dark' || (
			!window.localStorage.getItem('theme') &&
			window.matchMedia('(prefers-color-scheme: dark)').matches
		);
		BaseChart.defaults.color = isDark ? '#ddd' : '#222';
		BaseChart.defaults.borderColor =
			isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	}

	//#endregion

	//#region Zooming

	function setZoomLevel({ chart }: { chart: BaseChart }) {
		if (chart == undefined || chart.canvas == null) {
			return;
		}
		zoomLevel = [chart.scales['x'].min as number, chart.scales['x'].max as number];
	}

	function updateZoomLevel() {
		if (chart == undefined || chart.canvas == null || zoomLevel == null) {
			return;
		}
		chart.zoomScale('x', { min: zoomLevel[0], max: zoomLevel[1] });
	}
	$effect(updateZoomLevel);

	export function resetZoom() {
		chart?.resetZoom();
	}

	export function zoomIn() {
		chart?.zoom(1.2);
	}

	export function zoomOut() {
		chart?.zoom(0.8);
	}

	//#endregion

	//#region Legend

	let legendItems: ColorBoxItem[] = $state([]);

	const htmlLegend: Plugin = {
		id: 'htmlLegend',
		afterUpdate(chart) {
			if (generateLabels) {
				legendItems = generateLabels(chart) as ColorBoxItem[];
			} else {
				legendItems =
					(chart.options.plugins?.legend?.labels?.generateLabels?.(chart) as ColorBoxItem[]) || [];
			}
		}
	};

	function toggleLegendItem(item: LegendItem) {
		if (chart == undefined) {
			return;
		}
		if (onClickLegend) {
			onClickLegend(item, chart);
			return;
		}
		if (type === 'pie' || type === 'doughnut') {
			if (item.index == null) {
				return;
			}
			// Pie and doughnut charts only have a single dataset and visibility per item
			chart.toggleDataVisibility(item.index);
		} else {
			if (item.datasetIndex == null) {
				return;
			}
			chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
		}

		chart.update();
	}

	//#endregion

	//#region Download data

	export function downloadData() {
		const data = chart?.data.datasets;

		if (!data || data.length === 0) {
			alert('No data available for download!');
			return;
		}

		const labels = data.map((d) => (d.label != undefined ? d.label : ''));
		const converted_data = Array.from({ length: data[0].data.length })
			.map((_, i) => {
				const row = data.map((d) =>
					typeof d.data[i] === 'object' && d.data[i] !== null && 'y' in d.data[i]
						? d.data[i].y
						: d.data[i]
				);
				return i + ',' + row.join(',');
			})
			.join('\r\n');

		const csvContent = encodeURI(
			'data:text/csv;charset=utf-8,' + 'timestep,' + labels.join(',') + '\r\n' + converted_data
		);

		const link = document.createElement('a');
		link.setAttribute('href', csvContent);
		link.setAttribute('download', plotName);
		document.body.appendChild(link); // Required for Firefox
		link.click();
	}

	//#endregion

	function emitClickBarEvent(event: Event) {
		if (chart == undefined || labels == undefined || onClickBar == undefined) {
			return;
		}
		const res = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
		if (res.length === 0) {
			return;
		}
		onClickBar(labels[res[0].index], res[0].datasetIndex);
	}
</script>

<svelte:window onresize={() => tick().then(() => chart?.resize())} />

{#snippet legend()}
	<h2 class="flex items-start font-bold text-lg me-4">
		<span class="me-2">Legend</span>
		<HelpTooltip content="Click on legend items to show/hide them in the chart." />
	</h2>
	<div class="flex flex-wrap gap-2">
		{#each legendItems as item}
			<button
				class="flex items-center p-0 text-gray-600 dark:text-gray-400 text-sm"
				onclick={() => toggleLegendItem(item)}
			>
				<ColorBox item={item as ColorBoxItem}></ColorBox>
				<span class={[item.hidden && 'text-decoration-line-through']}>{item.text}</span>
			</button>
		{/each}
	</div>
{/snippet}

{#snippet patternSnippet()}
	{#if patterns.length > 1}
		<h2 class="font-bold text-lg me-4">Patterns</h2>
		<div class="legend flex wrap gap-2">
			{#each patterns as pattern}
				<div
					class="flex items-center text-gray-600 dark:text-gray-400"
					style:font-size="12px"
					style:letter-spacing="0.0em"
					style:font-family="Arial, sans-serif"
				>
					<ColorBox item={pattern}></ColorBox>
					<span>{pattern.text}</span>
				</div>
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet chartSnippet()}
	{#if showChart}
		<div class="position-relative" style:min-height={narrow ? '259px' : '558px'}>
			<canvas {id} use:handleChart onclick={emitClickBarEvent}></canvas>
		</div>
	{/if}
{/snippet}

{#if boxed}
	{#if legendItems.length > 0}
		<ContentBox class="flex" children={legend}></ContentBox>
	{/if}
	{#if patterns.length > 1}
		<ContentBox class="flex" children={patternSnippet}></ContentBox>
	{/if}
	<ContentBox children={chartSnippet}></ContentBox>
{:else}
	<div class="flex mb-4">
		{@render legend()}
	</div>
	<div class="flex mb-4">
		{@render patternSnippet()}
	</div>
	{@render chartSnippet()}
{/if}
