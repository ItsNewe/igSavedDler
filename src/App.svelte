<script lang="ts">
	import "./Login.svelte";
import Login from "./Login.svelte";

	export let name: string;
</script>

<main>
	<h1>Hello {name}!</h1>
	<button>Get started</button>
	<Login></Login>
</main>
<style>
</style>