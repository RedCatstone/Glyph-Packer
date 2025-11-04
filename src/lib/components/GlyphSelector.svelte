<script lang="ts">
	import type { GlyphData } from './Gameboard.svelte';
	import Glyph, { type HighlightArea } from './Glyph.svelte';

    const { glyphs, glyphPositions, showNames=false, noShrink=false, onGlyphHover, onGlyphLeave, onGlyphDragStart } = $props<{
		glyphs: GlyphData[],
		glyphPositions?: HighlightArea[][],
		showNames?: boolean,
		noShrink?: boolean,
		onGlyphHover?: (i: number) => void,
		onGlyphLeave?: () => void,
		onGlyphDragStart?: (glyph: GlyphData, event: PointerEvent) => void,
	}>();
</script>


<div style={noShrink ? "" : "overflow: auto"}>
	<!-- glyphs itself -->
	<div class="glyphs">
	    {#each glyphs as glyphData, i }
		<div
			class="glyph-item"
			class:done={glyphPositions?.[i]?.length > 0}
			onpointerenter={() => { if (onGlyphHover) onGlyphHover(i) }}
			onpointerleave={() => { if (onGlyphLeave) onGlyphLeave() }}
			onpointerdown={(e) => { if (onGlyphDragStart) onGlyphDragStart(glyphData, e) }}
			style={glyphData.color ? `--cell-color: ${glyphData.color}` : ""}
			role="grid"
			tabindex="0"
		>
			<!-- display the glyph. (only shows the 1st one) -->
			<Glyph grid={[...glyphData.glyphs[0]]} />
			{#if showNames}
				<span>{glyphData.name}</span>
			{/if}
		</div>
	    {/each}
	</div>
</div>


<style>
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