<script lang="ts">
	import logo from '$lib/assets/zen_garden_small.png';
</script>

<div class="grid grow">
	<div
		class="grid md:grid-cols-2 md:grid-rows-2 gap-8 w-full max-w-300 mx-auto py-20 relative px-4"
	>
		<div
			class="bg-[#6e7e2c] border border-gray-600 dark:border-gray-800 min-h-60 relative grid place-content-center group p-4"
		>
			<div class="font-bold text-3xl">The Transition Pathway</div>
			<div
				class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/60 dark:bg-gray-800/60 grid grid-cols-2 grid-rows-2 text-xl"
			>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<div>Capacity</div>
					<a class="absolute inset-0" href="./transition/capacity/" aria-label="Capacity"></a>
				</div>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<div>Production</div>
					<a class="absolute inset-0" href="./transition/production/" aria-label="Production"></a>
				</div>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<div>Emissions</div>
					<a class="absolute inset-0" href="./transition/emissions/" aria-label="Emissions"></a>
				</div>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<div>Costs</div>
					<a class="absolute inset-0" href="./transition/costs/" aria-label="Costs"></a>
				</div>
			</div>
		</div>
		<div
			class="bg-[#387e70] border border-gray-600 dark:border-gray-800 min-h-60 relative grid place-content-center group p-4"
		>
			<div class="font-bold text-3xl">The Transition Pathway</div>
			<div
				class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/60 dark:bg-gray-800/60 grid grid-cols-2 text-xl"
			>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<div>Nodal</div>
					<a class="absolute inset-0" href="./energy_balance/nodal/" aria-label="Nodal"></a>
				</div>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<div>Storage</div>
					<a class="absolute inset-0" href="./energy_balance/storage/" aria-label="Storage"></a>
				</div>
			</div>
		</div>
		<div
			class="bg-[#4270a8] border border-gray-600 dark:border-gray-800 min-h-60 relative grid place-content-center group p-4"
		>
			<div class="font-bold text-3xl">The Energy System</div>
			<a
				class="absolute inset-0 hover:bg-white/50 dark:hover:bg-gray-800/50"
				href="/energy_system"
				aria-label="The Energy System"
			></a>
		</div>
		<div
			class="bg-[#ae995e] border border-gray-600 dark:border-gray-800 min-h-60 relative grid place-content-center group p-4"
		>
			<div class="font-bold text-3xl">The Map</div>
			<a
				class="absolute inset-0 hover:bg-white/50 dark:hover:bg-gray-800/50"
				href="/map"
				aria-label="The Map"
			></a>
		</div>
		<div class="absolute inset-0 hidden lg:grid place-content-center pointer-events-none">
			<div class="relative">
				<div class="absolute inset-1 rounded-full bg-white z-0"></div>
				<img class="relative z-1" width="270" height="270" alt="The project logo" src={logo} />
			</div>
		</div>
	</div>
</div>
