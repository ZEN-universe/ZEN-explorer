<script lang="ts">
	import Chart, { type ChartConfiguration } from 'chart.js/auto';
	import Modal from './Modal.svelte';

	import { onDestroy, onMount } from 'svelte';
	import type { Action } from 'svelte/action';

	interface Props {
		config: ChartConfiguration;
		zoom?: boolean;
		plot_name?: string;
	}

	let { config, zoom = false, plot_name = 'plot_data' }: Props = $props();

	onMount(async () => {
		const zoomPlugin = (await import('chartjs-plugin-zoom')).default;
		Chart.register(zoomPlugin);
	});

	onDestroy(() => {
		if (chart === undefined) return;
		chart.destroy();
	});

	let chart: Chart | undefined = undefined;

	const handleChart: Action<HTMLCanvasElement> = (element) => {
		if (element == null) return;

		chart = new Chart(element, config);

		$effect(() => {
			if (chart !== undefined) {
				chart.destroy();
			}
			chart = new Chart(element, config);

			return () => {
				if (chart !== undefined) {
					chart.destroy();
				}
			};
		});
	};

	let modal_open = $state(false);
	const toggle = () => {
		modal_open = !modal_open;
	};

	function downloadData() {
		let csvContent = 'data:text/csv;charset=utf-8,';

		let labels: String[] = [];
		const n_data = 1;
		for (let i of config.data.datasets) {
			labels.push(i.label != undefined ? i.label : '');
		}

		csvContent += 'timestep,' + labels.join(',') + '\r\n';

		for (let timestep of Object.keys(config.data.datasets[0].data)) {
			csvContent += timestep;
			for (const dataset of config.data.datasets) {
				// @ts-ignore
				csvContent += ',' + dataset.data[timestep];
			}
			csvContent += '\r\n';
		}
		var encodedUri = encodeURI(csvContent);
		var link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', plot_name);
		document.body.appendChild(link); // Required for FF

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
			<button
				class="btn btn-secondary"
				onclick={() => {
					chart?.resetZoom();
				}}
			>
				<i class="bi bi-house"></i>
				<div class="visually-hidden">Reset zoom</div>
			</button>
		{/if}
		<button class="btn btn-secondary" onclick={downloadData}>
			<i class="bi bi-download"></i>
			<div class="visually-hidden">Download CSV Data</div>
		</button>
	</div>
	<canvas use:handleChart id="myChart"></canvas>
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
