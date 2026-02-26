<script lang="ts" generics="Type extends ChartType = ChartType">
	import BaseChart from 'chart.js/auto';
	import zoomPlugin from 'chartjs-plugin-zoom';
	import type { Action } from 'svelte/action';
	import { onDestroy, tick } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartType, LegendItem, Plugin } from 'chart.js/auto';

	import ColorBox, { type ColorBoxItem } from '$components/ColorBox.svelte';
	import HelpTooltip from './HelpTooltip.svelte';
	import ContentBox from './ContentBox.svelte';
	import { getTheme } from '@/lib/theme.svelte';
	import { getHiddenPatterns, onClickPattern } from '@/lib/compareSolutions.svelte';

	BaseChart.register(zoomPlugin);

	interface Props {
		id?: string;
		type: Type;
		labels?: string[];
		getDatasets: () => ChartDataset<Type>[];
		getOptions?: () => ChartOptions<Type>;
		plugins?: Plugin<ChartType>[];
		pluginOptions?: ChartOptions<ChartType>['plugins'];
		zoom?: boolean;
		plotName?: string;
		initialHeight?: number;
		zoomLevel?: [number, number] | null;
		patterns?: ColorBoxItem[];
		boxed?: boolean;
		generateLabels?: (chart: BaseChart) => LegendItem[];
		resetLegendState?: (chart: BaseChart) => void;
		onClickLegend?: (item: LegendItem, chart: BaseChart, activateOnlyOneItem: boolean) => void;
		onClickBar?: (label: string, datasetIndex: number) => void;
	}

	let {
		id = 'chart',
		type,
		labels,
		getDatasets,
		getOptions,
		pluginOptions = {},
		plugins = [],
		zoom = false,
		plotName = 'plot_data',
		initialHeight = 600,
		zoomLevel = $bindable(null),
		patterns = [],
		boxed = true,
		generateLabels,
		resetLegendState,
		onClickLegend,
		onClickBar
	}: Props = $props();

	let captureScreenshot: boolean = $state(false);

	let chart: BaseChart | undefined = undefined;

	const handleChart: Action<HTMLCanvasElement> = (element) => {
		chart = new BaseChart(element, {
			type: type,
			data: {
				labels: labels,
				datasets: getDatasets() as ChartDataset[]
			},
			options: getBaseChartOptions(),
			plugins: [htmlLegend, ...plugins]
		});

		$effect(() => {
			if (!chart) return;
			chart.data.labels = labels;
			chart.data.datasets = getDatasets() as ChartDataset[];
			Object.assign(chart.options, getBaseChartOptions());
			resetLegendState?.(chart);
			chart.update();
		});
	};

	export function updateChart() {
		if (!chart || !chart.canvas) return;
		chart.data.datasets = getDatasets() as ChartDataset[];
		resetLegendState?.(chart);
		chart.update();
		updateZoomLevel();
	}

	onDestroy(() => {
		chart?.destroy();
	});

	function getBaseChartOptions(): ChartOptions {
		const options = getOptions ? getOptions() : ({} as ChartOptions);
		const optionsSnapshot = {
			...options,
			plugins: {
				...(options?.plugins ?? {}),
				...pluginOptions
			} as NonNullable<ChartOptions<ChartType>['plugins']>
		};

		optionsSnapshot.plugins.legend = {
			display: captureScreenshot
		};
		if (captureScreenshot) {
			optionsSnapshot.animation = false;
		}

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

	$effect(() => {
		onUpdateColor();
	});

	async function onUpdateColor() {
		showChart = false;
		updateDefaultColor();
		await tick();
		showChart = true;
	}

	function updateDefaultColor() {
		const isDark = getTheme() === 'dark';
		BaseChart.defaults.color = isDark ? '#ddd' : '#222';
		BaseChart.defaults.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	}

	//#endregion

	//#region Zooming

	let xScale: [number, number] | null = $state(null);

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
		updateXScale();
	}
	$effect(updateZoomLevel);

	function updateXScale() {
		if (chart == undefined || chart.canvas == null) {
			return;
		}
		xScale = [chart.scales['x'].min as number, chart.scales['x'].max as number];
	}

	export function resetZoom() {
		chart?.resetZoom();
		updateXScale();
	}

	export function zoomIn() {
		chart?.zoom(1.2);
		updateXScale();
	}

	export function zoomOut() {
		chart?.zoom(0.8);
		updateXScale();
	}

	export function move(forward: boolean) {
		if (chart == undefined || chart.canvas == null) {
			return;
		}
		const xScale = chart.scales['x'];
		const range = xScale.max! - xScale.min!;
		const sign = forward ? 1 : -1;
		let amount = 0.3 * range;
		if (forward) {
			amount = Math.min(amount, (chart.data.labels as string[]).length - 1 - xScale.max!);
		} else {
			amount = Math.min(amount, xScale.min!);
		}
		chart.zoomScale('x', { min: xScale.min! + sign * amount, max: xScale.max! + sign * amount });
		updateXScale();
	}

	export function canMove(forward: boolean): boolean {
		if (chart == undefined || chart.canvas == null || xScale == null) {
			return false;
		}
		if (forward) {
			return xScale[1] < (chart.data.labels as string[]).length - 1;
		} else {
			return xScale[0] > 0;
		}
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

	function toggleLegendItem(event: Event, item: LegendItem) {
		if (chart == undefined) {
			return;
		}
		const activateOnlyOneItem = (event as MouseEvent).shiftKey;
		if (onClickLegend) {
			onClickLegend(item, chart, activateOnlyOneItem);
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
			if (activateOnlyOneItem) {
				const itemWasActive = chart.isDatasetVisible(item.datasetIndex);
				const activeDatasets = chart.data.datasets.filter((_, idx) => chart!.isDatasetVisible(idx));
				chart.data.datasets.forEach((_, idx) => {
					// Activate if the clicked item was the only one active, otherwise toggle the item's visibility.
					chart!.setDatasetVisibility(
						idx,
						(itemWasActive && activeDatasets.length === 1) || idx === item.datasetIndex
					);
				});
			} else {
				chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
			}
		}

		chart.update();
	}

	let patternsWithHiddenState: ColorBoxItem[] = $derived.by(() => {
		const hiddenPatterns = getHiddenPatterns();
		return patterns.map((pattern) => ({
			...pattern,
			hidden: hiddenPatterns.has(pattern.text)
		}));
	});

	function togglePattern(pattern: ColorBoxItem) {
		if (chart === undefined) return;
		onClickPattern(pattern, chart);
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

	//#region Download chart as image
	export async function downloadChartAsImage() {
		if (chart == undefined) {
			return;
		}

		captureScreenshot = true;
		await tick();

		const link = document.createElement('a');
		link.download = plotName + '.png';
		link.href = chart!.toBase64Image();
		document.body.appendChild(link); // Required for Firefox
		link.click();
		captureScreenshot = false;
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

{#snippet legend()}
	<h2 class="me-4 flex items-start text-lg font-bold">
		<span class="me-2">Legend</span>
		<HelpTooltip>
			Click on legend items to temporarily show/hide them in the chart.<br />
			Hold "Shift <i class="bi bi-shift"></i>" while clicking to show only the clicked item.
		</HelpTooltip>
	</h2>
	<div class="flex flex-wrap gap-2">
		{#each legendItems as item, idx (idx)}
			<button
				class="flex items-center text-sm text-gray-600 dark:text-gray-400"
				onclick={(event) => toggleLegendItem(event, item)}
			>
				<ColorBox item={item as ColorBoxItem}></ColorBox>
				<span class={[item.hidden && 'line-through']}>{item.text}</span>
			</button>
		{/each}
	</div>
{/snippet}

{#snippet patternSnippet()}
	{#if patternsWithHiddenState.length > 1}
		<h2 class="me-4 text-lg font-bold">
			<span class="me-2">Patterns</span>
			<HelpTooltip>Click on pattern items to temporarily show/hide them in the chart.</HelpTooltip>
		</h2>
		<div class="legend flex flex-wrap gap-2">
			{#each patternsWithHiddenState as pattern, idx (idx)}
				<button
					class="flex items-center text-sm text-gray-600 dark:text-gray-400"
					onclick={() => togglePattern(pattern)}
				>
					<ColorBox item={pattern}></ColorBox>
					<span class={[pattern.hidden && 'line-through']}>{pattern.text}</span>
				</button>
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet chartSnippet()}
	{#if showChart}
		<div id={`${id}-container`} class="position-relative h-full max-w-full">
			<canvas {id} height={initialHeight} use:handleChart onclick={emitClickBarEvent}></canvas>
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
	<ContentBox class="resize-y overflow-y-auto" children={chartSnippet}></ContentBox>
{:else}
	{#if legendItems.length > 0}
		<div class="mb-4 flex">
			{@render legend()}
		</div>
	{/if}
	{#if patterns.length > 1}
		<div class="mb-4 flex">
			{@render patternSnippet()}
		</div>
	{/if}
	{@render chartSnippet()}
{/if}
