<script lang="ts">
    import { base } from "$app/paths";
    import { page } from "$app/stores";

    let urls = {
        Capacity: base + "/transition/capacity",
        Production: base + "/transition/production",
    };
</script>
<div class="row">
    <div class="col">
        <h1>The Transition Pathway</h1>
    </div>
</div>
<slot />
