<script lang="ts">
    import Chart, { type ChartDataset } from "chart.js/auto";
    export let datasets: ChartDataset[];
    export let year_offset = 0;

    const options = {
        responsive: true,
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
            },
        },
    };

    const handleChart = (element, data) => {
        let chart = new Chart(element, {
            type: "bar",
            data: {
                datasets: data,
            },
            options: options,
        });
        return {
            update(data) {
                chart.destroy();
                chart = new Chart(element, {
                    type: "bar",
                    data: {
                        datasets: data,
                    },
                    options: options,
                });
            },
            destroy() {
                chart.destroy();
            },
        };
    };
</script>

<div class="row">
    <div class="col">
        <canvas use:handleChart={datasets} id="myChart"></canvas>
    </div>
</div>
