<script lang="ts">
	import Dropdown from '../../../components/Dropdown.svelte';
	import MapPlot from '../../../components/MapPlot.svelte';
	import MapPlotCanvas from '../../../components/MapPlotCanvas.svelte';

	let map: string | null = $state('world-1');
	let mapOptions: string[] = ['world-1', 'world-2', 'world-3', 'nuts-1', 'nuts-2', 'nuts-3'];
</script>

<div class="my-2">
	<Dropdown options={mapOptions} bind:selected_option={map} selection_changed={() => {}}></Dropdown>
</div>

<div>
	<MapPlot pieData={{}} lineData={{}} unit="" {map}></MapPlot>
	<!-- <MapPlotCanvas></MapPlotCanvas> -->
</div>
