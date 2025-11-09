<script lang="ts">
	import type { Snippet } from "svelte";

	const { children, label = 'Toggle Content', startOpen = true }: {
        children: Snippet,
		label?: string,
		startOpen?: boolean,
	} = $props();

	let isOpen = $state(startOpen);
</script>


<div class="collapsible-container" class:open={isOpen}>
	<button class="collapsible-toggle" onclick={() => (isOpen = !isOpen)} aria-expanded={isOpen}>
		<svg
			class="collapsible-arrow"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
		>
			<path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" />
		</svg>
		<span class="collapsible-label">{label}</span>
	</button>

	<!-- The content area that will be shown or hidden -->
	<div class="collapsible-content">
        {@render children()}
	</div>
</div>

<style>
	.collapsible-container {
		display: grid;
		grid-template-rows: auto 0fr;
		/* transition: grid-template-rows 0.3s ease-in-out; */
		background-color: var(--color-bg-1);
		border: 1px solid var(--color-bg-2);
		border-radius: 8px;
	}

	.collapsible-container.open {
		grid-template-rows: auto 1fr;
	}

	.collapsible-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: bold;
	}

	.collapsible-arrow {
		width: 20px;
		height: 20px;
		transition: transform 0.3s ease-in-out;
	}
	.collapsible-container.open .collapsible-arrow {
		transform: rotate(90deg);
	}

	.collapsible-content {
		overflow: hidden;
	}
</style>