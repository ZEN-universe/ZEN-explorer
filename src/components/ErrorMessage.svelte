<script lang="ts">
	interface Props {
		message: string;
	}
	let { message }: Props = $props();
</script>

<div class="flex flex-col items-center mt-8 md:mt-30" role="status">
	<svg class="h-40 w-40" viewBox="-1.5 -0.8 12.0 10.6">
		<path d="m3.28 10.671 0.51941-5.696 0.85573 5.7374z" class="fill-gray-500 dark:fill-gray-400" />
		<circle cx="3.78" cy="4.215" r="0.42995" class="fill-gray-500 dark:fill-gray-400" />
		<g class="fill-none stroke-gray-500 dark:stroke-gray-400" stroke-width="0.5">
			<path d="M3.11 4.7 0.5 6.9" />
			<path d="M3.78 3.438 4.4 2.0" />
			<path d="M5.0 10.2 6.5 10.2" />
			<path d="M4.52 4.718 6.3 5.7" />
			<path d="M6.3 5.9 6.3 7.3" />
		</g>
	</svg>
	<div class="text-gray-500 dark:text-gray-400 text-3xl mt-8">
		{message}
	</div>
</div>
