<script lang="ts">
	import Chart from 'chart.js/auto';
	import zoomPlugin from 'chartjs-plugin-zoom';
	import type { Action } from 'svelte/action';
	import Modal from './Modal.svelte';
	import { onDestroy } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartType, Plugin } from 'chart.js/auto';

	Chart.register(zoomPlugin);

	interface Props {
		id?: string;
		type: ChartType;
		labels?: string[];
		datasets: ChartDataset<ChartType>[];
		options?: ChartOptions<ChartType>;
		plugins?: Plugin<ChartType>[];
		zoom?: boolean;
		plot_name?: string;
		downloadable?: boolean;
		onclick?: (event: any) => void;
	}

	let {
		id = 'chart',
		type,
		labels,
		datasets,
		options,
		plugins = [],
		zoom = false,
		plot_name = 'plot_data',
		downloadable = true,
		onclick
	}: Props = $props();
	let chart: Chart | undefined = undefined;

	const handleChart: Action<HTMLCanvasElement> = (element) => {
		chart = new Chart(element, {
			type: type,
			data: {
				labels: labels,
				datasets: $state.snapshot(datasets) as ChartDataset[]
			},
			options: $state.snapshot(options) as ChartOptions,
			plugins: plugins
		});

		$effect(() => {
			if (chart == undefined || chart.canvas == null) {
				return;
			}
			chart.data = {
				labels: labels,
				datasets: $state.snapshot(datasets) as ChartDataset[]
			};
			Object.assign(chart.options, $state.snapshot(options) as ChartOptions);
			chart.update();
		});
	};

	export function updateChart(datasets: ChartDataset<ChartType>[]) {
		if (chart == undefined || chart.canvas == null) {
			return;
		}
		chart.data.datasets = $state.snapshot(datasets) as ChartDataset[];
		chart.update();
	}

	onDestroy(() => {
		chart?.destroy();
	});

	export function zoom_rect(min: number, max: number) {
		if (chart == undefined || chart.canvas == null) {
			return;
		}
		chart.zoomScale('x', { min, max });
	}

	function resetZoom() {
		chart?.resetZoom();
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
		link.setAttribute('download', plot_name);
		document.body.appendChild(link); // Required for Firefox
		link.click();
	}

	function onCanvasClick(event: Event) {
		if (chart == undefined || labels == undefined || onclick == undefined) {
			return;
		}
		const res = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
		if (res.length === 0) {
			return;
		}
		onclick(labels[res[0].index]);
	}
</script>

<!-- Modal -->
<Modal header="Modal title" isOpen={modal_open} {toggle}>
	<p>
		You can zoom in the graph into the chart by either highlighting an area with your mouse or by
		scrolling.
	</p>
	<p>When zoomed in, you can press and hold CTRL and drag the plot to move along the time axis.</p>
	<p>The home button resets the zoom.</p>
	<p>The download button downloads the data that is plotted as csv.</p>
</Modal>
<div class="canvas-container position-relative">
	<div style="position: absolute; top: -1em; right: 0;" class="btn-group">
		{#if zoom}
			<button class="btn btn-secondary" onclick={toggle}>
				<i class="bi bi-info"></i>
				<div class="visually-hidden">Show Help for Zoom</div>
			</button>
			<button class="btn btn-secondary" onclick={resetZoom}>
				<i class="bi bi-house"></i>
				<div class="visually-hidden">Reset zoom</div>
			</button>
		{/if}
		{#if downloadable}
			<button class="btn btn-secondary" onclick={downloadData}>
				<i class="bi bi-download"></i>
				<div class="visually-hidden">Download CSV Data</div>
			</button>
		{/if}
	</div>
	<div class="position-relative" style="min-height: 558px">
		<canvas {id} use:handleChart onclick={onCanvasClick}></canvas>
	</div>
</div>

<style>
	.btn-group {
		opacity: 0;
		transition: opacity 0.3s;
	}

	.canvas-container:hover > .btn-group {
		opacity: 1;
	}
</style>
