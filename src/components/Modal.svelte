<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    const dispatch = createEventDispatcher();

    export let isOpen: boolean = false;
    export let header: string | undefined = undefined;
    export let toggle: ((e: Event) => void) | undefined = undefined;

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
    function browserEvent(target: EventTarget, event: string, handler: EventListenerOrEventListenerObject): () => void {
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
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div tabindex="-1">
        {#if isOpen}
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <div
                in:modalIn|global
                out:modalOut|global
                aria-labelledby="modal-1"
                class="modal fade"
                role="dialog"
                on:introstart={() => dispatch('opening')}
                on:introend={onModalOpened}
                on:outrostart={onModalClosing}
                on:outroend={onModalClosed}
                on:click={handleBackdropClick}
                on:mousedown={handleBackdropMouseDown}
            >
                <slot name="external" />
                <div class="modal-dialog" role="document" bind:this={_dialog}>
                    <div class="modal-content">
                        <div class="modal-header" id="modal-1">
                            <h5 class="modal-title">{header}</h5>
                            <button type="button" on:click={toggle} class="btn-close" aria-label="Close" />
                        </div>
                        <div class="modal-body">
                            <slot />
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

{#if isOpen}
<div role="presentation" class="modal-backdrop fade" in:backdropIn out:backdropOut on:click />
{/if}

<style>
    :global(.modal-open) {
        overflow: hidden;
        padding-right: 0;
    }
</style>
