<script lang="ts">
	import { untrack } from "svelte";
	import Glyph, { type HighlightArea } from "./Glyph.svelte";
	export type DragState = { glyph: number[][] | null, x: number, y: number };
	export type GlyphData = { glyphs: number[][][], name?: string, color?: string }

    let { maxPatternHeight, maxPatternWidth, cellSize, hoveredGlyphIndex, glyphPositions=$bindable(), dragState=$bindable(), glyphDatas } = $props<{
		maxPatternHeight: number,
		maxPatternWidth: number,
		cellSize: number,
		hoveredGlyphIndex: number | null,
		glyphPositions: HighlightArea[][],
		dragState: DragState,
		glyphDatas: GlyphData[],
	}>();

	let grid: number[][] = $state(Array.from({ length: maxPatternHeight + 2 }, () => Array(maxPatternWidth + 2).fill(0)));
	const gridHeight = $derived(grid.length);
	const gridWidth = $derived(grid[0].length);

	let gridBounds = $state({ top: Infinity, bottom: -Infinity, left: Infinity, right: -Infinity });
	let lockHeight = $state(false);
	let lockWidth = $state(false);
	
	// Stats
	const drawingHeight = $derived(Math.max(0, gridBounds.bottom - gridBounds.top + 1));
	const drawingWidth = $derived(Math.max(0, gridBounds.right - gridBounds.left + 1));
	const totalBlocks = $derived(grid.reduce((tot, x) => tot + x.reduce((itot, ix) => itot + Number(ix !== 0), 0), 0));


	const highlightedAreas = $derived((() => {
		if (hoveredGlyphIndex === null) return [];

		return glyphPositions[hoveredGlyphIndex];
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

				// paste pattern onto the grid
				for (let dy = 0; dy < dragGlyphHeight; dy++) {
					for (let dx = 0; dx < dragGlyphWidth; dx++) {
						grid[gridY + dy][gridX + dx] = dragState.glyph[dy][dx];
					}
				}
				fullUpdate();
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
        // add buffer rows
        if (!lockHeight && grid[0].includes(1)) gridAddRow(true);
        if (!lockHeight && grid.at(-1)!.includes(1)) gridAddRow(false);

        // add buffer columns
        if (!lockWidth && grid.some(row => row[0] === 1)) gridAddColumn(true);
        if (!lockWidth && grid.some(row => row.at(-1) === 1)) gridAddColumn(false);

		const extraRows = 2 * Number(!lockHeight);
		const extraColumns = 2 * Number(!lockWidth);

		// add rows/columns if grid is too smol
		while (gridHeight - extraRows < maxPatternHeight) gridAddRow(false);
		while (gridWidth - extraColumns < maxPatternWidth) gridAddColumn(false);

		// trim empty rows
		while (gridHeight - extraRows > maxPatternHeight && !grid[0].includes(1) && (lockHeight || !grid[1].includes(1))) gridRemoveRow(true);
		while (gridHeight - extraRows > maxPatternHeight && !grid.at(-1)!.includes(1) && (lockHeight || !grid.at(-2)!.includes(1))) gridRemoveRow(false);
		// Trim empty columns
		while (gridWidth - extraColumns > maxPatternWidth && !grid.some(row => row[0] === 1) && (lockWidth || !grid.some(row => row[1] === 1))) gridRemoveColumn(true);
		while (gridWidth - extraColumns > maxPatternWidth && !grid.some(row => row.at(-1) === 1) && (lockWidth || !grid.some(row => row.at(-2) === 1))) gridRemoveColumn(false);
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
		if (left) grid.forEach(row => row.unshift(0));
		else grid.forEach(row => row.push(0));
	}
	function gridRemoveColumn(left: boolean) {
		if (left) grid.forEach(row => row.shift())
		else grid.forEach(row => row.pop());
	}


	function updateAllGlyphPositions() {
		glyphPositions = [];
		glyphDatas.forEach((glyphData: GlyphData, i: number) => {
			glyphPositions[i] = getGlyphPositions(glyphData);
		});
	}

	function getGlyphPositions(glyphData: GlyphData) {
		let newPositions: HighlightArea[] = [];

		for (const glyph of glyphData.glyphs) {
			const glyphHeight = glyph.length;
			const glyphWidth = glyph[0].length;

			for (let y = 0; y <= gridHeight - glyphHeight; y++) {
				for (let x = 0; x <= gridWidth - glyphWidth; x++) {
					if (isGlyphAt(glyph, y, x, glyphHeight, glyphWidth)) {
						newPositions.push({ y1: y, x1: x, y2: y+glyphHeight, x2: x+glyphWidth });
					}
				}
			}
		}
		return newPositions;
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

	function fullUpdate() {
		updateGridPadding();
		recalculateAllBounds();
		updateAllGlyphPositions();
	}

	// this triggers when glyphDatas changes, so when the glyph pack changes
	$effect(() => {
		glyphDatas;
		untrack(() => fullUpdate());
	})


	function onToggleCell(y: number, x: number) {
		if (grid[y][x] !== 0) {
			// toggled on!
			if (y < gridBounds.top) gridBounds.top = y;
			if (y > gridBounds.bottom) gridBounds.bottom = y;
			if (x < gridBounds.left) gridBounds.left = x;
			if (x > gridBounds.right) gridBounds.right = x;
		}
		else {
			// toggled off, more complicated
			recalculateAllBounds();
		}
		fullUpdate();
	}

	function recalculateAllBounds() {
		let newTop = Infinity;
		let newBottom = -Infinity;
		let newLeft = Infinity;
		let newRight = -Infinity;

		for (let y = 0; y < gridHeight; y++) {
			for (let x = 0; x < gridWidth; x++) {
				if (grid[y][x] !== 0) {
					if (y < newTop) newTop = y;
					if (y > newBottom) newBottom = y;
					if (x < newLeft) newLeft = x;
					if (x > newRight) newRight = x;
				}
			}
		}
		gridBounds.top = newTop;
		gridBounds.bottom = newBottom;
		gridBounds.left = newLeft;
		gridBounds.right = newRight;
	}
</script>

<div class="overflow-div">
	<div class="gameboard-container">
		<!-- the 2 measuring sticks on left and top -->
		<div class="lock-button lock-height">
			<div class="measurer"
				style="--bounds-top: {gridBounds.top === Infinity ? gridHeight/2 : gridBounds.top};
					   --bounds-bottom: {gridBounds.bottom}">
				<button class:active={lockHeight} onclick={() => { lockHeight = !lockHeight; fullUpdate()}}>{drawingHeight}</button>
			</div>
		</div>
		<div class="lock-button lock-width">
			<div class="measurer"
				style="--bounds-left: {gridBounds.left === Infinity ? gridWidth/2 : gridBounds.left};
					   --bounds-right: {gridBounds.right}">
				<button class:active={lockWidth} onclick={() => { lockWidth = !lockWidth; fullUpdate() }}>{drawingWidth}</button>
			</div>
		</div>

		<!-- the actual gameboard -->
		<div class="gameboard-grid" bind:this={gameboardHTML}>
			<Glyph bind:grid={grid} editable={true} {highlightedAreas} {onToggleCell}/>
		</div>

		<!-- Area Calc -->
		<div class="gameboard-bottom">
			<span>Area: {drawingHeight * drawingWidth} - Blocks: {totalBlocks}</span>
			<button onclick={() => { grid = [[]]; fullUpdate() }}>Reset</button>
		</div>

		<!-- dragging a glyph from the GlyphSelector -->
		{#if dragState.glyph !== null}
			<div class="drag-glyph" bind:this={dragGlyphHTML} style="--x: {dragState.x}px; --y: {dragState.y}px">
				<Glyph grid={dragState.glyph} />
			</div>
		{/if}
	</div>
</div>

<style>

	.overflow-div {
		height: 100%;
		overflow: auto;
		align-items: center;
		display: flex;
	}

    .gameboard-container {
		display: grid;
		grid-template-rows: auto 1fr auto;
		grid-template-columns: auto 1fr;
		margin: auto;
    }

	.gameboard-grid {
		grid-row: 2;
		grid-column: 2;
		min-height: 0;
		min-width: 0;
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

	.lock-button {
		position: relative;
		width: calc(1.5 * var(--cell-size));
		height: calc(1.5 * var(--cell-size));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lock-height {
		grid-row: 2;
		grid-column: 1;
	}

	.lock-width {
		grid-row: 1;	
		grid-column: 2;
	}

	.gameboard-bottom {
		grid-row: 3;
		grid-column: 2;
	}

	.measurer {
		position: absolute;
		background-color: var(--cell-color);

		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.1s ease-out;
	}
	.lock-height .measurer {
		width: 3px;
		top: calc(var(--bounds-top) * var(--cell-size));
		height: calc((var(--bounds-bottom) - var(--bounds-top) + 1) * var(--cell-size));
	}
	.lock-width .measurer {
		height: 3px;
		left: calc(var(--bounds-left) * var(--cell-size));
		width: calc((var(--bounds-right) - var(--bounds-left) + 1) * var(--cell-size));
	}

	/* measure caps */
	.measurer::before,
	.measurer::after {
		content: '';
		position: absolute;
		background-color: inherit;
		border-radius: 2px;
		z-index: -1;
	}
	.lock-height .measurer::before {
		top: 0;
		width: 15px;
		height: 3px;
	}
	.lock-height .measurer::after {
		bottom: 0;
		width: 15px;
		height: 3px;
	}
	.lock-width .measurer::before {
		left: 0;
		width: 3px;
		height: 15px;
	}
	.lock-width .measurer::after {
		right: 0;
		width: 3px;
		height: 15px;
	}



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