import type { GlyphData } from "./components/Gameboard.svelte";

export function removeDuplicateGlyphs(glyphs: GlyphData[]): GlyphData[] {
    const strippedGlyphs = glyphs.map(({ glyphs, name }) => glyphs);
    const jsonedGlyphs = strippedGlyphs.map(glyphAlts => JSON.stringify(
        glyphAlts
            .map(glyph => JSON.stringify(glyph))
            .sort() // sort the alts, so alts[x, y] can be eliminated with alts[y, x]
    ));

    const jsonedGlyphsSet = new Set();
    const returnGlyphs = [];

    for (let i = 0; i < glyphs.length; i++) {
        if (!jsonedGlyphsSet.has(jsonedGlyphs[i])) {
            jsonedGlyphsSet.add(jsonedGlyphs[i]);
            returnGlyphs.push(glyphs[i]);
        }
    }
    return returnGlyphs;
}

export function anyRotations(matrices: number[][][], includeMirrors: boolean): number[][][] {
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
export function allRotations(matrices: number[][][], includeMirrors: boolean): number[][][][] {
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
    return transforms;
}

function jsonRemoveDupes<T>(arr: T[]): T[] {
    return Array.from(new Set(arr.map(x => JSON.stringify(x))), x => JSON.parse(x));
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



export function calculateBlocksInGrid(grid: number[][]): number {
    return grid.reduce((tot, x) => tot + x.reduce((itot, ix) => itot + Number(ix !== 0), 0), 0);
}
export function calculateAreaInGrid(grid: number[][]): number {
    return grid.length * (grid[0]?.length ?? 0);
}