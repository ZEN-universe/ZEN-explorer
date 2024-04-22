<script lang="ts">
    import { base } from "$app/paths";
    import { page } from "$app/stores";

    let transition_urls = {
        Capacity: base + "/transition/capacity",
        Production: base + "/transition/production",
        Emissions: base + "/transition/emissions",
        Costs: base + "/transition/costs"
    };
</script>

<nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="container-fluid">
        <a class="navbar-brand" href="{base}/">ZEN</a>
        <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
        >
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <li class="nav-item dropdown">
                    <a
                        class="nav-link dropdown-toggle"
                        href="#"
                        role="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        The Transition Pathway
                    </a>
                    <ul class="dropdown-menu">
                        {#each Object.entries(transition_urls) as [title, url]}
                            <li>
                                <a
                                    class="dropdown-item {$page.url.pathname ==
                                    url
                                        ? 'active'
                                        : ''}"
                                    href={url}>{title}</a
                                >
                            </li>
                        {/each}
                    </ul>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="{base}/">The Energy Balance</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="{base}/">The Energy System</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="{base}/">The Map</a>
                </li>
            </ul>
        </div>
    </div>
</nav>
<slot />
