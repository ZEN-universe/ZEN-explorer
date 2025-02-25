<script lang="ts">
	import Chart, { type ChartDataset } from 'chart.js/auto';
	import Modal from './Modal.svelte';

	import { onMount } from 'svelte';

	interface Props {
		config: any;
		zoom?: boolean;
		plot_name?: string;
	}

	let { config = $bindable(), zoom = false, plot_name = 'plot_data' }: Props = $props();

	onMount(async () => {
		const zoomPlugin = (await import('chartjs-plugin-zoom')).default;
		Chart.register(zoomPlugin);
		config.counter += 1;
	});

	let chart: Chart | undefined = $state(undefined);

	const handleChart = (element: any, config: any) => {
		chart = new Chart(element, config);
		return {
			async update(config: any) {
				if (chart!.resetZoom != undefined) {
					chart!.resetZoom();
				}
				chart!.destroy();
				chart = new Chart(element, config);
			},
			destroy() {
				chart!.resetZoom();
				chart!.destroy();
			}
		};
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
			labels.push(i.label);
		}

		csvContent += 'timestep,' + labels.join(',') + '\r\n';

		for (let timestep of Object.keys(config.data.datasets[0].data)) {
			csvContent += timestep;
			for (const dataset of config.data.datasets) {
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
	<canvas use:handleChart={config} id="myChart"></canvas>
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
