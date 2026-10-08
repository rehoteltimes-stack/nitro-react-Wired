import { GetTicker, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { GetRoomEngine, GetRoomObjectBounds, GetRoomSession } from '../../api';
import { IRanchAnimal } from '../../api/games/RanchProtocol';
import { RANCH_COLORS, RANCH_ICON_FOOD, RANCH_ICONS, RANCH_ORDER_COLORS, RanchCounterFx, RanchStripedBarFx } from './RanchFx';

const PHASE_HUNGRY = 0;
const PHASE_OPEN = 1;
const FURNI_GAP = 4;

export const RanchFurniAnchorView: FC<{ objectId: number, children: ReactNode }> = props =>
{
    const { objectId, children } = props;
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        const update = () =>
        {
            const session = GetRoomSession();
            const element = elementRef.current;

            if(!session || !element) return;

            const bounds = GetRoomObjectBounds(session.roomId, objectId, RoomObjectCategory.FLOOR, 1);

            if(!bounds || (bounds.width <= 0) || (bounds.height <= 0))
            {
                element.style.visibility = 'hidden';

                return;
            }

            const scale = GetRoomEngine().getRoomInstanceRenderingCanvasScale(session.roomId, 1) || 1;

            element.style.visibility = 'visible';
            element.style.left = `${ Math.round(bounds.left + (bounds.width / 2) - (element.offsetWidth / 2)) }px`;
            element.style.top = `${ Math.round(bounds.top - (FURNI_GAP * scale) - element.offsetHeight) }px`;
        }

        GetTicker().add(update);

        return () =>
        {
            GetTicker().remove(update);
        };
    }, [ objectId ]);

    return <div ref={ elementRef } className="nitro-ranch ranch-badge-anchor">{ children }</div>;
}

export const RanchAnimalsView: FC<{ animals: IRanchAnimal[] }> = props =>
{
    const { animals } = props;
    const [ now, setNow ] = useState(Date.now());

    useEffect(() =>
    {
        const interval = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            { animals.filter(animal => (animal.phase === PHASE_HUNGRY) || (animal.phase === PHASE_OPEN)).map(animal =>
                <RanchFurniAnchorView key={ animal.objectId } objectId={ animal.objectId }>
                    <div className="ranch-badge-stack is-animal">
                        { (animal.phase === PHASE_HUNGRY) && <>
                            <RanchStripedBarFx progress={ (animal.required - animal.remaining) / Math.max(1, animal.required) } color={ RANCH_COLORS.food } icon={ RANCH_ICON_FOOD } iconOffsetX={ 2 } iconOffsetY={ 0 } />
                            { RANCH_ICONS[animal.crop] && <RanchCounterFx icon={ RANCH_ICONS[animal.crop] } value={ animal.remaining } color={ RANCH_ORDER_COLORS[animal.crop] ?? RANCH_COLORS.white } /> }
                        </> }
                        { (animal.phase === PHASE_OPEN) &&
                            <RanchStripedBarFx progress={ Math.max(0, Math.min(1, (animal.endsAt - now) / Math.max(1, animal.duration * 1000))) } color={ RANCH_COLORS.timeleft } widthId={ 4 } /> }
                    </div>
                </RanchFurniAnchorView>) }
        </>
    );
}
