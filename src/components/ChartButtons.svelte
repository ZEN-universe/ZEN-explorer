<script lang="ts">
	import Chart from '$components/Chart.svelte';
	import Button from './Button.svelte';

	interface Props {
		charts: (Chart | undefined)[];
		zoomable?: boolean;
		downloadable?: boolean;
	}
	let { charts, zoomable = false, downloadable = false }: Props = $props();

	let hasCharts: boolean = $derived(charts.filter((c) => c).length > 0);

	let canMoveLeft: boolean = $derived(
		zoomable && hasCharts && charts[0] ? charts[0].canMove(false) : false
	);
	let canMoveRight: boolean = $derived(
		zoomable && hasCharts && charts[0] ? charts[0].canMove(true) : false
	);

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
				<Button class="-ml-[2px] rounded-none" onclick={charts[0]?.zoomOut}>
					<i class="bi bi-arrows-angle-contract me-2"></i>
					<div>Zoom out</div>
				</Button>
				<Button
					class="-ml-[2px] rounded-none"
					disabled={!canMoveLeft}
					onclick={() => charts[0]?.move(false)}
				>
					<i class="bi bi-arrow-bar-left me-2"></i>
					<div>Move left</div>
				</Button>
				<Button
					class="-ml-[2px] rounded-l-none rounded-r-lg"
					disabled={!canMoveRight}
					onclick={() => charts[0]?.move(true)}
				>
					<i class="bi bi-arrow-bar-right me-2"></i>
					<div>Move right</div>
				</Button>
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
