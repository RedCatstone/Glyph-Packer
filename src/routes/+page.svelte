<script lang="ts">
	import GlyphSelector from '../lib/components/GlyphSelector.svelte';
	import { glyphsLib } from '$lib/glyphLib'
	import Gameboard, { type DragState, type GlyphData } from '$lib/components/Gameboard.svelte';
	import type { HighlightArea } from '$lib/components/Glyph.svelte';

	// random variables
	let dragState = $state<DragState>({ glyph: null, x: 0, y: 0 });
	let sortFinished = $state(false);
	let extraMode = $state('Normal');
	let cellSize = $state(25);

	// data logic
	const glyphPacks: GlyphData[] = $derived(
		Object.entries(glyphsLib)
			.map(([name, packData]) => ({
				glyphs: packData.glyphs[packData.thumbnail],
				name,
				color: packData.color,
			}))
	);
	let currGlyphPackName = $state("Numbers");
	const currPack = $derived(glyphsLib[currGlyphPackName]);

	const glyphDatas: GlyphData[] = $derived((() => {
		const baseData = Object.entries(currPack.glyphs).map(([name, glyphs]): GlyphData => ({ glyphs, name }));

		if (extraMode === "Normal") 					return baseData;
		else if (extraMode === "Any Rotations") 		return baseData.map(({ glyphs, name }) => ({ glyphs: anyRotations(glyphs, false), name }));
		else if (extraMode === "Any Rotations/Mirrors") return baseData.map(({ glyphs, name }) => ({ glyphs: anyRotations(glyphs, true), name }));
		else if (extraMode === "All Rotations") 		return jsonRemoveDupes(baseData.flatMap(({ glyphs, name }) => allRotations(glyphs, false).map(glyphs => ({ glyphs }))));
		else if (extraMode === "All Rotations/Mirrors") return jsonRemoveDupes(baseData.flatMap(({ glyphs, name }) => allRotations(glyphs, true).map(glyphs => ({ glyphs }))));
		else throw new Error("how did you get to this mode?!");
	})());

	function jsonRemoveDupes(arr: any[]): any[] {
		return Array.from(new Set(arr.map(x => JSON.stringify(x)))).map(x => JSON.parse(x));
	}

	function anyRotations(matrices: number[][][], includeMirrors: boolean): number[][][] {
		const transforms = [];
		for (const matrix of matrices) {
			for (const r of [0, 1, 2, 3]) {
				const rotated = rotateMatrix(matrix, r);
				transforms.push(rotated);
				if (includeMirrors) transforms.push(flipMatrixHorizontal(rotated));
			}
		}
		return jsonRemoveDupes(transforms);
	}
	function allRotations(matrices: number[][][], includeMirrors: boolean): number[][][][] {
		const transforms = [];
		for (const r of [0, 1, 2, 3]) {
			const rotat = [];
			const inver = [];
			for (const matrix of matrices) {
				const rotated = rotateMatrix(matrix, r);
				rotat.push(rotated);
				if (includeMirrors) inver.push(flipMatrixHorizontal(rotated));
			}
			transforms.push(rotat);
			if (includeMirrors) transforms.push(inver);
		}
		return jsonRemoveDupes(transforms);
	}

	function rotateMatrix(matrix: any[][], rotations: number) {
	    for (let r = 0; r < rotations; r++) {
	        const height = matrix.length;
	        const width = matrix[0].length;
	        const newMatrix = Array(width).fill(null).map(() => Array(height));
	        for (let y = 0; y < height; y++) {
	            for (let x = 0; x < width; x++) {
	                newMatrix[x][height - 1 - y] = matrix[y][x];
	            }
	        }
	        matrix = newMatrix;
	    }
	    return matrix;
	}
	function flipMatrixHorizontal(matrix: any[][]) {
		return matrix.map(row => [...row].reverse());
	}
	
	const maxPatternHeight = $derived(Math.max(...glyphDatas.flatMap(pack => pack.glyphs).map(glyph => glyph.length)));
	const maxPatternWidth = $derived(Math.max(...glyphDatas.flatMap(pack => pack.glyphs).map(glyph => glyph[0].length)));
	
	let hoveredGlyphIndex = $state<number | null>(null);
	let glyphPositions = $state<HighlightArea[][]>([]);


	function handleGlyphDragStart(glyphData: GlyphData, event: PointerEvent) {
		dragState.glyph = glyphData.glyphs[0];
		dragState.x = event.clientX;
		dragState.y = event.clientY;
		event.preventDefault();
	}

	function sortGlyphs(glyphs: GlyphData[]) {
		if (!sortFinished) return glyphs;
		else {
			return glyphDatas
				.map((x, i) => ({ x, i }))
				.toSorted((a, b) => Number(glyphPositions?.[a.i]?.length > 0) - Number(glyphPositions?.[b.i]?.length > 0))
				.map(({ x, i }) => x);
		}
	}
</script>

<div class="game" style="--cell-size: {cellSize}px; --cell-color: {currPack.color}">
	<!-- <div class="controls">
		Zoom
		<button onclick={() => cellSize = Math.max(cellSize - 2, 4)}>-</button>
		<button onclick={() => cellSize = Math.min(cellSize + 2, 60)}>+</button>
	</div> -->

	<div class="glyph-selection-stuff">
		<!-- pack selector -->
		<GlyphSelector
			glyphs={glyphPacks}
			showNames={true}
			noShrink={true}
			onGlyphDragStart={(glyph, event) => currGlyphPackName = glyph.name!}
		/>

		<!-- glyph selector -->
		<GlyphSelector
			glyphs={sortGlyphs(glyphDatas)}
			{glyphPositions}
			onGlyphHover={(x) => hoveredGlyphIndex = x}
			onGlyphLeave={() => hoveredGlyphIndex = null}
			onGlyphDragStart={handleGlyphDragStart}
		/>

		<!-- Settings -->
		<div>
			<button class:active={sortFinished} onclick={() => sortFinished = !sortFinished}>Sort Finished</button>
			<select bind:value={extraMode}>
				<option value="Any Rotations/Mirrors">Any Rotations/Mirrors</option>
				<option value="Any Rotations">Any Rotations</option>
				<option value="Normal">Normal</option>
				<option value="All Rotations">All Rotations</option>
				<option value="All Rotations/Mirrors">All Rotations/Mirrors</option>
			</select>
		</div>
	</div>
	<div class="gameboard">
		<!-- the actual board -->
		<Gameboard {maxPatternHeight} {maxPatternWidth} {cellSize} {hoveredGlyphIndex} bind:glyphPositions={glyphPositions} bind:dragState={dragState} {glyphDatas}/>
	</div>
</div>

<style>
	.game {
		display: flex;
		flex-direction: row;
		justify-content: center;
		flex: 0.6;
		gap: 30px;
		max-height: 80vh;
	}

	.glyph-selection-stuff {
		display: flex;
		flex-direction: column;
		gap: 30px;
	}
</style>
