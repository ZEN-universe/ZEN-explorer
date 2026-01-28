<script lang="ts">
	interface Props {
		message: string;
	}
	let { message }: Props = $props();
</script>

<div class="mt-8 flex flex-col items-center md:mt-30" role="status">
	<svg class="h-40 w-40" viewBox="-1.5 -0.8 12.0 10.6">
		<path d="M3.28,10.671 3.79941,4.975 4.318,10.671 Z" class="fill-gray-500 dark:fill-gray-400" />
		<circle cx="3.78" cy="4.215" r="0.42995" class="fill-gray-500 dark:fill-gray-400" />
		<g class="fill-none stroke-gray-500 dark:stroke-gray-400" stroke-width="0.5">
			<path d="M3.11 4.7 0.5 6.9" />
			<path d="M3.826875,3.438 4.446875,2" />
			<path d="M5.0 10.2 6.5 10.2" />
			<path d="M4.52 4.718 6.3 5.7" />
			<path d="m6.3703124,5.7984375 v 1.4" />
		</g>
	</svg>
	<div class="mt-8 text-3xl text-gray-500 dark:text-gray-400">
		{message}
	</div>
</div>
