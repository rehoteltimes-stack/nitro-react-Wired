// sodaho's own import/export lower-cases the map; that would turn A-Z heights (36-61) into a-z, so only X -> x here
export const ConvertTileMapToString = (map: string) => map.replace(/\r\n|\r|\n/g, '\n').replace(/X/g, 'x');
