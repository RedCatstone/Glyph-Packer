<script lang="ts">
	import { calculateAreaInGrid, calculateBlocksInGrid } from '$lib/glyphUtils';
	import Collapsible from './Collapsible.svelte';
	import type { GlyphData } from './Gameboard.svelte';
    import type { HighlightArea } from './Glyph.svelte';
	import GlyphSelector from './GlyphSelector.svelte';

    export type PersonalBest = number[][];

	// Receive the total number of glyphs and the positions array for the counter
	let { glyphPositions, sortFinished=$bindable(), extraMode=$bindable(), personalBests, handleGlyphDragStart }: {
		glyphPositions: HighlightArea[][],
        sortFinished: boolean,
        extraMode: string,
        personalBests: { [key: string /* modename */]: { [key: string /* savename */]: PersonalBest } },
		handleGlyphDragStart: (glyph: GlyphData, event: PointerEvent) => void,
	} = $props();

    const glyphSavesToDisplay: { glyphData: GlyphData, id: number }[] = $derived(
        Object.entries(personalBests?.[extraMode] ?? {})
            .map(([name, board], id) => ({
				glyphData: {
					glyphs: [board],
					name: name, // `${name}\nArea: ${calculateAreaInGrid(board)} - Blocks: ${calculateBlocksInGrid(board)}`,
				},
				id,
			}))
    )
</script>


<div class="settings">
    <button class:active={sortFinished} onclick={() => sortFinished = !sortFinished}>Sort Finished</button>
    <select bind:value={extraMode}>
        <option value="Any Rotation/Mirror">Any Rotation/Mirror</option>
        <option value="Any Rotation">Any Rotation</option>
        <option value="Normal">Normal</option>
        <option value="All Rotations">All Rotations</option>
        <option value="All Rotations/Mirrors">All Rotations/Mirrors</option>
    </select>
    <span>({glyphPositions.filter(x => x.length > 0).length}/{glyphPositions.length})</span>

    <br>
    
    <!-- if saves exist, display them! -->
    {#if Object.keys(personalBests?.[extraMode] ?? {}).length > 0}
        <Collapsible label="Saved Boards">
            <GlyphSelector glyphs={glyphSavesToDisplay} showNames={true} {handleGlyphDragStart}/>
        </Collapsible>
    {/if}
</div>

<style>
    .settings {
        /* display: flex; */
        align-items: center;
        justify-content: center;
        gap: 10px;
    }
</style>