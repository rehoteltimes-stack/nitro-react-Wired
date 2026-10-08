import { GetAssetManager, IGraphicAssetCollection } from '@nitrots/nitro-renderer';
import { ActionSettings } from './ActionSettings';
import { COLORMAP, FloorAction, HEIGHT_SCHEME, MAX_NUM_TILE_PER_AXIS, TILE_SIZE, X_HEIGHT_INDEX } from './Constants';
import { Tile } from './Tile';
import { getScreenPositionForTile } from './Utils';

interface ISnapshot
{
    tilemap: Tile[][];
    doorLocation: { x: number, y: number };
    width: number;
    height: number;
}

interface ITileSprite
{
    source: CanvasImageSource;
    x: number;
    y: number;
    w: number;
    h: number;
}

// 1:1 port of sodaho.tel's floor editor core (their minified class `Ya`, read 2026-09-29): a plain 2D canvas (not
// Pixi), pointer painting with hit testing per tile diamond, a drag-a-rectangle "square select", undo / redo (20 steps,
// one step per stroke) and applyToTile / applyToArea for painting straight on the room (FloorplanRoomPainter).
// Tile pictures come from our own floor_editor asset (floor_editor_<height>, r_door, r_blocked); heights without a
// picture are drawn as a coloured diamond (their drawTileFromColor, colours = COLORMAP).
export class FloorplanEditor
{
    private static _INSTANCE: FloorplanEditor = null;

    public static readonly TILE_BLOCKED = 'r_blocked';
    public static readonly TILE_DOOR = 'r_door';
    public static readonly MAX_UNDO_STEPS = 20;

    private _renderer: CanvasRenderingContext2D;
    private _tilemap: Tile[][] = [];
    private _doorLocation: { x: number, y: number } = { x: 0, y: 0 };
    private _width: number = 0;
    private _height: number = 0;
    private _isPointerDown: boolean = false;
    private _lastUsedTile: { x: number, y: number } = { x: -1, y: -1 };
    private _actionSettings: ActionSettings = new ActionSettings();
    private _isSquareSelectMode: boolean = false;
    private _squareSelectStart: { x: number, y: number } = null;
    private _squareSelectEnd: { x: number, y: number } = null;
    private _undoStack: ISnapshot[] = [];
    private _redoStack: ISnapshot[] = [];
    private _pendingSnapshot: ISnapshot = null;
    private _sprites: Map<string, ITileSprite> = null;

    public onTilemapChange: () => void = null;

    constructor()
    {
        const canvas = document.createElement('canvas');

        canvas.width = (TILE_SIZE * MAX_NUM_TILE_PER_AXIS) + 20;
        canvas.height = ((TILE_SIZE * MAX_NUM_TILE_PER_AXIS) / 2) + 100;
        canvas.style.touchAction = 'none';

        this._renderer = canvas.getContext('2d');
    }

    public onPointerRelease(event: PointerEvent = null): void
    {
        if(this._isSquareSelectMode && this._isPointerDown && this._squareSelectStart)
        {
            if(event)
            {
                const tile = this.getTileAtPosition({ x: event.offsetX, y: event.offsetY });

                if(tile) this._squareSelectEnd = tile;
            }

            if(this._squareSelectEnd) this.fillSquareSelection();
        }

        this._isPointerDown = false;
        this._squareSelectStart = null;
        this._squareSelectEnd = null;
    }

    public onPointerDown(event: PointerEvent): void
    {
        if(event.button === 2) return;

        const position = { x: event.offsetX, y: event.offsetY };

        this.beginStroke();
        this._isPointerDown = true;

        if(this._isSquareSelectMode)
        {
            const tile = this.getTileAtPosition(position);

            this._squareSelectStart = tile;
            this._squareSelectEnd = tile;
            this.renderTiles();

            return;
        }

        this.tileHitDetection(position, true);
    }

    public onPointerMove(event: PointerEvent): void
    {
        if(!this._isPointerDown) return;

        const position = { x: event.offsetX, y: event.offsetY };

        if(this._isSquareSelectMode)
        {
            const tile = this.getTileAtPosition(position);

            if(tile)
            {
                this._squareSelectEnd = tile;
                this.renderTiles();
            }

            return;
        }

        this.tileHitDetection(position, false);
    }

    private isInsideTile(position: { x: number, y: number }, x: number, y: number): boolean
    {
        const width = TILE_SIZE;
        const height = (TILE_SIZE / 2);
        const [ startX, startY ] = getScreenPositionForTile(x, y);
        const dx = Math.abs(Math.floor(position.x) - (startX + (width / 2)));
        const dy = Math.abs(Math.floor(position.y) - (startY + (height / 2)));

        return ((dx / (width * 0.5)) + (dy / (height * 0.5)) <= 1);
    }

    private getTileAtPosition(position: { x: number, y: number }): { x: number, y: number }
    {
        for(let y = 0; y < this._tilemap.length; y++)
        {
            for(let x = 0; x < this._tilemap[y].length; x++)
            {
                if(this.isInsideTile(position, x, y)) return { x, y };
            }
        }

        return null;
    }

    private fillSquareSelection(): void
    {
        const minX = Math.min(this._squareSelectStart.x, this._squareSelectEnd.x);
        const maxX = Math.max(this._squareSelectStart.x, this._squareSelectEnd.x);
        const minY = Math.min(this._squareSelectStart.y, this._squareSelectEnd.y);
        const maxY = Math.max(this._squareSelectStart.y, this._squareSelectEnd.y);

        for(let y = minY; y <= maxY; y++)
        {
            for(let x = minX; x <= maxX; x++) this.onClick(x, y, false);
        }

        this.renderTiles();
    }

    private tileHitDetection(position: { x: number, y: number }, isFirst: boolean = false): boolean
    {
        for(let y = 0; y < this._tilemap.length; y++)
        {
            for(let x = 0; x < this._tilemap[y].length; x++)
            {
                if(!this.isInsideTile(position, x, y)) continue;

                if(this._isPointerDown)
                {
                    if(isFirst) this.onClick(x, y);

                    else if((this._lastUsedTile.x !== x) || (this._lastUsedTile.y !== y))
                    {
                        this._lastUsedTile.x = x;
                        this._lastUsedTile.y = y;
                        this.onClick(x, y);
                    }
                }

                return true;
            }
        }

        return false;
    }

    public applyToTile(x: number, y: number): void
    {
        this.onClick(x, y);
    }

    public applyToArea(startX: number, startY: number, endX: number, endY: number): void
    {
        this.beginStroke();

        for(let y = startY; y <= endY; y++)
        {
            for(let x = startX; x <= endX; x++) this.onClick(x, y, false);
        }

        this.renderTiles();
    }

    public beginStroke(): void
    {
        this._pendingSnapshot = this.createSnapshot();
    }

    private createSnapshot(): ISnapshot
    {
        return {
            tilemap: this._tilemap.map(row => row.map(tile => new Tile(tile.height, tile.isBlocked))),
            doorLocation: { x: this._doorLocation.x, y: this._doorLocation.y },
            width: this._width,
            height: this._height
        };
    }

    // the snapshot taken when the stroke began goes on the undo stack the first time the stroke really changes a tile
    private commitPendingSnapshot(): void
    {
        if(!this._pendingSnapshot) return;

        this._undoStack.push(this._pendingSnapshot);
        this._pendingSnapshot = null;
        this._redoStack = [];

        if(this._undoStack.length > FloorplanEditor.MAX_UNDO_STEPS) this._undoStack.shift();
    }

    public undo(): boolean
    {
        const snapshot = this._undoStack.pop();

        if(!snapshot) return false;

        this._redoStack.push(this.createSnapshot());

        if(this._redoStack.length > FloorplanEditor.MAX_UNDO_STEPS) this._redoStack.shift();

        this._pendingSnapshot = null;
        this.applySnapshot(snapshot);

        return true;
    }

    public redo(): boolean
    {
        const snapshot = this._redoStack.pop();

        if(!snapshot) return false;

        this._undoStack.push(this.createSnapshot());

        if(this._undoStack.length > FloorplanEditor.MAX_UNDO_STEPS) this._undoStack.shift();

        this._pendingSnapshot = null;
        this.applySnapshot(snapshot);

        return true;
    }

    private applySnapshot(snapshot: ISnapshot): void
    {
        this._tilemap = snapshot.tilemap;
        this._doorLocation = snapshot.doorLocation;
        this._width = snapshot.width;
        this._height = snapshot.height;

        this.renderTiles();
    }

    public get canUndo(): boolean
    {
        return (this._undoStack.length > 0);
    }

    public get canRedo(): boolean
    {
        return (this._redoStack.length > 0);
    }

    private onClick(x: number, y: number, render: boolean = true): void
    {
        if(this._actionSettings.currentAction === FloorAction.NONE) return;

        const tile = (this._tilemap[y] && this._tilemap[y][x]);

        if(!tile) return;

        const heightIndex = HEIGHT_SCHEME.indexOf(tile.height);
        let futureHeightIndex = 0;

        switch(this._actionSettings.currentAction)
        {
            case FloorAction.DOOR:
                if(tile.height !== 'x')
                {
                    if((this._doorLocation.x === x) && (this._doorLocation.y === y)) return;

                    this.commitPendingSnapshot();
                    this._doorLocation.x = x;
                    this._doorLocation.y = y;

                    if(render) this.renderTiles();
                }
                return;
            case FloorAction.UP:
                if(tile.height === 'x') return;
                futureHeightIndex = (heightIndex + 1);
                if(futureHeightIndex === X_HEIGHT_INDEX) futureHeightIndex++;
                if(futureHeightIndex >= HEIGHT_SCHEME.length) return;
                break;
            case FloorAction.DOWN:
                if((tile.height === 'x') || (heightIndex <= 1)) return;
                futureHeightIndex = (heightIndex - 1);
                if(futureHeightIndex === X_HEIGHT_INDEX) futureHeightIndex--;
                break;
            case FloorAction.SET:
                futureHeightIndex = HEIGHT_SCHEME.indexOf(this._actionSettings.currentHeight);
                break;
            case FloorAction.UNSET:
                futureHeightIndex = 0;
                break;
        }

        if((futureHeightIndex === -1) || (heightIndex === futureHeightIndex)) return;

        if(futureHeightIndex > 0)
        {
            if((x + 1) > this._width) this._width = (x + 1);
            if((y + 1) > this._height) this._height = (y + 1);
        }

        const newHeight = HEIGHT_SCHEME[futureHeightIndex];

        if(!newHeight) return;

        this.commitPendingSnapshot();
        tile.isBlocked = false;
        tile.height = newHeight;

        if(render) this.renderTiles();
    }

    private loadSprites(): void
    {
        if(this._sprites) return;

        const collection: IGraphicAssetCollection = GetAssetManager().getCollection('floor_editor');

        if(!collection) return;

        const sprites = new Map<string, ITileSprite>();

        for(const name of [ ...HEIGHT_SCHEME.split(''), FloorplanEditor.TILE_DOOR, FloorplanEditor.TILE_BLOCKED ])
        {
            const texture = collection.getTexture(`floor_editor_${ name }`);
            const source = texture && (texture.baseTexture?.resource as any)?.source;

            if(!texture || !source) continue;

            sprites.set(name, { source, x: texture.frame.x, y: texture.frame.y, w: texture.frame.width, h: texture.frame.height });
        }

        if(sprites.size) this._sprites = sprites;
    }

    public renderTiles(): void
    {
        this.loadSprites();
        this.clearCanvas();

        for(let y = 0; y < this._tilemap.length; y++)
        {
            for(let x = 0; x < this._tilemap[y].length; x++)
            {
                const tile = this._tilemap[y][x];
                let name = tile.height;

                if((this._doorLocation.x === x) && (this._doorLocation.y === y)) name = FloorplanEditor.TILE_DOOR;
                if(tile.isBlocked) name = FloorplanEditor.TILE_BLOCKED;

                const [ positionX, positionY ] = getScreenPositionForTile(x, y);
                const sprite = this._sprites && this._sprites.get(name);

                if(sprite) this._renderer.drawImage(sprite.source, sprite.x, sprite.y, sprite.w, sprite.h, positionX, positionY, sprite.w, sprite.h);
                else this.drawTileFromColor(name, positionX, positionY);
            }
        }

        this.renderSquareSelectionPreview();

        if(this.onTilemapChange) this.onTilemapChange();
    }

    private drawTileFromColor(name: string, x: number, y: number): void
    {
        const color = COLORMAP[name] || '101010';
        const context = this._renderer;

        context.beginPath();
        context.moveTo(x + 1, y + 9);
        context.lineTo(x + 17, y + 1);
        context.lineTo(x + 33, y + 9);
        context.lineTo(x + 17, y + 17);
        context.closePath();
        context.fillStyle = `#${ color }`;
        context.fill();
        context.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        context.lineWidth = 1;
        context.stroke();
    }

    private renderSquareSelectionPreview(): void
    {
        if(!this._isSquareSelectMode || !this._isPointerDown || !this._squareSelectStart || !this._squareSelectEnd) return;

        const minX = Math.min(this._squareSelectStart.x, this._squareSelectEnd.x);
        const maxX = Math.max(this._squareSelectStart.x, this._squareSelectEnd.x);
        const minY = Math.min(this._squareSelectStart.y, this._squareSelectEnd.y);
        const maxY = Math.max(this._squareSelectStart.y, this._squareSelectEnd.y);
        const width = TILE_SIZE;
        const height = (TILE_SIZE / 2);
        const context = this._renderer;

        context.save();

        for(let y = minY; y <= maxY; y++)
        {
            for(let x = minX; x <= maxX; x++)
            {
                if(!(this._tilemap[y] && this._tilemap[y][x])) continue;

                const [ startX, startY ] = getScreenPositionForTile(x, y);
                const centerX = (startX + (width / 2));
                const centerY = (startY + (height / 2));

                context.beginPath();
                context.moveTo(centerX, startY);
                context.lineTo(startX + width, centerY);
                context.lineTo(centerX, startY + height);
                context.lineTo(startX, centerY);
                context.closePath();
                context.fillStyle = 'rgba(255, 255, 255, 0.25)';
                context.fill();
                context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                context.lineWidth = 1;
                context.stroke();
            }
        }

        context.restore();
    }

    public setTilemap(map: string, blockedTiles: boolean[][]): void
    {
        this._tilemap = [];
        this._undoStack = [];
        this._redoStack = [];
        this._pendingSnapshot = null;

        const rows = map.split('\r');
        let width = 0;
        let height = rows.length;

        for(let y = 0; y < height; y++)
        {
            if(rows[y].length === 0)
            {
                rows.splice(y, 1);
                height = rows.length;
                y--;
                continue;
            }

            if(rows[y].length > width) width = rows[y].length;
        }

        for(let y = 0; y < height; y++)
        {
            this._tilemap[y] = [];

            const row = rows[y];

            for(let x = 0; x < width; x++)
            {
                const blocked = (blockedTiles && blockedTiles[y] && blockedTiles[y][x]) || false;
                const char = row[x];

                this._tilemap[y][x] = ((char !== 'x') && (char !== 'X') && char) ? new Tile(char, blocked) : new Tile('x', blocked);
            }

            for(let x = width; x < MAX_NUM_TILE_PER_AXIS; x++) this._tilemap[y][x] = new Tile('x', false);
        }

        for(let y = height; y < MAX_NUM_TILE_PER_AXIS; y++)
        {
            if(!this._tilemap[y]) this._tilemap[y] = [];

            for(let x = 0; x < MAX_NUM_TILE_PER_AXIS; x++) this._tilemap[y][x] = new Tile('x', false);
        }

        this._width = width;
        this._height = height;
    }

    public getCurrentTilemapString(): string
    {
        const highestTile = (this._tilemap[this._height - 1] && this._tilemap[this._height - 1][this._width - 1]);

        if(!highestTile || (highestTile.height === 'x'))
        {
            this._width = -1;
            this._height = -1;

            for(let y = MAX_NUM_TILE_PER_AXIS - 1; y >= 0; y--)
            {
                if(!this._tilemap[y]) continue;

                for(let x = MAX_NUM_TILE_PER_AXIS - 1; x >= 0; x--)
                {
                    if(!this._tilemap[y][x]) continue;

                    if(this._tilemap[y][x].height !== 'x')
                    {
                        if((x + 1) > this._width) this._width = (x + 1);
                        if((y + 1) > this._height) this._height = (y + 1);
                    }
                }
            }
        }

        const rows: string[] = [];

        for(let y = 0; y < this._height; y++)
        {
            const row: string[] = [];

            for(let x = 0; x < this._width; x++) row[x] = this._tilemap[y][x].height;

            rows[y] = row.join('');
        }

        return rows.join('\r');
    }

    public clear(): void
    {
        this._tilemap = [];
        this._undoStack = [];
        this._redoStack = [];
        this._pendingSnapshot = null;
        this._doorLocation = { x: -1, y: -1 };
        this._width = 0;
        this._height = 0;
        this._isPointerDown = false;
        this._lastUsedTile = { x: -1, y: -1 };
        this._actionSettings.clear();
        this._isSquareSelectMode = false;
        this._squareSelectStart = null;
        this._squareSelectEnd = null;
        this.clearCanvas();
    }

    // "select all" fills every tile with the chosen height; with the remove tool chosen it removes every tile instead
    public toggleSelectAll(): void
    {
        this.beginStroke();
        this.commitPendingSnapshot();

        const remove = (this._actionSettings.currentAction === FloorAction.UNSET);

        for(let y = 0; y < this._tilemap.length; y++)
        {
            for(let x = 0; x < this._tilemap[y].length; x++)
            {
                const tile = this._tilemap[y][x];

                if(!tile) continue;

                tile.isBlocked = false;
                tile.height = remove ? 'x' : this._actionSettings.currentHeight;
            }
        }

        this.renderTiles();
    }

    public toggleSquareSelectMode(): boolean
    {
        this._isSquareSelectMode = !this._isSquareSelectMode;
        this._squareSelectStart = null;
        this._squareSelectEnd = null;

        return this._isSquareSelectMode;
    }

    public get isSquareSelectMode(): boolean
    {
        return this._isSquareSelectMode;
    }

    private clearCanvas(): void
    {
        this._renderer.fillStyle = '#000000';
        this._renderer.fillRect(0, 0, this._renderer.canvas.width, this._renderer.canvas.height);
    }

    public get renderer(): CanvasRenderingContext2D
    {
        return this._renderer;
    }

    public get tilemap(): Tile[][]
    {
        return this._tilemap;
    }

    public get doorLocation(): { x: number, y: number }
    {
        return this._doorLocation;
    }

    public set doorLocation(value: { x: number, y: number })
    {
        this._doorLocation = value;
    }

    public get actionSettings(): ActionSettings
    {
        return this._actionSettings;
    }

    public static get instance(): FloorplanEditor
    {
        if(!FloorplanEditor._INSTANCE) FloorplanEditor._INSTANCE = new FloorplanEditor();

        return FloorplanEditor._INSTANCE;
    }
}
