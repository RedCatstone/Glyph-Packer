<script lang="ts">
	import GlyphSelector from '../lib/components/GlyphSelector.svelte';
	import { glyphsLib } from '$lib/glyphLib'
	import Gameboard, { type DragState, type GlyphData } from '$lib/components/Gameboard.svelte';
	
	const glyphPacks: GlyphData[] = $derived(
		Object.entries(glyphsLib)
			.map(([name, packData]) => ({
				glyph: packData.glyphs[packData.thumbnail],
				name,
				color: packData.color,
			}))
	);
	let currGlyphPackName = $state("Numbers");
	const currPack = $derived(glyphsLib[currGlyphPackName]);
	const glyphDatas: GlyphData[] = $derived(
		Object.entries(currPack.glyphs).map(([name, glyph]) => ({ glyph, name }))
	);	
	
	const maxPatternHeight = $derived(Math.max(...glyphDatas.map(x => x.glyph.length)));
	const maxPatternWidth = $derived(Math.max(...glyphDatas.map(x => x.glyph[0].length)));
	
	let hoveredGlyph = $state<GlyphData | null>(null);
	let glyphPositions = $state<{ [key: string]: [number, number][] }>({});



	// --- THE CORE DRAG STATE ---
	let dragState = $state<DragState>(
		{ glyph: null, x: 0, y: 0 }
	);

	function handleGlyphDragStart(glyphData: GlyphData, event: PointerEvent) {
		dragState.glyph = glyphData.glyph;
		dragState.x = event.clientX;
		dragState.y = event.clientY;
		event.preventDefault();
	}


	let cellSize = $state(25);
</script>

<div class="game" style="--cell-size: {cellSize}px; --cell-color: {currPack.color}">
	<!-- <div class="controls">
		Zoom
		<button onclick={() => cellSize = Math.max(cellSize - 2, 4)}>-</button>
		<button onclick={() => cellSize = Math.min(cellSize + 2, 60)}>+</button>
	</div> -->

	<div class="glyph-selection-stuff">
		<GlyphSelector
			glyphs={glyphPacks}
			showNames={true}
			onGlyphDragStart={(glyph, event) => currGlyphPackName = glyph.name}
		/>

		<GlyphSelector
			glyphs={glyphDatas}
			{glyphPositions}
			onGlyphHover={(x) => hoveredGlyph = x}
			onGlyphLeave={() => hoveredGlyph = null}
			onGlyphDragStart={handleGlyphDragStart}
		/>
	</div>
	<div class="gameboard">
		<Gameboard {maxPatternHeight} {maxPatternWidth} {cellSize} {hoveredGlyph} bind:glyphPositions={glyphPositions} bind:dragState={dragState} {glyphDatas}/>
	</div>
</div>

<style>
	.game {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		flex: 0.6;
		gap: 30px;
		max-height: 80vh;
	}

	.glyph-selection-stuff {
		display: flex;
		flex-direction: column;
		gap: 30px;
	}

	.gameboard {
		height: 80vh;
	}
</style>
