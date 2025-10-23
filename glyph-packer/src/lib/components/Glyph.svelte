<script lang="ts">
	export type HighlightArea = { y1: number; x1: number; y2: number; x2: number };

	const {
		grid=$bindable(),
		// v optional v
		editable = false,
		highlightedAreas,
		onpointerup,
	} = $props<{
		grid: number[][];
		editable?: boolean;
		highlightedAreas?: HighlightArea[];
		onpointerup?: () => void;
	}>();
    let drag = $state({ isDragging: false, dragWith: 0 });


    function toggleCell(y: number, x: number) {
        if (!editable) return;
        const newValue = 1 - grid[y][x];
        grid[y][x] = newValue;
    }

    function handlePointerDown(y: number, x: number) {
        if (!editable) return;
        drag.isDragging = true;
        toggleCell(y, x);
		drag.dragWith = grid[y][x];
    }

    function handlePointerOver(y: number, x: number) {
		// Only toggle if we are in a dragging state AND the drag started here
		if (drag.isDragging) {
			grid[y][x] = drag.dragWith;
		}
	}

	// detects mouse button releases ANYWHERE on the page
	$effect(() => {
		const handlePointerUp = () => {
			drag.isDragging = false;
			if (onpointerup) onpointerup();
		};

		// Attach listeners when the component mounts
		window.addEventListener('mouseup', handlePointerUp);
		return () => window.removeEventListener('mouseup', handlePointerUp);
	});
</script>

<div class="glyph-grid" style="--columns: {grid?.[0]?.length || 1};">
	<!-- loop over local 'grid' state -->
	{#each grid as row, y}
		{#each row as cell, x}
			<svelte:element
				this={editable ? 'button' : 'div'}
                class="cell"
                class:on={cell === 1}
				class:editable={editable}
				class:highlighted={highlightedAreas?.some((area: HighlightArea) => {
					const { y1, x1, y2, x2 } = area;
					return y >= y1 && y < y2 && x >= x1 && x < x2;
				})}
				onpointerdown={() => handlePointerDown(y, x)}
				onpointerover={() => handlePointerOver(y, x)}
				aria-label="Cell {y+1}, {x+1}"
				data-y={y}
				data-x={x}
            ></svelte:element>
		{/each}
	{/each}
</div>

<style>
	.glyph-grid {
		display: grid;
		grid-template-columns: repeat(var(--columns), 1fr);
		height: fit-content;
		/* border: 2px solid var(--color-bg-1); */
		gap: 1px;
        border-radius: 4px;
        /* padding: 3px; */
	}

	.cell {
		width: calc(var(--cell-size) - 1px); /* account for gap */
		height: calc(var(--cell-size) - 1px);
		--background-color: var(--color-bg-1);
		background-color: var(--background-color);
        border-radius: 10%;

		/* Reset button styles if it's a button */
		border: none;
		padding: 0;
	}

	.cell.on {
		--background-color: var(--color-theme-2);
	}

	button.cell:hover {
		outline: 3px solid var(--color-selection);
		cursor: pointer;
        z-index: 10;
	}

	.cell.highlighted {
		background-color: color-mix(in oklab, var(--background-color) 80%, var(--color-highlight) 20%);
	}
</style>