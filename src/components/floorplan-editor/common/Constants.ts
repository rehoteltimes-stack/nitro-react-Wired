export const TILE_SIZE = 32;
export const MAX_NUM_TILE_PER_AXIS = 64;

// Heights 0-9, a-z (10-35), A-Q (36-52), like sodaho.tel's floor editor. The second "x" (a-z run) is not a height
// (x = no tile); X_HEIGHT_INDEX is skipped when raising / lowering and in the palette. A-Z above z work because the
// hCMS plugin (UpperCaseHeights) and the renderer patch read them as 36-61.
export const HEIGHT_SCHEME: string = 'x0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ';
export const X_HEIGHT_INDEX: number = HEIGHT_SCHEME.indexOf('x', 1);
export const MAX_HEIGHT_VALUE: number = (HEIGHT_SCHEME.length - 2);

export const MIN_WALL_HEIGHT: number = 0;
export const MAX_WALL_HEIGHT: number = 16;

export class FloorAction
{
    public static readonly NONE = -1;
    public static readonly DOOR = 0;
    public static readonly UP = 1;
    public static readonly DOWN = 2;
    public static readonly SET = 3;
    public static readonly UNSET = 4;
}

export const COLORMAP: { [key: string]: string } = {
    'x': '101010',
    '0': '0065ff',
    '1': '0091ff',
    '2': '00bcff',
    '3': '00e8ff',
    '4': '00ffea',
    '5': '00ffbf',
    '6': '00ff93',
    '7': '00ff68',
    '8': '00ff3d',
    '9': '19ff00',
    'a': '44ff00',
    'b': '70ff00',
    'c': '9bff00',
    'd': 'f2ff00',
    'e': 'ffe000',
    'f': 'ffb500',
    'g': 'ff8900',
    'h': 'ff5e00',
    'i': 'ff3200',
    'j': 'ff0700',
    'k': 'ff0023',
    'l': 'ff007a',
    'm': 'ff00a5',
    'n': 'ff00d1',
    'o': 'ff00fc',
    'p': 'd600ff',
    'q': 'aa00ff',
    'r': '7f00ff',
    's': '5500ff',
    't': '2a00ff',
    'u': '0000ff',
    'v': '2f4fdd',
    'w': '5a78e6',
    'y': '9fb4f0',
    'z': 'd0dbf8',
    'A': 'e8f0ff',
    'B': 'f6e9c8',
    'C': 'f0dba4',
    'D': 'e8cc80',
    'E': 'dfbc5e',
    'F': 'd4ab41',
    'G': 'c69a2c',
    'H': 'b58a20',
    'I': 'a17a1c',
    'J': '8c6b1b',
    'K': '785d1c',
    'L': '654f1d',
    'M': '54421d',
    'N': '44361c',
    'O': '352b19',
    'P': '282015',
    'Q': '1c1710'
};

/** Tile height of a heightmap character (0-9, a-z = 10-35, A-Z = 36-61), -1 for x / unknown. */
export const heightOfCharacter = (char: string): number =>
{
    if(!char || (char === 'x') || (char === 'X')) return -1;

    const code = char.charCodeAt(0);

    if((code >= 48) && (code <= 57)) return (code - 48);
    if((code >= 97) && (code <= 122)) return (10 + (code - 97));
    if((code >= 65) && (code <= 90)) return (36 + (code - 65));

    return -1;
}
