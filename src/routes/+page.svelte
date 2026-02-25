<script lang="ts">
	import { computePosition, shift, offset, arrow, flip } from '@floating-ui/dom';
	import { resolve } from '$app/paths';
	import { tick } from 'svelte';

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

<div class="grid grow grid-cols-1 place-content-center dark:bg-gray-800">
	<main class="relative mx-auto w-full max-w-300 px-4 py-8">
		<div class="grid w-full gap-6 md:grid-cols-2 md:grid-rows-2" bind:this={boundaryElement}>
			<!-- Transition -->
			<section
				aria-label="The Transition Pathway"
				class="grid min-h-60 overflow-hidden border border-gray-400 bg-[#6e7e2c] md:rounded-tl-lg lg:grid-cols-4 dark:border-gray-800"
				onmouseenter={() => showPopup('transition-pathway')}
				onmouseleave={hidePopup}
				onfocusin={() => showPopup('transition-pathway')}
				onfocusout={hidePopup}
			>
				<h2
					class="my-auto text-center text-3xl font-extrabold tracking-tight text-white lg:order-1 lg:col-span-2"
					bind:this={transitionPathwaySection}
				>
					The Transition Pathway
				</h2>
				<nav
					aria-label="Transition links"
					class="grid grid-cols-2 bg-white/60 text-xl lg:order-0 lg:h-full lg:grid-cols-1 lg:grid-rows-4 dark:bg-gray-800/40"
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
				class="grid min-h-60 overflow-hidden border border-gray-400 bg-[#387e70] md:grid-cols-4 md:rounded-tr-lg dark:border-gray-800"
				onmouseenter={() => showPopup('energy-balance')}
				onmouseleave={hidePopup}
				onfocusin={() => showPopup('energy-balance')}
				onfocusout={hidePopup}
			>
				<h2
					class="my-auto text-center text-3xl font-extrabold tracking-tight text-white md:col-span-2 md:col-start-2"
					bind:this={energyBalanceSection}
				>
					The Energy Balance
				</h2>
				<nav
					aria-label="Energy balance links"
					class="grid h-full grid-cols-2 bg-white/60 text-xl md:grid-cols-1 md:grid-rows-2 dark:bg-gray-800/40"
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
				class="group relative grid min-h-60 place-content-center overflow-hidden border border-gray-400 bg-[#4270a8] p-4 md:rounded-bl-lg dark:border-gray-800"
				onmouseenter={() => showPopup('energy-system')}
				onmouseleave={hidePopup}
				onfocusin={() => showPopup('energy-system')}
				onfocusout={hidePopup}
			>
				<h2 class="text-3xl font-extrabold text-white" bind:this={energySystemSection}>
					The Energy System
				</h2>
				<a
					class="absolute inset-0 focus:ring-4 focus:ring-white/80 focus:ring-offset-2 focus:outline-none dark:focus:ring-gray-700/80"
					href={resolve('/energy_system')}
					aria-label="The Energy System"
				></a>
			</div>

			<!-- Map -->
			<section
				aria-label="The Map"
				class="grid min-h-60 overflow-hidden border border-gray-400 bg-[#ae995e] md:rounded-br-lg lg:grid-cols-4 dark:border-gray-800"
				onmouseenter={() => showPopup('map')}
				onmouseleave={hidePopup}
				onfocusin={() => showPopup('map')}
				onfocusout={hidePopup}
			>
				<h2
					class="my-auto text-center text-3xl font-extrabold tracking-tight text-white lg:col-span-2 lg:col-start-2"
					bind:this={mapSection}
				>
					The Map
				</h2>
				<nav
					aria-label="Map links"
					class="grid grid-cols-2 bg-white/60 text-xl lg:h-full lg:grid-cols-1 lg:grid-rows-2 dark:bg-gray-800/40"
				>
					<div
						class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50"
					>
						<span class="font-medium">Capacity</span>
						<a class="absolute inset-0" href={resolve('/map/capacity/')} aria-label="Capacity"></a>
					</div>
					<div
						class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50"
					>
						<span class="font-medium">Production</span>
						<a class="absolute inset-0" href={resolve('/map/production/')} aria-label="Production"
						></a>
					</div>
				</nav>
			</section>

			<!-- decorative centered logo for large screens -->
			<div class="pointer-events-none absolute inset-0 hidden place-content-center lg:grid">
				<div class="relative">
					<div class="absolute inset-1 z-0 rounded-full bg-white"></div>
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
				'pointer-events-none absolute top-0 left-0 z-3 w-[320px] rounded-lg border border-black bg-gray-200 p-2 text-gray-800 lg:w-[500px]',
				isPopupVisible ? 'hidden md:block' : 'hidden'
			]}
			style={popupStyle()}
			bind:this={popup}
		>
			{#if activeSectionId === 'transition-pathway'}
				<p>Annual values and how they change over time</p>
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
