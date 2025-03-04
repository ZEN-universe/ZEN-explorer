<script lang="ts">
	import { createBubbler } from 'svelte/legacy';

	const bubble = createBubbler();
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	interface Props {
		isOpen?: boolean;
		header?: string | undefined;
		toggle?: ((e: Event) => void) | undefined;
		external?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let {
		isOpen = false,
		header = undefined,
		toggle = undefined,
		external,
		children
	}: Props = $props();

	let hasOpened = false;
	let _isMounted = false;
	let _dialog: HTMLElement;
	let _mouseDownElement: HTMLElement;
	let _removeEscListener: () => void | undefined;

	let ref: HTMLElement;
	let portal;

	const duration = 300;

	onMount(() => {
		portal = document.createElement('div');
		document.body.appendChild(portal);
		portal.appendChild(ref);

		if (isOpen) {
			hasOpened = true;
		}
		_isMounted = true;
	});

	// Event handlers
	function browserEvent(
		target: EventTarget,
		event: string,
		handler: EventListenerOrEventListenerObject
	): () => void {
		target.addEventListener(event, handler);
		return () => target.removeEventListener(event, handler);
	}

	function onModalOpened() {
		dispatch('open');
		_removeEscListener = browserEvent(document, 'keydown', (event) => {
			if (event instanceof KeyboardEvent && event.key && event.key === 'Escape') {
				if (toggle) {
					if (_removeEscListener) _removeEscListener();
					toggle(event);
				}
			}
		});
	}

	function onModalClosing() {
		dispatch('closing');
		if (_removeEscListener) {
			_removeEscListener();
		}
	}

	function onModalClosed() {
		dispatch('close');
		if (_isMounted) {
			hasOpened = false;
		}
		_isMounted = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === _mouseDownElement) {
			if (!isOpen) {
				return;
			}

			const backdropElem = _dialog ? _dialog.parentNode : null;
			if (backdropElem && e.target === backdropElem && toggle) {
				e.stopPropagation();
				toggle(e);
			}
		}
	}

	function handleBackdropMouseDown(e: MouseEvent) {
		_mouseDownElement = e.target as HTMLElement;
	}

	// Transitions
	function backdropIn(node: HTMLElement) {
		node.style.display = 'block';
		return {
			duration,
			tick: (t: number) => {
				if (t === 0) {
					node.classList.add('show');
				}
			}
		};
	}

	function backdropOut(node: HTMLElement) {
		node.classList.remove('show');
		return {
			duration,
			tick: (t: number) => {
				if (t === 0) {
					node.style.display = 'none';
				}
			}
		};
	}

	function modalIn(node: HTMLElement) {
		node.style.display = 'block';
		return {
			duration,
			tick: (t: number) => {
				if (t > 0) {
					node.classList.add('show');
				}
			}
		};
	}

	function modalOut(node: HTMLElement) {
		node.classList.remove('show');
		return {
			duration,
			tick: (t: number) => {
				if (t === 1) {
					node.style.display = 'none';
				}
			}
		};
	}
</script>

<div bind:this={ref}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div tabindex="-1">
		{#if isOpen}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				in:modalIn|global
				out:modalOut|global
				aria-labelledby="modal-1"
				class="modal fade"
				role="dialog"
				onintrostart={() => dispatch('opening')}
				onintroend={onModalOpened}
				onoutrostart={onModalClosing}
				onoutroend={onModalClosed}
				onclick={handleBackdropClick}
				onmousedown={handleBackdropMouseDown}
			>
				{@render external?.()}
				<div class="modal-dialog" role="document" bind:this={_dialog}>
					<div class="modal-content">
						<div class="modal-header" id="modal-1">
							<h5 class="modal-title">{header}</h5>
							<button type="button" onclick={toggle} class="btn-close" aria-label="Close"></button>
						</div>
						<div class="modal-body">
							{@render children?.()}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if isOpen}
	<div
		role="presentation"
		class="modal-backdrop fade"
		in:backdropIn
		out:backdropOut
		onclick={bubble('click')}
	></div>
{/if}

<style>
	:global(.modal-open) {
		overflow: hidden;
		padding-right: 0;
	}
</style>
