<div class="grid grow place-content-center dark:bg-gray-800">
	<main
		class="relative mx-auto grid w-full max-w-300 gap-6 px-4 py-8 md:grid-cols-2 md:grid-rows-2"
	>
		<!-- Transition -->
		<section
			aria-label="The Transition Pathway"
			class="grid min-h-60 grid-cols-4 overflow-hidden rounded-tl-lg border border-gray-400 bg-[#6e7e2c] dark:border-gray-800"
		>
			<h2
				class="order-1 col-span-2 my-auto text-center text-3xl font-extrabold tracking-tight text-white"
			>
				The Transition Pathway
			</h2>
			<nav
				aria-label="Transition links"
				class="order-0 grid h-full grid-rows-4 bg-white/60 text-xl dark:bg-gray-800/40"
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
			class="grid min-h-60 grid-cols-4 overflow-hidden rounded-tr-lg border border-gray-400 bg-[#387e70] dark:border-gray-800"
		>
			<h2
				class="col-span-2 col-start-2 my-auto text-center text-3xl font-extrabold tracking-tight text-white"
			>
				The Energy Balance
			</h2>
			<nav
				aria-label="Energy balance links"
				class="grid h-full grid-rows-2 bg-white/60 text-xl dark:bg-gray-800/40"
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
			class="group relative grid min-h-60 place-content-center overflow-hidden rounded-bl-lg border border-gray-400 bg-[#4270a8] p-4 dark:border-gray-800"
		>
			<h2 class="text-3xl font-extrabold text-white">The Energy System</h2>
			<a
				class="absolute inset-0 focus:ring-4 focus:ring-white/80 focus:ring-offset-2 focus:outline-none dark:focus:ring-gray-700/80"
				href="/explorer/energy_system"
				aria-label="The Energy System"
			></a>
		</section>

		<!-- Map -->
		<section
			class="group relative grid min-h-60 place-content-center overflow-hidden rounded-br-lg border border-gray-400 bg-[#ae995e] p-4 dark:border-gray-800"
		>
			<h2 class="text-3xl font-extrabold text-white">The Map</h2>
			<a
				class="absolute inset-0 focus:ring-4 focus:ring-white/80 focus:ring-offset-2 focus:outline-none dark:focus:ring-gray-700/80"
				href="/explorer/map"
				aria-label="The Map"
			></a>
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
	</main>
</div>
