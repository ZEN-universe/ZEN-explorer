<script lang="ts">
	interface Props {
		message: string;
	}
	let { message }: Props = $props();
</script>

<div class="flex flex-col items-center mt-8 md:mt-30" role="status">
	<svg class="h-40 w-40" viewBox="-1.5 -0.8 12.0 10.6">
		<path d="M3.28,10.671 3.79941,4.975 4.318,10.671 Z" class="fill-gray-500 dark:fill-gray-400" />
		<circle cx="3.78" cy="4.215" r="0.42995" class="fill-gray-500 dark:fill-gray-400" />
		<g class="fill-none stroke-gray-500 dark:stroke-gray-400" stroke-width="0.5">
			<path d="m3.11 4.7-2.9772 1.7189" />
			<path d="m4.52 6.918 2.9772 1.7189" />
			<path d="m3.78 3.438v-3.4378" />
		</g>
		<path class="fill-gray-500 dark:fill-gray-400" d="M 5.4003906,1.8867187 4.44,2.8124997 9.7128906,2.812 V 1.887 c -1.437499,-6.692e-4 -2.8750003,-2.813e-4 -4.3125,-2.813e-4 z m 0.046875,0.2265626 H 9.4863281 V 2.5859375 H 4.9726562 Z" />
		<g class="fill-none stroke-gray-500 dark:stroke-gray-400" stroke-width="0.2">
			<path d="M8,9.9 V 2.7" />
			<path d="M8.7,9.9 V 2.7" />
			<path d="m8.0 9.8 0.7 0" />
			<path d="m8.0 9.8 0.7 -0.7" />
			<path d="m8.7 9.1 -0.7 -0.7" />
			<path d="m8.0 8.4 0.7 -0.7" />
			<path d="m8.7 7.7 -0.7 -0.7" />
			<path d="m8.0 7.0 0.7 -0.7" />
			<path d="m8.7 6.3 -0.7 -0.7" />
			<path d="m8.0 5.6 0.7 -0.7" />
			<path d="m8.7 4.9 -0.7 -0.7" />
			<path d="m8.0 4.2 0.7 -0.7" />
			<path d="m8.7 3.5 -0.7 -0.7" />
			<path d="m5.4 2.0 0.7 0.7" />
			<path d="m6.1 2.7 0.7 -0.7" />
			<path d="m6.8 2.0 0.7 0.7" />
			<path d="m7.5 2.7 0.7 -0.7" />
			<path d="m8.2 2.0 0.7 0.7" />
			<path d="m8.9 2.7 0.7 -0.7" />
			<path d="M 6.3535526,5.7714951 4.7001773,6.789784 M 6.3286408,5.7355339 7.5259047,8.4620005 M 6.31,2.7136504 6.3210485,5.7702329" />
		</g>
	</svg>
	<div class="text-gray-500 dark:text-gray-400 text-3xl mt-8">
		{message}
	</div>
</div>
