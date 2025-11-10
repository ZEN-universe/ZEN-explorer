<script lang="ts">
	import Chart from '$components/Chart.svelte';
	import Button from './Button.svelte';

	interface Props {
		chart: Chart | undefined;
		zoomable?: boolean;
		downloadable?: boolean;
	}
	let { chart, zoomable = false, downloadable = false }: Props = $props();
</script>

{#if zoomable || downloadable}
	<div class="flex justify-end items-end h-full gap-4">
		{#if zoomable}
			<div class={['flex items-center', downloadable && 'me-2']}>
				<Button class="rounded-l-lg rounded-r-none" onclick={chart?.resetZoom}>
					<i class="bi bi-house me-2"></i>
					<div>Reset zoom</div>
				</Button>
				<Button class="-ml-[2px] rounded-none" onclick={chart?.zoomIn}>
					<i class="bi bi-arrows-angle-expand me-2"></i>
					<div>Zoom in</div>
				</Button>
				<Button class="-ml-[2px] rounded-l-none rounded-r-lg" onclick={chart?.zoomOut}>
					<i class="bi bi-arrows-angle-contract me-2"></i>
					<div>Zoom out</div>
				</Button>
			</div>
		{/if}
		{#if downloadable}
			<Button onclick={chart?.downloadData}>
				<i class="bi bi-download me-2"></i>
				<div>Download CSV Data</div>
			</Button>
		{/if}
	</div>
{/if}
