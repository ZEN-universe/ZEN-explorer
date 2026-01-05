<script lang="ts">
	import { computePosition, shift, offset, arrow, flip } from '@floating-ui/dom';
	import { resolve } from '$app/paths';
	import { tick } from 'svelte';

	import transitionPathwaySketch from '@/plot-sketches/transition-pathway.svg';

	let transitionPathwaySection = $state<HTMLElement>();
	let energyBalanceSection = $state<HTMLElement>();
	let energySystemSection = $state<HTMLElement>();
	let mapSection = $state<HTMLElement>();

	let popup = $state<HTMLDivElement>();
	let boundaryElement = $state<HTMLElement>();
	let arrowElement = $state<SVGSVGElement>();

	let popupLeft: number | null = $state(null);
	let popupTop: number | null = $state(null);
	let popupPlacement: 'top' | 'bottom' | 'left' | 'right' = $state('left');
	let arrowLeft: number | null = $state(null);
	let arrowTop: number | null = $state(null);

	let isPopupVisible = $state(false);
	let activeSectionId: string = $state('transition-pathway');
	let activeSection: HTMLElement | undefined = $derived.by(() => {
		const map: Record<string, HTMLElement | undefined> = {
			'transition-pathway': transitionPathwaySection,
			'energy-balance': energyBalanceSection,
			'energy-system': energySystemSection,
			map: mapSection
		};
		return map[activeSectionId];
	});

	async function updatePopupPosition(section?: HTMLElement) {
		if (!section || !popup || !boundaryElement || !arrowElement) return;

		const { x, y, placement, middlewareData } = await computePosition(section, popup, {
			placement: 'left',
			middleware: [
				offset(8),
				flip({ boundary: boundaryElement }),
				shift({ padding: 8, boundary: boundaryElement }),
				arrow({ element: arrowElement })
			]
		});

		popupLeft = x;
		popupTop = y;
		popupPlacement = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
		arrowLeft = middlewareData.arrow?.x ?? null;
		arrowTop = middlewareData.arrow?.y ?? null;
	}

	async function showPopup(id: string) {
		activeSectionId = id;
		isPopupVisible = true;

		await tick();
		updatePopupPosition(activeSection);
	}

	function hidePopup() {
		isPopupVisible = false;
	}

	function popupStyle(): string {
		return `
			top: ${popupTop !== null ? `${popupTop}px` : '0px'};
			left: ${popupLeft !== null ? `${popupLeft}px` : '0px'};
		`;
	}

	function arrowStyle(): string {
		return `
			${popupPlacement === 'left' ? `right: -10px; top: ${arrowTop !== null ? `${arrowTop}px` : '20px'};` : ''}
			${popupPlacement === 'right' ? `left: -10px; top: ${arrowTop !== null ? `${arrowTop}px` : '20px'};` : ''}
			${popupPlacement === 'top' ? `bottom: -10px; left: ${arrowLeft !== null ? `${arrowLeft}px` : '20px'};` : ''}
			${popupPlacement === 'bottom' ? `top: -10px; left: ${arrowLeft !== null ? `${arrowLeft}px` : '20px'};` : ''}
		`;
	}
</script>

<div class="grid grid-cols-1 grow dark:bg-gray-800 place-content-center">
	<main class="relative w-full max-w-300 mx-auto py-8 px-4">
		<div class="w-full grid md:grid-cols-2 md:grid-rows-2 gap-6" bind:this={boundaryElement}>
			<!-- Transition -->
			<section
				aria-label="The Transition Pathway"
				class="bg-[#6e7e2c] lg:grid-cols-4 border border-gray-400 dark:border-gray-800 md:rounded-tl-lg min-h-60 grid overflow-hidden"
				onmouseenter={() => showPopup('transition-pathway')}
				onmouseleave={hidePopup}
				onfocusin={() => showPopup('transition-pathway')}
				onfocusout={hidePopup}
			>
				<h2
					class="font-extrabold text-3xl lg:order-1 lg:col-span-2 my-auto text-center text-white tracking-tight"
					bind:this={transitionPathwaySection}
				>
					The Transition Pathway
				</h2>
				<nav
					aria-label="Transition links"
					class="lg:order-0 grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-4 lg:h-full bg-white/60 dark:bg-gray-800/40 text-xl"
				>
					<div
						class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50"
					>
						<span class="font-medium">Capacity</span>
						<a
							class="absolute inset-0"
							href={resolve('/transition/capacity/')}
							aria-label="Capacity"
						></a>
					</div>
					<div
						class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50"
					>
						<span class="font-medium">Production</span>
						<a
							class="absolute inset-0"
							href={resolve('/transition/production/')}
							aria-label="Production"
						></a>
					</div>
					<div
						class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50"
					>
						<span class="font-medium">Emissions</span>
						<a
							class="absolute inset-0"
							href={resolve('/transition/emissions/')}
							aria-label="Emissions"
						></a>
					</div>
					<div
						class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50"
					>
						<span class="font-medium">Costs</span>
						<a class="absolute inset-0" href={resolve('/transition/costs/')} aria-label="Costs"></a>
					</div>
				</nav>
			</section>

			<!-- Energy Balance -->
			<section
				aria-label="The Energy Balance"
				class="bg-[#387e70] border border-gray-400 dark:border-gray-800 md:rounded-tr-lg min-h-60 grid md:grid-cols-4 overflow-hidden"
				onmouseenter={() => showPopup('energy-balance')}
				onmouseleave={hidePopup}
				onfocusin={() => showPopup('energy-balance')}
				onfocusout={hidePopup}
			>
				<h2
					class="font-extrabold text-3xl md:col-start-2 md:col-span-2 my-auto text-center text-white tracking-tight"
					bind:this={energyBalanceSection}
				>
					The Energy Balance
				</h2>
				<nav
					aria-label="Energy balance links"
					class="grid grid-cols-2 md:grid-cols-1 md:grid-rows-2 h-full bg-white/60 dark:bg-gray-800/40 text-xl"
				>
					<div
						class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50"
					>
						<span class="font-medium">Nodal</span>
						<a class="absolute inset-0" href={resolve('/energy_balance/nodal/')} aria-label="Nodal"
						></a>
					</div>
					<div
						class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50"
					>
						<span class="font-medium">Storage</span>
						<a
							class="absolute inset-0"
							href={resolve('/energy_balance/storage/')}
							aria-label="Storage"
						></a>
					</div>
				</nav>
			</section>

			<!-- Energy System -->
			<div
				role="region"
				class="bg-[#4270a8] border border-gray-400 dark:border-gray-800 md:rounded-bl-lg min-h-60 relative grid place-content-center group p-4 overflow-hidden"
				onmouseenter={() => showPopup('energy-system')}
				onmouseleave={hidePopup}
				onfocusin={() => showPopup('energy-system')}
				onfocusout={hidePopup}
			>
				<h2 class="font-extrabold text-3xl text-white" bind:this={energySystemSection}>
					The Energy System
				</h2>
				<a
					class="absolute inset-0 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-white/80 dark:focus:ring-gray-700/80"
					href={resolve('/energy_system')}
					aria-label="The Energy System"
				></a>
			</div>

			<!-- Map -->
			<div
				role="region"
				class="bg-[#ae995e] border border-gray-400 dark:border-gray-800 md:rounded-br-lg min-h-60 relative grid place-content-center group p-4 overflow-hidden"
				onmouseenter={() => showPopup('map')}
				onmouseleave={hidePopup}
				onfocusin={() => showPopup('map')}
				onfocusout={hidePopup}
			>
				<h2 class="font-extrabold text-3xl text-white" bind:this={mapSection}>The Map</h2>
				<a
					class="absolute inset-0 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-white/80 dark:focus:ring-gray-700/80"
					href={resolve('/map')}
					aria-label="The Map"
				></a>
			</div>

			<!-- decorative centered logo for large screens -->
			<div class="absolute inset-0 hidden lg:grid place-content-center pointer-events-none">
				<div class="relative">
					<div class="absolute inset-1 rounded-full bg-white z-0"></div>
					<img
						class="relative z-1"
						width="340"
						height="340"
						alt="ZEN-garden Logo"
						src="/zen_garden_700x700.png"
					/>
				</div>
			</div>
		</div>

		<div
			class={[
				'absolute top-0 left-0 z-3 w-[320px] lg:w-[500px] border bg-gray-200 text-gray-800 border-black rounded-lg p-2 pointer-events-none',
				isPopupVisible ? 'hidden md:block' : 'hidden'
			]}
			style={popupStyle()}
			bind:this={popup}
		>
			{#if activeSectionId === 'transition-pathway'}
				<p>Annual values and how they change over time</p>
				<img src={transitionPathwaySketch} width="400" alt="Transition Pathway Sketch" />
			{:else if activeSectionId === 'energy-balance'}
				<p>Hourly time series of operational variables</p>
			{:else if activeSectionId === 'energy-system'}
				<p>Sankey diagram of energy flows</p>
			{:else if activeSectionId === 'map'}
				<p>Map of conversion, storage, and transport capacities</p>
			{/if}

			<svg
				class="absolute z-3"
				style={arrowStyle()}
				width={popupPlacement === 'left' || popupPlacement === 'right' ? '10' : '20'}
				height={popupPlacement === 'left' || popupPlacement === 'right' ? '20' : '10'}
				viewBox={popupPlacement === 'left' || popupPlacement === 'right'
					? '0 0 10 20'
					: '0 0 20 10'}
				fill="none"
				bind:this={arrowElement}
			>
				{#if popupPlacement === 'left'}
					<path d="M0 0L10 10L0 20H0Z" class="fill-gray-200" />
					<path d="M0 0L10 10L0 20" class="fill-none stroke-black" />
				{:else if popupPlacement === 'right'}
					<path d="M10 20L0 10L10 0H20Z" class="fill-gray-200" />
					<path d="M10 20L0 10L10 0" class="fill-none stroke-black" />
				{:else if popupPlacement === 'top'}
					<path d="M0 0L10 10L20 0H0Z" class="fill-gray-200" />
					<path d="M0 0L10 10L20 0" class="fill-none stroke-black" />
				{:else if popupPlacement === 'bottom'}
					<path d="M0 10L10 0L20 10H0Z" class="fill-gray-200" />
					<path d="M0 10L10 0L20 10" class="fill-none stroke-black" />
				{/if}
			</svg>
		</div>
	</main>
</div>
