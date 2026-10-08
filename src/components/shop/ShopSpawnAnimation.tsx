import { CSSProperties, FC, useEffect, useState } from 'react';
import { IShopSpawnVisual, SpawnFrameUrl } from '../../api/shop/ShopProtocol';

const preloaded = new Set<string>();

/** Loads every frame of a spawn once, so the animation never flickers while images arrive. */
export const PreloadSpawn = (pattern: string, spawn: IShopSpawnVisual): Promise<void> =>
{
    const key = pattern + '|' + spawn.folder;

    if(preloaded.has(key)) return Promise.resolve();

    return Promise.all(Array.from({ length: spawn.frameCount }, (_, index) => new Promise<void>(resolve =>
    {
        const image = new Image();

        image.onload = () => resolve();
        image.onerror = () => resolve();
        image.src = SpawnFrameUrl(pattern, spawn, index);
    }))).then(() => { preloaded.add(key); });
}

/** Plays a spawn's frames once (from frame 0), then calls onDone; replayKey restarts it. */
export const ShopSpawnAnimation: FC<{ pattern: string, spawn: IShopSpawnVisual, replayKey?: number, className?: string, style?: CSSProperties, onDone?: () => void }> = props =>
{
    const { pattern, spawn, replayKey = 0, className = '', style = {}, onDone = null } = props;
    const [ frame, setFrame ] = useState<number>(-1);

    useEffect(() =>
    {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> = null;

        setFrame(-1);

        PreloadSpawn(pattern, spawn).then(() =>
        {
            let index = 0;

            const next = () =>
            {
                if(cancelled) return;

                if(index >= spawn.frameCount)
                {
                    setFrame(-1);
                    if(onDone) onDone();
                    return;
                }

                setFrame(index++);
                timer = setTimeout(next, spawn.frameMs);
            }

            next();
        });

        return () => { cancelled = true; if(timer) clearTimeout(timer); };
    }, [ pattern, spawn?.id, replayKey ]);

    if(!spawn || (frame < 0)) return null;

    return <img className={ className } src={ SpawnFrameUrl(pattern, spawn, frame) } alt="" aria-hidden="true" draggable={ false }
        style={ { width: spawn.frameWidth * spawn.scale, height: spawn.frameHeight * spawn.scale, ...style } } />;
}
