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
		zoom_rect?: (min: number, max: number) => void;
	}

	let {
		id = 'chart',
		type,
		labels,
		datasets,
		options,
		plugins = [],
		zoom = false,
		plot_name = 'plot_data'
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
<div class="canvas-container" style="position: relative;">
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
		<button class="btn btn-secondary" onclick={downloadData}>
			<i class="bi bi-download"></i>
			<div class="visually-hidden">Download CSV Data</div>
		</button>
	</div>
	<canvas {id} use:handleChart></canvas>
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
