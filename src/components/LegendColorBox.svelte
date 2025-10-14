<script lang="ts">
	import type { LegendItem } from 'chart.js';

	interface Props {
		item: LegendItem;
	}

	let { item }: Props = $props();

	let isCanvasPattern = $derived(item.fillStyle instanceof CanvasPattern);

	function renderCanvas(canvas: HTMLCanvasElement) {
		if (!(item.fillStyle instanceof CanvasPattern)) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.fillStyle = item.fillStyle;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = item.strokeStyle?.toString() || 'transparent';
        ctx.lineWidth = item.lineWidth || 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
	}
</script>

{#if isCanvasPattern}
	<canvas width="40" height="12" class="legend-box me-1" {@attach renderCanvas}></canvas>
{:else}
	<svg width="40" height="12" class="legend-box me-1">
		<rect
			width="40"
			height="12"
			style:fill={item.fillStyle?.toString() || 'transparent'}
			style:stroke={item.strokeStyle?.toString() || 'transparent'}
			style:stroke-width="{item.lineWidth}px"
			style:opacity={item.hidden ? 0.5 : 1}
		></rect>
	</svg>
{/if}
