<script lang="ts">
	import Glyph, { type HighlightArea } from "./Glyph.svelte";
	export type DragState = { glyph: number[][] | null; x: number; y: number };

    let { grid=$bindable(), cellSize, highlightGlyph, dragState=$bindable() } = $props<{
		grid: number[][],
		cellSize: number,
		highlightGlyph: number[][] | null,
		dragState: DragState,
	}>();

	const gridHeight = $derived(grid.length);
	const gridWidth = $derived(grid[0].length);

	let gameboardHTML: HTMLElement | null = null;
	let dragGlyphHTML: HTMLElement | null = null;


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
				while (gridY < 0) { grid.unshift(Array(gridWidth).fill(0)); gridY++; }
				while (gridX < 0) { grid.forEach((row: number[]) => row.unshift(0)); gridX++; }

				// expand down/right
				while (gridHeight < gridY + dragGlyphHeight) { grid.push(Array(gridWidth).fill(0)); }
				while (gridWidth < gridX + dragGlyphWidth) { grid.forEach((row: number[]) => row.push(0)); }

				for (let dy = 0; dy < dragGlyphHeight; dy++) {
					for (let dx = 0; dx < dragGlyphWidth; dx++) {
						grid[gridY + dy][gridX + dx] = dragState.glyph[dy][dx];
					}
				}
			}
			dragState.glyph = null;
			updateGridPadding();
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



	const initialGridHeight = grid.length;
	const initialGridWidth = grid[0].length;

    // add 1 extra padding row in all directions around the grid
    function updateGridPadding() {
		if (grid.length === 0 || grid[0].length === 0) throw new Error(`grid was empty?! ${grid}`);
		
        // add buffer rows
        if (grid[0].includes(1)) grid.unshift(Array(gridWidth).fill(0));
        if (grid.at(-1)!.includes(1)) grid.push(Array(gridWidth).fill(0));

        // add buffer columns
        if (grid.some((row: number[]) => row[0] === 1)) grid.forEach((row: number[]) => row.unshift(0));
        if (grid.some((row: number[]) => row.at(-1) === 1)) grid.forEach((row: number[]) => row.push(0));

		// trim empty rows
		while (grid.length > initialGridHeight && !grid[0].includes(1) && !grid[1].includes(1)) {
			grid.shift();
		}
		while (grid.length > initialGridHeight && !grid.at(-1)!.includes(1) && !grid.at(-2)!.includes(1)) {
			grid.pop();
		}
		// Trim empty columns
		while (grid[0].length > initialGridWidth && !grid.some((row: number[]) => row[0] === 1) && !grid.some((row: number[]) => row[1] === 1)) {
			grid.forEach((row: number[]) => row.shift());
		}
		while (grid[0].length > initialGridWidth && !grid.some((row: number[]) => row.at(-1) === 1) && !grid.some((row: number[]) => row.at(-2) === 1)) {
			grid.forEach((row: number[]) => row.pop());
		}
    }


    const highlightedAreas = $derived((() => {
        const areas: HighlightArea[] = [];
        if (!highlightGlyph) return areas;

		const glyphHeight = highlightGlyph.length;
		const glyphWidth = highlightGlyph[0].length;
		const gridHeight = grid.length;
		const gridWidth = grid[0].length;

        for (let y = 0; y <= gridHeight - glyphHeight; y++) {
			for (let x = 0; x <= gridWidth - glyphWidth; x++) {
                if (isHighlightMatch(y, x, glyphHeight, glyphWidth)) {
			    	areas.push({ y1: y, x1: x, y2: y+glyphHeight, x2: x+glyphWidth });
                }
			}
		}

        return areas;
    })());

    function isHighlightMatch(startY: number, startX: number, glyphHeight: number, glyphWidth: number): boolean {
		for (let gy = 0; gy < glyphHeight; gy++) {
			for (let gx = 0; gx < glyphWidth; gx++) {
				if (highlightGlyph![gy][gx] !== grid[startY + gy][startX + gx]) {
					return false; // mismatch found
				}
			}
		}
		return true; // matched
	}
</script>


<div class="gameboard-container">
	<div class="gameboard-grid" bind:this={gameboardHTML}>
		<Glyph bind:grid={grid} editable={true} highlightedAreas={highlightedAreas} onpointerup={updateGridPadding} />
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

	.drag-glyph {
		position: fixed;
		top: var(--y);
		left: var(--x);
		transform: translate(-50%, -50%);
		z-index: 69;
		pointer-events: none;
		opacity: 0.8;
	}
</style>