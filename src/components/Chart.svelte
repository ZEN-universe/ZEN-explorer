<script lang="ts" generics="Type extends ChartType">
	import BaseChart from 'chart.js/auto';
	import zoomPlugin from 'chartjs-plugin-zoom';
	import type { Action } from 'svelte/action';
	import { onDestroy } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartType, LegendItem, Plugin } from 'chart.js/auto';

	import Modal from '$components/Modal.svelte';
	import LegendColorBox from '$components/LegendColorBox.svelte';

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
		downloadable?: boolean;
		narrow?: boolean;
		zoomLevel?: [number, number] | null;
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
		downloadable = true,
		narrow = false,
		zoomLevel = $bindable(null),
		generateLabels,
		onClickLegend,
		onClickBar
	}: Props = $props();

	let chart: BaseChart | undefined = undefined;

	const handleChart: Action<HTMLCanvasElement> = (element) => {
		chart = new BaseChart(element, {
			type: type,
			data: {
				labels: labels,
				datasets: $state.snapshot(datasets) as ChartDataset[]
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
				datasets: $state.snapshot(datasets) as ChartDataset[]
			};
			Object.assign(chart.options, getOptions());
			chart.update();
		});
	};

	export function updateChart(datasets: ChartDataset<Type>[]) {
		if (chart == undefined || chart.canvas == null) {
			return;
		}
		chart.data.datasets = $state.snapshot(datasets) as ChartDataset[];
		chart.update();
		updateZoomLevel();
	}

	onDestroy(() => {
		chart?.destroy();
	});

	function getOptions(): ChartOptions {
		const optionsSnapshot = $state.snapshot(options as ChartOptions);
		optionsSnapshot.plugins = {
			...(optionsSnapshot.plugins ?? {}),
			...pluginOptions
		} as Record<string, any>;

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

	function resetZoom() {
		chart?.resetZoom();
	}

	let legendItems: Array<LegendItem> = $state([]);

	const htmlLegend: Plugin = {
		id: 'htmlLegend',
		afterUpdate(chart) {
			if (generateLabels) {
				legendItems = generateLabels(chart);
			} else {
				legendItems = chart.options.plugins?.legend?.labels?.generateLabels?.(chart) || [];
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

	let modal_open = $state(false);
	const toggle = () => {
		modal_open = !modal_open;
	};

	function downloadData() {
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

<!-- Modal -->
<Modal header="Zoom Controls" isOpen={modal_open} {toggle}>
	<p>
		You can zoom in the graph into the chart by either highlighting an area with your mouse or by
		scrolling.
	</p>
	<p>When zoomed in, you can press and hold CTRL and drag the plot to move along the time axis.</p>
	<p>The home button resets the zoom.</p>
</Modal>
<div class="canvas-container d-flex flex-column justify-content-between h-100 py-2">
	{#if zoom || downloadable}
		<div class="d-flex justify-content-end mb-2">
			{#if zoom}
				<div class={['btn-group', downloadable && 'me-2']}>
					<button class="btn btn-outline-secondary d-flex" onclick={toggle}>
						<i class="bi bi-info me-2"></i>
						<div>Show Help</div>
					</button>
					<button class="btn btn-outline-secondary d-flex" onclick={resetZoom}>
						<i class="bi bi-house me-2"></i>
						<div>Reset zoom</div>
					</button>
				</div>
			{/if}
			{#if downloadable}
				<button class="btn btn-outline-secondary d-flex" onclick={downloadData}>
					<i class="bi bi-download me-2"></i>
					<div>Download CSV Data</div>
				</button>
			{/if}
		</div>
	{/if}
	<div class="legend d-flex flex-wrap justify-content-center">
		{#each legendItems as item}
			<button
				class="btn btn-text rounded-0 d-flex align-items-center p-0 me-2"
				style:color={item.fontColor?.toString() || 'inherit'}
				style:font-size="12px"
				style:letter-spacing="0.0em"
				style:font-family="Arial, sans-serif"
				onclick={() => toggleLegendItem(item)}
			>
				<LegendColorBox {item}></LegendColorBox>
				<span class={[item.hidden && 'text-decoration-line-through']}>{item.text}</span>
			</button>
		{/each}
	</div>
	<div class="position-relative" style:min-height={narrow ? '259px' : '558px'}>
		<canvas {id} use:handleChart onclick={emitClickBarEvent}></canvas>
	</div>
</div>
