<script lang="ts">
	import type { GlyphData } from './Gameboard.svelte';
	import Glyph from './Glyph.svelte';

    const { glyphs, glyphPositions, showNames, onGlyphHover, onGlyphLeave, onGlyphDragStart } = $props<{
		glyphs: GlyphData[];
		glyphPositions?: { [key: string]: [number, number][] },
		showNames?: boolean;
		onGlyphHover?: (hoveredGlyph: GlyphData) => void;
		onGlyphLeave?: () => void;
		onGlyphDragStart?: (glyph: GlyphData, event: PointerEvent) => void;
	}>();

	let sort = $state(false);

	const glyphsToShow = $derived(sort
		? glyphs.toSorted((a: GlyphData, b: GlyphData) => Number(glyphPositions?.[a.name]?.length > 0) - Number(glyphPositions?.[b.name]?.length > 0))
		: glyphs);
</script>


<div class="glyphs-container">
	{#if glyphPositions}
		<button class:active={sort} onclick={() => sort = !sort}>Sort Finished</button>
	{/if}
	<div class="glyphs">
	    {#each glyphsToShow as glyphData }
		<div
			class="glyph-item"
			class:done={glyphPositions?.[glyphData.name]?.length > 0}
			onpointerenter={() => { if (onGlyphHover) onGlyphHover(glyphData) }}
			onpointerleave={() => { if (onGlyphLeave) onGlyphLeave() }}
			onpointerdown={(e) => { if (onGlyphDragStart) onGlyphDragStart(glyphData, e) }}
			style={glyphData.color ? `--cell-color: ${glyphData.color}` : ""}
			role="grid"
			tabindex="0"
		>
			<Glyph grid={[...glyphData.glyph]} />
			{#if showNames}
				<span>{glyphData.name}</span>
			{/if}
		</div>
	    {/each}
	</div>
</div>


<style>
	.glyphs-container {
		overflow: auto;
	}

    .glyphs {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: calc(var(--cell-size) / 3);
		padding: calc(var(--cell-size) / 4);
		border: calc(var(--cell-size) / 8) solid var(--color-bg-1);
		background-color: rgb(from var(--color-bg-2) r g b / 0.1);
	}

	.glyph-item {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		cursor: grab;
	}
	.glyph-item:hover {
		outline: 2px solid var(--color-selection);
		background-color: rgb(from var(--color-theme-1) r g b / 0.1);
	}
	.glyph-item.done {
		opacity: 0.6;
		filter: grayscale(70%);
	}
</style>