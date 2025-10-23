<script lang="ts">
	import Glyph, { type HighlightArea } from "./Glyph.svelte";
	export type DragState = { glyph: number[][] | null; x: number; y: number };
	export type GlyphData = { glyph: number[][]; name: String; positions: [number, number][] }

    let { grid=$bindable(), cellSize, hoveredGlyph, dragState=$bindable(), glyphDatas } = $props<{
		grid: number[][],
		cellSize: number,
		hoveredGlyph: GlyphData | null,
		dragState: DragState,
		glyphDatas: GlyphData[],
	}>();

	const gridHeight = $derived(grid.length);
	const gridWidth = $derived(grid[0].length);
	
	const initialGridHeight = grid.length;
	const initialGridWidth = grid[0].length;

	const highlightedAreas = $derived((() => {
		if (hoveredGlyph === null) return [];

		const hoveredGlyphHeight = hoveredGlyph.glyph.length;
		const hoveredGlyphWidth = hoveredGlyph.glyph[0].length;

		return hoveredGlyph.positions.map(([y1, x1]: [number, number]) => ({ y1, x1, y2: y1 + hoveredGlyphHeight, x2: x1 + hoveredGlyphWidth }))
	})());


	let gameboardHTML: HTMLElement | null = null;
	let dragGlyphHTML: HTMLElement | null = $state(null);


	function dragGlyphCalculations(clientX: number, clientY: number, release: boolean) {
		if (dragState.glyph === null || gameboardHTML === null || dragGlyphHTML === null) return;

		const dragGlyphHeight = dragState.glyph.length;
		const dragGlyphWidth = dragState.glyph[0].length;

		// translated to gameboard local coords
		const gameboardRect = gameboardHTML.getBoundingClientRect();
		let gridPxY = clientY - gameboardRect.top - (dragGlyphHeight/2) * cellSize;
		let gridPxX = clientX - gameboardRect.left - (dragGlyphWidth/2) * cellSize;
		
		// translated to gameboard grid coords (with snapping)
		let gridY = Math.floor((gridPxY + cellSize/2) / cellSize);
		let gridX = Math.floor((gridPxX + cellSize/2) / cellSize);

		const withinGrid = gridY + dragGlyphHeight > 0 && gridY < gridHeight
						&& gridX + dragGlyphWidth > 0 && gridX < gridWidth;

		if (!release) {
			if (withinGrid) {
				// translate back
				gridPxY = gridY * cellSize;
				gridPxX = gridX * cellSize;
			}
			dragState.y = gridPxY + gameboardRect.top + (dragGlyphHeight/2) * cellSize;
			dragState.x = gridPxX + gameboardRect.left + (dragGlyphWidth/2) * cellSize;
		}
		else {
			// the glyph was dropped.
			if (withinGrid) {
				// expand up/left
				while (gridY < 0) { gridAddRow(true); gridY++; }
				while (gridX < 0) { gridAddColumn(true); gridX++; }

				// expand down/right
				while (gridHeight < gridY + dragGlyphHeight) { gridAddRow(false); }
				while (gridWidth < gridX + dragGlyphWidth) { gridAddColumn(false); }

				for (let dy = 0; dy < dragGlyphHeight; dy++) {
					for (let dx = 0; dx < dragGlyphWidth; dx++) {
						grid[gridY + dy][gridX + dx] = dragState.glyph[dy][dx];
					}
				}
				updateGridPadding();
				updateAllGlyphPositions();
			}
			dragState.glyph = null;
		}
	}

	function handlePointerMove(event: PointerEvent) {
		dragGlyphCalculations(event.clientX, event.clientY, false);
	}
	function handlePointerUp() {
		dragGlyphCalculations(dragState.x, dragState.y, true);
	}

	// handle the glyph drag over snap stuff
	$effect(() => {
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		return () => {
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
		};
	});



    // add 1 extra padding row in all directions around the grid
    function updateGridPadding() {
		if (gridHeight === 0 || gridWidth === 0) throw new Error(`grid was empty?! ${grid}`);
		
        // add buffer rows
        if (grid[0].includes(1)) gridAddRow(true);
        if (grid.at(-1)!.includes(1)) gridAddRow(false);

        // add buffer columns
        if (grid.some((row: number[]) => row[0] === 1)) gridAddColumn(true);
        if (grid.some((row: number[]) => row.at(-1) === 1)) gridAddColumn(false);

		// trim empty rows
		while (gridHeight > initialGridHeight && !grid[0].includes(1) && !grid[1].includes(1)) gridRemoveRow(true);
		while (gridHeight > initialGridHeight && !grid.at(-1)!.includes(1) && !grid.at(-2)!.includes(1)) gridRemoveRow(false);
		// Trim empty columns
		while (gridWidth > initialGridWidth && !grid.some((row: number[]) => row[0] === 1) && !grid.some((row: number[]) => row[1] === 1)) gridRemoveColumn(true);
		while (gridWidth > initialGridWidth && !grid.some((row: number[]) => row.at(-1) === 1) && !grid.some((row: number[]) => row.at(-2) === 1)) gridRemoveColumn(false);
    }

	function gridAddRow(top: boolean) {
		if (top) grid.unshift(Array(gridWidth).fill(0));
		else grid.push(Array(gridWidth).fill(0));
	}
	function gridRemoveRow(top: boolean) {
		if (top) grid.shift();
		else grid.pop();
	}
	function gridAddColumn(left: boolean) {
		if (left) grid.forEach((row: number[]) => row.unshift(0));
		else grid.forEach((row: number[]) => row.push(0));
	}
	function gridRemoveColumn(left: boolean) {
		if (left) grid.forEach((row: number[]) => row.shift())
		else grid.forEach((row: number[]) => row.pop());
	}


	function updateAllGlyphPositions() {
		for (const glyphData of glyphDatas) {
			updateGlyphPositions(glyphData);
		}
	}

	function updateGlyphPositions(glyphData: GlyphData) {
		glyphData.positions = [];

		const glyphHeight = glyphData.glyph.length;
		const glyphWidth = glyphData.glyph[0].length;

		for (let y = 0; y < gridHeight - glyphHeight; y++) {
			for (let x = 0; x <= gridWidth - glyphWidth; x++) {
				if (isGlyphAt(glyphData.glyph, y, x, glyphHeight, glyphWidth)) {
					glyphData.positions.push([y, x]);
				}
			}
		}
	}

	function isGlyphAt(glyph: number[][], y: number, x: number, glyphHeight: number, glyphWidth: number): boolean {
		for (let gy = 0; gy < glyphHeight; gy++) {
			for (let gx = 0; gx < glyphWidth; gx++) {
				if (glyph[gy][gx] !== grid[y + gy][x + gx]) {
					return false; // mismatch found
				}
			}
		}
		return true; // matched
	}
</script>


<div class="gameboard-container">
	<div class="gameboard-grid" bind:this={gameboardHTML}>
		<Glyph bind:grid={grid} editable={true} {highlightedAreas} onpointerup={() => { updateGridPadding(); updateAllGlyphPositions() }} />
	</div>

	{#if dragState.glyph !== null}
		<div class="drag-glyph" bind:this={dragGlyphHTML} style="--x: {dragState.x}px; --y: {dragState.y}px">
			<Glyph grid={dragState.glyph} />
		</div>
	{/if}
</div>

<style>
    .gameboard-container {
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: auto;
    }

	/* .gameboard-grid {
		mask-image: linear-gradient(
			to bottom,
			transparent,
			black var(--cell-size),
			black calc(100% - var(--cell-size)),
			transparent
		), linear-gradient(
			to right,
			transparent,
			black var(--cell-size),
			black calc(100% - var(--cell-size)),
			transparent
		);
		mask-composite: intersect;
	} */

	.drag-glyph {
		position: fixed;
		top: var(--y);
		left: var(--x);
		transform-origin: 0 0;
		transform: translate(-50%, -50%);
		z-index: 69;
		/* pointer-events: none; */
		opacity: 0.8;
		animation: wiggle 0.4s infinite ease-in-out;
	}

	@keyframes wiggle {
		0% { rotate: -2deg; }
		50% { rotate: 2deg; }
		100% { rotate: -2deg; }
	}
</style>