<script lang="ts">
    import Chart, { type ChartDataset } from "chart.js/auto";
    import { Button, Modal } from "@sveltestrap/sveltestrap";

    import { onMount } from "svelte";
    export let config;
    export let zoom = false;

    onMount(async () => {
        const zoomPlugin = (await import("chartjs-plugin-zoom")).default;
        Chart.register(zoomPlugin);
        config.counter += 1;
    });

    let chart: Chart | undefined = undefined;

    const handleChart = (element, config) => {
        chart = new Chart(element, config);
        return {
            async update(config) {
                if (chart!.resetZoom) {
                    chart!.resetZoom();
                }
                chart!.destroy();
                chart = new Chart(element, config);
            },
            destroy() {
                chart!.resetZoom();
                chart!.destroy();
            },
        };
    };
    let modal_open = false;
    const toggle = () => {
        modal_open = !modal_open;
    };

    function downloadData() {
        let csvContent = "data:text/csv;charset=utf-8,";

        let labels: String[] = [];
        const n_data = 1;
        for (let i of config.data.datasets) {
            labels.push(i.label);
        }

        csvContent += "timestep," + labels.join(",") + "\r\n";

        for (let timestep of Object.keys(config.data.datasets[0].data)) {
            csvContent += timestep;
            for (const dataset of config.data.datasets) {
                csvContent += "," + dataset.data[timestep];
            }
            csvContent += "\r\n";
        }
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "my_data.csv");
        document.body.appendChild(link); // Required for FF

        link.click();
    }
</script>

<!-- Modal -->
<Modal body header="Modal title" isOpen={modal_open} {toggle}>
    You can zoom in the graph into the chart by either highlighting an area with
    your mouse or by scrolling. <br />
    <br />
    When zoomed in, you can press and hold CTRL and drag the plot to move along the
    time axis.<br />
    <br />
    The home button resets the zoom.<br />
    <br />
    The download button downloads the data that is plotted as csv.<br />
</Modal>
<div class="row">
    <div class="col canvas-container" style="position: relative;">
        <div style="position: absolute; top: -1em; right: 0;" class="btn-group">
            {#if zoom}
                <Button on:click={toggle}><i class="bi bi-info"></i></Button>
                <Button
                    on:click={() => {
                        chart?.resetZoom();
                    }}><i class="bi bi-house"></i></Button
                >
            {/if}
            <Button on:click={downloadData}
                ><i class="bi bi-download"></i></Button
            >
        </div>
        <canvas use:handleChart={config} id="myChart"></canvas>
    </div>
</div>

<style>
    .show {
        display: block;
    }

    .btn-group {
        opacity: 0;
        transition: opacity 0.3s;
    }

    .canvas-container:hover > .btn-group {
        opacity: 1;
    }
</style>
