<script lang="ts">
    import Chart, { type ChartDataset } from "chart.js/auto";
    export let config;
    export let year_offset = 0;

    const handleChart = (element, config) => {
        let chart = new Chart(element, config);
        return {
            update(config) {
                chart.destroy();
                chart = new Chart(element, config);
            },
            destroy() {
                chart.destroy();
            },
        };
    };
</script>

<div class="row">
    <div class="col">
        <canvas use:handleChart={config} id="myChart"></canvas>
    </div>
</div>
