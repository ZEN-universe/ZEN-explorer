<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';

	interface Blade {
		name: string;
		left: number;
		bottom: number;
		bg: string;
		hoverBg: string;
		classes: string;
		href?: Pathname;
		subpagesLeft?: boolean;
		subpages?: { name: string; href: Pathname; left: number; bottom: number }[];
	}
	const blades: Blade[] = [
		{
			name: 'The Transition pathway',
			left: 98,
			bottom: 460,
			bg: '#e4d4c8',
			hoverBg: '#ece2d9',
			classes: 'rotate-45 origin-top-left',
			subpagesLeft: true,
			subpages: [
				{ name: 'Capacity', href: '/explorer/transition/capacity', left: -70, bottom: 458 },
				{ name: 'Production', href: '/explorer/transition/production', left: -45, bottom: 418 },
				{ name: 'Emissions', href: '/explorer/transition/emissions', left: 0, bottom: 378 },
				{ name: 'Costs', href: '/explorer/transition/costs', left: 72, bottom: 338 }
			]
		},
		{
			name: 'The Energy Balance',
			left: 253,
			bottom: 436,
			bg: '#c4d2b8',
			hoverBg: '#eaf0e6',
			classes: 'origin-top-right -rotate-45',
			subpagesLeft: false,
			subpages: [
				{ name: 'Nodal', href: '/explorer/energy_balance/nodal', left: 476, bottom: 397 },
				{ name: 'Storage', href: '/explorer/energy_balance/storage', left: 436, bottom: 357 }
			]
		},
		{
			name: 'The Energy System',
			left: 74,
			bottom: 41,
			href: '/explorer/energy_system',
			bg: '#dbd8c2',
			hoverBg: '#d2cdad',
			classes: 'origin-bottom-left -rotate-45'
		},
		{
			name: 'The Map',
			left: 230,
			bottom: 18,
			bg: '#c7d2db',
			hoverBg: '#e0e6eb',
			classes: 'origin-bottom-right rotate-45',
			subpagesLeft: true,
			subpages: [
				{ name: 'Capacity', href: '/explorer/map/capacity', left: 239, bottom: 106 },
				{ name: 'Production', href: '/explorer/map/production', left: 264, bottom: 66 }
			]
		}
	];

	const LG_SCALE_UP = 650 / 552;
</script>

<div
	class="relative min-h-[calc(100vh_-_57px)] text-gray-900 md:h-180 lg:h-210 lg:min-h-[calc(100vh_-_65px)]"
>
	<!-- Background -->
	<div class="absolute inset-0" aria-hidden="true">
		<img src="/windmill-bg_opt.svg" alt="Windmill Background" class="h-full w-full object-fill" />
	</div>

	<div class="relative mx-auto h-[85%] md:w-[552px] lg:w-[650px]">
		<!-- Foreground -->
		<img
			class="absolute bottom-0 left-1/2 hidden w-full -translate-x-1/2 md:block"
			src="/windmill-fg_opt.svg"
			alt="Windmill Foreground"
		/>

		<!-- Logo -->
		<div
			class="absolute bottom-[209px] left-[193px] hidden aspect-square w-[166px] md:block lg:bottom-[244px] lg:left-[226px] lg:w-[198px]"
		>
			<div class="absolute inset-1 rounded-full bg-white"></div>
			<img class="relative w-full" alt="ZEN-garden Logo" src="/zen_garden_700x700.png" />
		</div>

		<!-- Blades -->
		<div class="hidden md:block">
			{#each blades as blade, idx (idx)}
				{#if blade.href}
					<a
						href={resolve(blade.href)}
						class={[
							'absolute z-1 h-[106px] w-56 lg:h-[125px] lg:w-[264px]',
							'flex items-center justify-center',
							'text-center text-2xl font-bold shadow-lg/30',
							'rounded-xl px-4',
							'bottom-(--sm-bottom) left-(--sm-left) lg:bottom-(--lg-bottom) lg:left-(--lg-left)',
							'bg-(--bg) transition-colors duration-200 hover:bg-(--hover-bg) focus:bg-(--hover-bg)',
							blade.classes
						]}
						style:--sm-bottom={`${blade.bottom}px`}
						style:--sm-left={`${blade.left}px`}
						style:--lg-bottom={`${blade.bottom * LG_SCALE_UP}px`}
						style:--lg-left={`${blade.left * LG_SCALE_UP}px`}
						style:--bg={blade.bg}
						style:--hover-bg={blade.hoverBg!}
					>
						{blade.name}
					</a>
				{:else}
					<div
						class={[
							'absolute z-1 h-[106px] w-56 lg:h-[125px] lg:w-[264px]',
							'flex items-center justify-center',
							'text-center text-2xl font-bold shadow-lg/30',
							'rounded-xl px-4',
							'bottom-(--sm-bottom) left-(--sm-left) lg:bottom-(--lg-bottom) lg:left-(--lg-left)',
							'bg-(--bg)',
							blade.classes
						]}
						style:--sm-bottom={`${blade.bottom}px`}
						style:--sm-left={`${blade.left}px`}
						style:--lg-bottom={`${blade.bottom * LG_SCALE_UP}px`}
						style:--lg-left={`${blade.left * LG_SCALE_UP}px`}
						style:--bg={blade.bg}
					>
						{blade.name}
					</div>
					{#each blade.subpages as page, idx (idx)}
						<a
							class={[
								'absolute py-1.5 font-semibold transition-colors duration-200 lg:text-lg',
								blade.subpagesLeft === false
									? 'rounded-r-lg pr-6 pl-12'
									: 'rounded-l-lg pr-12 pl-6',
								'bottom-(--sm-bottom) left-(--sm-left) lg:bottom-(--lg-bottom) lg:left-(--lg-left)',
								'bg-white hover:bg-(--hover-bg) focus:bg-(--hover-bg)'
							]}
							href={resolve('/explorer/transition/capacity')}
							style:--sm-bottom={`${page.bottom}px`}
							style:--sm-left={`${page.left}px`}
							style:--lg-bottom={`${page.bottom * LG_SCALE_UP}px`}
							style:--lg-left={`${page.left * LG_SCALE_UP + 6}px`}
							style:--hover-bg={blade.hoverBg}
						>
							{page.name}
						</a>
					{/each}
				{/if}
			{/each}
		</div>

		<div class="container mx-auto grid px-4 py-6 md:hidden">
			{#each blades as blade, idx (idx)}
				{#if blade.href}
					<a
						href={resolve(blade.href)}
						class={[
							'flex items-center justify-center',
							'text-center text-2xl font-bold shadow-lg/30',
							'mb-8 rounded-lg px-4 py-8',
							'bg-(--bg) hover:bg-(--hover-bg) focus:bg-(--hover-bg)'
						]}
						style:--bg={blade.bg}
						style:--hover-bg={blade.hoverBg!}
					>
						{blade.name}
						<i class="bi bi-arrow-right ps-2"></i>
					</a>
				{:else}
					<div
						class={[
							'flex items-center justify-center',
							'text-center text-2xl font-bold shadow-lg/30',
							'mb-4 rounded-lg px-4 py-8',
							'bg-(--bg)'
						]}
						style:--bg={blade.bg}
					>
						{blade.name}
					</div>
					<div class="mb-8 flex flex-col gap-x-4 gap-y-2 sm:grid-cols-2">
						{#each blade.subpages as page, idx (idx)}
							<a
								class={[
									'font-semibold transition-colors duration-200 lg:text-lg',
									'rounded-lg px-4 py-1.5 shadow-lg',
									'mr-(--mr) ml-(--ml) bg-white hover:bg-(--hover-bg) focus:bg-(--hover-bg)'
								]}
								href={resolve('/explorer/transition/capacity')}
								style:--hover-bg={blade.hoverBg}
								style:--ml={`${idx * 1.5}rem`}
								style:--mr={`${(blade.subpages!.length - idx - 1) * 1.5}rem`}
							>
								{page.name}
								<i class="bi bi-arrow-right ps-1"></i>
							</a>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
