<script lang="ts">
	import type { GlyphData } from './Gameboard.svelte';
	import Glyph from './Glyph.svelte';

    const { glyphs, onGlyphHover, onGlyphLeave, onGlyphDragStart } = $props<{
		glyphs: GlyphData[];
		onGlyphHover: (hoveredGlyph: GlyphData) => void;
		onGlyphLeave: () => void;
		onGlyphDragStart: (glyph: number[][], event: PointerEvent) => void;
	}>();
</script>

<div class="glyphs-container">
	<div class="glyphs">
	    {#each glyphs as glyphData }
		<div
			class="glyph-item"
			class:done={glyphData.positions.length > 0}
			onpointerenter={() => onGlyphHover(glyphData)}
			onpointerleave={() => onGlyphLeave()}
			onpointerdown={(e) => onGlyphDragStart(glyphData.glyph, e)}
	
			role="grid"
			tabindex="0"
		>
			<Glyph grid={[...glyphData.glyph]} />
			<!-- <span>{glyphName}</span> -->
		</div>
	    {/each}
	</div>
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

	.glyph-item.done {
		opacity: 0.6;
		filter: grayscale(70%);
	}
</style>