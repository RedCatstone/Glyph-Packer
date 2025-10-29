<script lang="ts">
	export type HighlightArea = { y1: number; x1: number; y2: number; x2: number };

	const {
		grid=$bindable(),
		// v optional v
		editable = false,
		highlightedAreas,
		onpointerup,
		onToggleCell,
	} = $props<{
		grid: number[][],
		editable?: boolean,
		highlightedAreas?: HighlightArea[],
		onpointerup?: () => void,
		onToggleCell?: (y: number, x: number) => void,
	}>();
    let dragState: number | null = $state(null);


    function handlePointerDown(y: number, x: number) {
        if (!editable) return;
        const newValue = 1 - grid[y][x];
        grid[y][x] = newValue;
		dragState = newValue;
		if (onToggleCell) onToggleCell(y, x);
    }

    function handlePointerOver(y: number, x: number) {
		// Only toggle if we are in a dragging state AND the drag started here
		if (dragState != null) {
			grid[y][x] = dragState;
			onToggleCell(y, x);
		}
	}

	// detects mouse button releases ANYWHERE on the page
	$effect(() => {
		const handlePointerUp = () => {
			dragState = null;
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
				onpointerdown={() => handlePointerDown(y, x)}
				oncontextmenu={(e: Event) => e.preventDefault()}
				onpointerover={() => handlePointerOver(y, x)}
				aria-label="Cell {y+1}, {x+1}"
				role="figure"
            ></svelte:element>
		{/each}
	{/each}

	<!-- render highlighted areas ontop -->
	{#each highlightedAreas as area}
			<div
				class="highlight-overlay"
				style="--x1: {area.x1}; --y1: {area.y1}; --x2: {area.x2}; --y2: {area.y2};"
			></div>
		{/each}
</div>

<style>
	.glyph-grid {
		display: grid;
		grid-template-columns: repeat(var(--columns), var(--cell-size));
		height: fit-content;
		/* border: 2px solid var(--color-bg-1); */
		position: relative;
	}

	.cell {
		width: var(--cell-size);
		height: var(--cell-size);
		position: relative;
		
		/* Reset styles */
		/* this element only has the hitbox, visuals are on ::after */
		background-color: unset;
        border-radius: 0;
		border: none;
		padding: 0;
	}

	.cell::after {
		/* real styling */
		background-color: var(--color-bg-1);
		content: '';
		position: absolute;
		inset: 1px;
		border-radius: 10%;

	}

	.cell.on::after {
		background-color: var(--cell-color);
	}

	button.cell:hover::after {
		outline: 3px solid var(--color-selection);
		cursor: pointer;
        z-index: 10;
	}

	.highlight-overlay {
		position: absolute;
		top: calc(var(--y1) * var(--cell-size));
		left: calc(var(--x1) * var(--cell-size));
		width: calc(calc(var(--x2) - var(--x1)) * var(--cell-size));
		height: calc(calc(var(--y2) - var(--y1)) * var(--cell-size));
		
		background-color: rgb(from var(--color-highlight) r g b / 0.2);
		outline: 2px solid var(--color-highlight);
		border-radius: 3px;
	}
</style>