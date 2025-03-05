<script lang="ts">
	import { base } from '$app/paths';
	import logo from '$lib/assets/zen_garden_small.png';
	import close from '$lib/assets/x.svg';
	let logo_size = '70vh';
	let links_active = $state(false);
	let energy_links_active = $state(false);
</script>

<div class="d-flex justify-content-center">
	<div class="menu mt-5" style="width: {logo_size}; height: {logo_size}">
		<button class="quarter active quarter1" onclick={() => (links_active = !links_active)}>
			<p class="content">The Transition Pathway</p>
		</button>
		<button
			class="quarter active quarter2"
			onclick={() => (energy_links_active = !energy_links_active)}
		>
			<p class="content">The Energy Balance</p>
		</button>
		<div class="quarter quarter3">
			<p class="content">The Energy System</p>
		</div>
		<div class="quarter quarter4">
			<p class="content">The Map</p>
		</div>
		<div class="logo">
			<img alt="The project logo" src={logo} />
		</div>
		<div class="links" class:active={links_active}>
			<div class="sublink l1">
				<a href="./transition/capacity/" class="link-secondary">Capacity</a>
			</div>
			<div class="sublink l2">
				<a href="./transition/production/" class="link-secondary">Production</a>
			</div>
			<div class="sublink l3">
				<a href="./transition/emissions/" class="link-secondary">Emissions</a>
			</div>
			<div class="sublink l4">
				<a href="./transition/costs/" class="link-secondary">Costs</a>
			</div>
			<button
				onclick={() => (links_active = !links_active)}
				type="button"
				class="close"
				aria-label="Close"
			>
				<img alt="The project logo" src={close} />
			</button>
		</div>
		<div class="links" class:active={energy_links_active}>
			<div class="sublink l1">
				<a href="./energy_balance/nodal" class="link-secondary">Nodal Energy Balance</a>
			</div>
			<div class="sublink l2">
				<a href="./energy_balance/storage" class="link-secondary">Storage Energy Balance</a>
			</div>
			<button
				onclick={() => (energy_links_active = !energy_links_active)}
				type="button"
				class="close"
				aria-label="Close"
			>
				<img alt="The project logo" src={close} />
			</button>
		</div>
	</div>
</div>

<style>
	.menu {
		position: relative;
		margin: 0 auto;
		overflow: hidden;
		border-radius: 50%;
	}

	.quarter {
		position: absolute;
		width: 50%;
		height: 50%;
		transition: opacity 0.2s;
		cursor: pointer;
		border: solid 0.5px rgba(0, 0, 0, 0.5);
		font-weight: bold;
		font-size: 18px;
	}

	.quarter:hover.active {
		opacity: 0.5;
	}

	.content {
		text-align: center;
		width: 100%;
		transform-origin: center center;
		position: absolute;
		top: 50%;
		left: 50%;
	}
	.quarter1 {
		top: 0;
		left: 0;
		color: rgb(255, 0, 0);
		background-color: rgba(255, 0, 0, 0.5);
		border-radius: 100% 0 0 0;
	}

	.quarter1 .content {
		transform: translate(-50%, -50%) rotate(-45deg);
	}

	.quarter2 {
		top: 0;
		right: 0;
		color: rgb(0, 164, 0);
		background-color: rgba(0, 164, 0, 0.5);
		border-radius: 0 100% 0 0;
	}

	.quarter2 .content {
		transform: translate(-50%, -50%) rotate(45deg);
	}

	.quarter3 {
		cursor: default;
		bottom: 0;
		left: 0;
		color: rgba(0, 0, 255, 0.2);
		background-color: rgba(0, 0, 255, 0.1);
		border-radius: 0 0 0 100%;
	}

	.quarter3 .content {
		transform: translate(-50%, -50%) rotate(45deg);
	}

	.quarter4 {
		cursor: default;
		bottom: 0;
		right: 0;
		color: rgba(120, 120, 0, 0.2);
		background-color: rgba(120, 120, 0, 0.1);
		border-radius: 0 0 100% 0;
	}

	.quarter4 .content {
		transform: translate(-50%, -50%) rotate(-45deg);
	}

	.logo {
		position: absolute;
		width: 50%;
		height: 50%;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		background-color: white;
		border-radius: 50%;
	}

	img {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.links {
		font-size: 20px;
		display: block;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		transform-origin: center center;
		width: 0;
		height: 0;
		background-color: rgba(255, 255, 255, 0.95);
		transition: all 0.2s ease-out;
		border-radius: 50%;
		overflow: hidden;
	}

	.links.active {
		width: 100%;
		height: 100%;
	}

	.sublink {
		text-align: center;
		position: absolute;
		width: 50%;
		height: 50%;
	}

	.sublink a {
		position: absolute;
		top: 50%;
		left: 50%;
		transform-origin: center center;
	}

	.sublink.l1 {
		top: 0;
		left: 0;
	}

	.sublink.l1 a {
		transform: translate(-50%, -50%) rotate(-45deg);
	}

	.sublink.l2 {
		top: 0;
		right: 0;
	}
	.sublink.l2 a {
		transform: translate(-50%, -50%) rotate(45deg);
	}
	.sublink.l3 {
		bottom: 0;
		left: 0;
	}
	.sublink.l3 a {
		transform: translate(-50%, -50%) rotate(45deg);
	}
	.sublink.l4 {
		bottom: 0;
		right: 0;
	}

	.sublink.l4 a {
		transform: translate(-50%, -50%) rotate(-45deg);
	}

	.close {
		position: absolute;
		width: 10%;
		height: 10%;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		border: none;
		background-color: rgba(0, 0, 0, 0.1);
		transition: background-color 0.2s;
		font-size: 40px;
	}

	.close img {
		position: absolute;
		width: 70%;
		height: 70%;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	.close:hover {
		background-color: rgba(0, 0, 0, 0.2);
	}
</style>
