<div class="grid grow dark:bg-gray-800 place-content-center">
	<main
		class="grid md:grid-cols-2 md:grid-rows-2 relative w-full max-w-300 mx-auto py-8 px-4 gap-6"
	>
		<!-- Transition -->
		<section
			aria-label="The Transition Pathway"
			class="bg-[#6e7e2c] grid-cols-4 border border-gray-400 dark:border-gray-800 rounded-tl-lg min-h-60 grid overflow-hidden"
		>
			<h2
				class="font-extrabold text-3xl order-1 col-span-2 my-auto text-center text-white tracking-tight"
			>
				The Transition Pathway
			</h2>
			<nav
				aria-label="Transition links"
				class="order-0 grid grid-rows-4 h-full bg-white/60 dark:bg-gray-800/40 text-xl"
			>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<span class="font-medium">Capacity</span>
					<a class="absolute inset-0" href="./transition/capacity/" aria-label="Capacity"></a>
				</div>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<span class="font-medium">Production</span>
					<a class="absolute inset-0" href="./transition/production/" aria-label="Production"></a>
				</div>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<span class="font-medium">Emissions</span>
					<a class="absolute inset-0" href="./transition/emissions/" aria-label="Emissions"></a>
				</div>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<span class="font-medium">Costs</span>
					<a class="absolute inset-0" href="./transition/costs/" aria-label="Costs"></a>
				</div>
			</nav>
		</section>

		<!-- Energy Balance -->
		<section
			aria-label="The Energy Balance"
			class="bg-[#387e70] border border-gray-400 dark:border-gray-800 rounded-tr-lg min-h-60 grid grid-cols-4 overflow-hidden"
		>
			<h2
				class="font-extrabold text-3xl col-start-2 col-span-2 my-auto text-center text-white tracking-tight"
			>
				The Energy Balance
			</h2>
			<nav
				aria-label="Energy balance links"
				class="grid grid-rows-2 h-full bg-white/60 dark:bg-gray-800/40 text-xl"
			>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<span class="font-medium">Nodal</span>
					<a class="absolute inset-0" href="./energy_balance/nodal/" aria-label="Nodal"></a>
				</div>
				<div class="relative grid place-content-center hover:bg-white/50 dark:hover:bg-gray-800/50">
					<span class="font-medium">Storage</span>
					<a class="absolute inset-0" href="./energy_balance/storage/" aria-label="Storage"></a>
				</div>
			</nav>
		</section>

		<!-- Energy System -->
		<section
			class="bg-[#4270a8] border border-gray-400 dark:border-gray-800 rounded-bl-lg min-h-60 relative grid place-content-center group p-4 overflow-hidden"
		>
			<h2 class="font-extrabold text-3xl text-white">The Energy System</h2>
			<a
				class="absolute inset-0 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-white/80 dark:focus:ring-gray-700/80"
				href="/energy_system"
				aria-label="The Energy System"
			></a>
		</section>

		<!-- Map -->
		<section
			class="bg-[#ae995e] border border-gray-400 dark:border-gray-800 rounded-br-lg min-h-60 relative grid place-content-center group p-4 overflow-hidden"
		>
			<h2 class="font-extrabold text-3xl text-white">The Map</h2>
			<a
				class="absolute inset-0 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-white/80 dark:focus:ring-gray-700/80"
				href="/map"
				aria-label="The Map"
			></a>
		</section>

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
	</main>
</div>
