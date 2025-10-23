<script lang="ts">
	import GlyphSelector from '../lib/components/GlyphSelector.svelte';
	import { glyphsLib } from '$lib/glyphLib'
	import Gameboard, { type DragState, type GlyphData } from '$lib/components/Gameboard.svelte';
	

	const currGlyphs = $state(glyphsLib.numbers);
	const glyphDatas: GlyphData[] = $state(Object.entries(currGlyphs.glyphs)
		.map(x =>
			({ glyph: x[1], name: x[0], positions: [] })
		));

	const patternHeight = glyphDatas[0]?.glyph?.length;
	const patternWidth = glyphDatas[0]?.glyph?.[0]?.length;
	let gamegrid = $state(Array.from({ length: patternHeight + 2 }, () => Array(patternWidth + 2).fill(0)));

	let hoveredGlyph = $state<GlyphData | null>(null);



	// --- THE CORE DRAG STATE ---
	let dragState = $state<DragState>(
		{ glyph: null, x: 0, y: 0 }
	);

	function handleGlyphDragStart(glyph: number[][], event: PointerEvent) {
		dragState.glyph = glyph;
		dragState.x = event.clientX;
		dragState.y = event.clientY;
		event.preventDefault();
	}



	let cellSize = $state(20);
	function zoomIn() {
		cellSize += 2;
		cellSize = Math.min(cellSize, 60);
	}
	function zoomOut() {
		cellSize -= 2;
		cellSize = Math.max(cellSize, 4);
	}
</script>

<div class="game" style="--cell-size: {cellSize}px">
	<div class="controls">
		Zoom
		<button onclick={zoomOut}>-</button>
		<button onclick={zoomIn}>+</button>
	</div>

	<div class="play-area">
		<GlyphSelector
			glyphs={glyphDatas}
			onGlyphHover={(x) => hoveredGlyph = x}
			onGlyphLeave={() => hoveredGlyph = null}
			onGlyphDragStart={handleGlyphDragStart}
		/>
		<Gameboard bind:grid={gamegrid} {cellSize} {hoveredGlyph} bind:dragState={dragState} {glyphDatas}/>
	</div>
</div>

<style>
	.game {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
		max-height: 80vh;
	}

	.play-area {
		display: flex;
		flex-direction: row;
		gap: 2rem;
		min-height: 0;
		overflow: auto;
		padding: 15px;
	}
</style>
