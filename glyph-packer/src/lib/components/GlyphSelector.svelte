<script lang="ts">
	import Glyph from './Glyph.svelte';

    const { glyphs, onGlyphHover, onGlyphLeave, onGlyphDragStart } = $props<{
		glyphs: [string, number[][]][];
		onGlyphHover: (newHoveredGlyph: number[][]) => void;
		onGlyphLeave: () => void;
		onGlyphDragStart: (glyph: number[][], event: PointerEvent) => void;
	}>();
</script>


<div class="glyphs">
    {#each glyphs as [glyphName, glyphTexture] }
	<div
		class="glyph-item"
		onpointerenter={() => onGlyphHover(glyphTexture)}
		onpointerleave={() => onGlyphLeave()}
		onpointerdown={(e) => onGlyphDragStart(glyphTexture, e)}

		role="grid"
		tabindex="0"
	>
		<Glyph grid={[...glyphTexture]} />
		<!-- <span>{glyphName}</span> -->
	</div>
    {/each}
</div>


<style>
    .glyphs {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		overflow: auto;
		gap: calc(var(--cell-size) / 3);
		padding: calc(var(--cell-size) / 4);
		border: calc(var(--cell-size) / 8) solid var(--color-bg-1);
		background-color: rgb(from var(--color-bg-2) r g b / 0.1);
	}

	.glyph-item {
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: grab;
	}
	.glyph-item:hover {
		outline: 2px solid var(--color-selection);
		background-color: rgb(from var(--color-theme-1) r g b / 0.1);
	}
</style>