<script lang="ts">
	interface Props {
		message: string;
	}
	let { message }: Props = $props();
</script>

<div class="mt-8 flex flex-col items-center md:mt-30" role="status">
	<svg class="h-40 w-40" viewBox="-1.5 -0.8 12.0 10.6">
		<path d="m3.28 10.671 0.51941-5.696 0.85573 5.7374z" class="fill-gray-500 dark:fill-gray-400" />
		<circle cx="3.78" cy="4.215" r="0.42995" class="fill-gray-500 dark:fill-gray-400" />
		<g class="fill-none stroke-gray-500 dark:stroke-gray-400" stroke-width="0.5">
			<path d="m3.11 4.7-2.9772 1.7189" />
			<path d="m4.52 6.918 2.9772 1.7189" />
			<path d="m3.78 3.438v-3.4378" />
		</g>
		<g class="fill-none stroke-gray-500 dark:stroke-gray-400" stroke-width="0.2">
			<path d="m8.0 9.8 0 -7" />
			<path d="m8.7 9.8 0 -7" />
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
			<path d="m4.7 2.7 4.9 0" />
			<path d="m5.4 2.0 4.2 0" />
			<path d="m4.7 2.7 0.7 -0.7" />
			<path d="m5.4 2.0 0.7 0.7" />
			<path d="m6.1 2.7 0.7 -0.7" />
			<path d="m6.8 2.0 0.7 0.7" />
			<path d="m7.5 2.7 0.7 -0.7" />
			<path d="m8.2 2.0 0.7 0.7" />
			<path d="m8.9 2.7 0.7 -0.7" />
			<path d="m9.6 2.0 0 0.7" />
			<path d="m6.0 2.7 0 5.2" />
		</g>
	</svg>
	<div class="mt-8 text-3xl text-gray-500 dark:text-gray-400">
		{message}
	</div>
</div>
