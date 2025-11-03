<script lang="ts">
	import Chart from "$components/Chart.svelte";

    interface Props {
        chart: Chart | undefined;
        zoomable?: boolean;
        downloadable?: boolean;
    }
    let {chart, zoomable = false, downloadable = false}: Props = $props();
</script>

{#if zoomable || downloadable}
    <div class="flex justify-end items-end h-full">
        {#if zoomable}
            <div class={['flex items-center', downloadable && 'me-2']}>
                <button
                    class="border-2 border-blue-800 dark:border-blue-600 text-blue-800 dark:text-blue-600 rounded-l-lg px-4 py-2 flex"
                    onclick={chart?.resetZoom}
                >
                    <i class="bi bi-house me-2"></i>
                    <div>Reset zoom</div>
                </button>
                <button
                    class="border-2 -ml-[2px] border-blue-800 dark:border-blue-600 text-blue-800 dark:text-blue-600 px-4 py-2 flex"
                    onclick={chart?.zoomIn}
                >
                    <i class="bi bi-arrows-angle-expand me-2"></i>
                    <div>Zoom in</div>
                </button>
                <button
                    class="border-2 -ml-[2px] border-blue-800 dark:border-blue-600 text-blue-800 dark:text-blue-600 rounded-r-lg px-4 py-2 flex"
                    onclick={chart?.zoomOut}
                >
                    <i class="bi bi-arrows-angle-contract me-2"></i>
                    <div>Zoom out</div>
                </button>
            </div>
        {/if}
        {#if downloadable}
            <button
                class="border-2 border-blue-800 dark:border-blue-600 text-blue-800 dark:text-blue-600 rounded-lg px-4 py-2 flex"
                onclick={chart?.downloadData}
            >
                <i class="bi bi-download me-2"></i>
                <div>Download CSV Data</div>
            </button>
        {/if}
    </div>
{/if}