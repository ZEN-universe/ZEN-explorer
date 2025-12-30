<script lang="ts">
	import Chart from '$components/Chart.svelte';
	import Button from './Button.svelte';
	import HelpTooltip from './HelpTooltip.svelte';

	interface Props {
		charts: (Chart | undefined)[];
		zoomable?: boolean;
		downloadable?: boolean;
	}
	let { charts, zoomable = false, downloadable = false }: Props = $props();

	let hasCharts: boolean = $derived(charts.filter((c) => c).length > 0);

	function downloadAllChartsData() {
		if (!hasCharts) return;
		charts.forEach((c) => {
			c?.downloadData();
		});
	}

	function downloadAllChartsAsImages() {
		if (!hasCharts) return;
		charts.forEach((c) => {
			c?.downloadChartAsImage();
		});
	}
</script>

{#if hasCharts}
	<div class="flex flex-wrap justify-end items-end h-full gap-4">
		{#if zoomable}
			<div class={['flex flex-wrap items-center']}>
				<Button class="rounded-l-lg rounded-r-none" onclick={charts[0]?.resetZoom}>
					<i class="bi bi-house me-2"></i>
					<div>Reset zoom</div>
				</Button>
				<Button class="-ml-[2px] rounded-none" onclick={charts[0]?.zoomIn}>
					<i class="bi bi-arrows-angle-expand me-2"></i>
					<div>Zoom in</div>
				</Button>
				<Button class="-ml-[2px] rounded-l-none rounded-r-lg" onclick={charts[0]?.zoomOut}>
					<i class="bi bi-arrows-angle-contract me-2"></i>
					<div>Zoom out</div>
				</Button>
				<div class="ms-1">
					<HelpTooltip>Click and drag over the plot to select a custom time horizon.</HelpTooltip>
				</div>
			</div>
		{/if}
		{#if downloadable}
			<Button onclick={downloadAllChartsData}>
				<i class="bi bi-file-earmark-spreadsheet me-2"></i>
				<div>Download CSV Data</div>
			</Button>
		{/if}
		<Button onclick={downloadAllChartsAsImages}>
			<i class="bi bi-image me-2"></i>
			<div>Download as PNG</div>
		</Button>
	</div>
{/if}
