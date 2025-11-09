<script lang="ts">
	import GlyphSelector from '../lib/components/GlyphSelector.svelte';
	import { glyphsLib } from '$lib/glyphLib'
	import Gameboard, { type DragState, type GlyphData, type MaxPatternSizes } from '$lib/components/Gameboard.svelte';
	import type { HighlightArea } from '$lib/components/Glyph.svelte';
	import { allRotations, anyRotations, removeDuplicateGlyphs } from '$lib/glyphUtils';
	import SettingsAndInfos, { type PersonalBest } from '$lib/components/SettingsAndInfos.svelte';
	import { browser } from '$app/environment';

	// random variables
	let dragState = $state<DragState>({ glyph: null, x: 0, y: 0 });
	let sortFinished = $state(false);
	let extraMode = $state('Normal');
	let cellSize = $state(25);

	let hoveredGlyphIndex = $state<number | null>(null);
	let glyphPositions = $state<HighlightArea[][]>([]);


	// data logic
	const glyphPacks: { glyphData: GlyphData, id: number }[] = $derived(
		Object.entries(glyphsLib)
			.map(([name, packData], id) => ({
				glyphData: {
					glyphs: packData.glyphs[packData.thumbnail],
					name,
					color: packData.color,
				},
				id,
			}))
	);

	// curr pack data
	let currGlyphPackName = $state("Numbers");
	const currPack = $derived(glyphsLib[currGlyphPackName]);

	const glyphDatas: GlyphData[] = $derived((() => {
		const baseData = Object.entries(currPack.glyphs).map(([name, glyphs]): GlyphData => ({ glyphs, name }));

		if (extraMode === "Normal") 					return baseData;
		else if (extraMode === "Any Rotation") 			return removeDuplicateGlyphs(baseData.map(({ glyphs, name }) => ({ glyphs: anyRotations(glyphs, false), name })));
		else if (extraMode === "Any Rotation/Mirror") 	return removeDuplicateGlyphs(baseData.map(({ glyphs, name }) => ({ glyphs: anyRotations(glyphs, true), name })));
		else if (extraMode === "All Rotations") 		return removeDuplicateGlyphs(baseData.flatMap(({ glyphs, name }) => allRotations(glyphs, false).map(glyphs => ({ glyphs, name }))));
		else if (extraMode === "All Rotations/Mirrors") return removeDuplicateGlyphs(baseData.flatMap(({ glyphs, name }) => allRotations(glyphs, true).map(glyphs => ({ glyphs, name }))));
		else throw new Error("how did you get to this mode?!");
	})());

	
	// maximum sizes within alts
	const maxPatternSizes: MaxPatternSizes = $derived({
		maxMaxHeight: Math.max(...glyphDatas.map(datas => Math.max(...datas.glyphs.map(glyph => glyph.length)))),
		maxMaxWidth: Math.max(...glyphDatas.map(datas => Math.max(...datas.glyphs.map(glyph => glyph[0].length)))),
		maxMinHeight: Math.max(...glyphDatas.map(datas => Math.min(...datas.glyphs.map(glyph => glyph.length)))),
		maxMinWidth: Math.max(...glyphDatas.map(datas => Math.min(...datas.glyphs.map(glyph => glyph[0].length)))),
	});


	function handleGlyphDragStart(glyphData: GlyphData, event: PointerEvent) {
		dragState.glyph = glyphData.glyphs[0];
		dragState.x = event.clientX;
		dragState.y = event.clientY;
		event.preventDefault();
	}

	function sortGlyphs(glyphs: GlyphData[]) {
		if (!sortFinished) return glyphs.map((glyphData, id) => ({ glyphData, id }));
		else {
			return glyphDatas
				.map((x, i) => ({ x, i, positions: glyphPositions[i] }))
				.toSorted((a, b) => Number(a.positions?.length > 0) - Number(b.positions?.length > 0))
				.map(({ x, i }) => ({ glyphData: x, id: i }));
		}
	}


	let personalBests: { [key: string /* packname */]: { [key: string /* modename */]: { [key: string /* savename */]: PersonalBest } } } = persistentState('glyph-packer-pbs', {});
	let personalBestsPack = $derived(personalBests[currGlyphPackName] ?? {});
	let personalBestsPackMode = $derived(personalBestsPack[extraMode] ?? {});
	
	$effect(() => {
		if (!personalBests[currGlyphPackName]) personalBests[currGlyphPackName] = {};
		if (!personalBestsPack[extraMode]) personalBestsPack[extraMode] = {};
	});

	function persistentState(key: string, initialValue: any) {
		// try loading / default
		let stateValue = initialValue;
		if (browser) {
			const savedValue = localStorage.getItem(key);
			if (savedValue) {
				try {
					stateValue = JSON.parse(savedValue);
				} catch {
					// If JSON parsing fails, stick with the initial value.
					console.warn(`Failed to parse localStorage value for key: ${key}`);
				}
			}
		}
	    // create the holy state variable
		const state = $state(stateValue);
		$effect(() => {
			localStorage.setItem(key, JSON.stringify(state));
			console.log(`Saved '${key}' to localStorage.`);
		});
		return state;
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
			handleGlyphDragStart={(glyph, event) => currGlyphPackName = glyph.name!}
		/>

		<!-- glyph selector -->
		<GlyphSelector
			glyphs={sortGlyphs(glyphDatas)}
			{glyphPositions}
			onGlyphHover={(x) => hoveredGlyphIndex = x}
			onGlyphLeave={() => hoveredGlyphIndex = null}
			{handleGlyphDragStart}
		/>

		<!-- Settings -->
		<SettingsAndInfos {glyphPositions} bind:sortFinished={sortFinished} bind:extraMode={extraMode} personalBests={personalBestsPack} {handleGlyphDragStart}/>
	</div>
	<div class="gameboard">
		<!-- the actual board -->
		<Gameboard {maxPatternSizes} {cellSize} {hoveredGlyphIndex} bind:glyphPositions={glyphPositions} bind:dragState={dragState} {glyphDatas} bind:personalBest={personalBestsPackMode}/>
	</div>
</div>

<style>
	.game {
		display: flex;
		flex-direction: row;
		justify-content: center;
		flex: 0.6;
		gap: 10px;
		max-height: 80vh;
	}

	.glyph-selection-stuff {
		display: flex;
		flex-direction: column;
		gap: 20px;
		overflow: auto;
	}
</style>
