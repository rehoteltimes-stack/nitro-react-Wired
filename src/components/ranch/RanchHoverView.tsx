import { FC, useEffect, useState } from 'react';
import { IRanchCropInfo, IRanchShopItem } from '../../api/games/RanchProtocol';
import { RanchFurniAnchorView } from './RanchAnimalsView';
import { RANCH_COLORS, RANCH_ICONS, RanchBlockBarFx, RanchCounterFx } from './RanchFx';

const GROWTH_START = 25;
const GROWTH_RANGE = 50;

export const RanchHoverView: FC<{ hovered: number[], shopItems: IRanchShopItem[], crops: IRanchCropInfo[] }> = props =>
{
    const { hovered, shopItems, crops } = props;
    const [ now, setNow ] = useState(Date.now());

    useEffect(() =>
    {
        if(!hovered.length) return;

        const interval = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(interval);
    }, [ hovered.length ]);

    return (
        <>
            { hovered.map(objectId =>
            {
                const shopItem = shopItems.find(item => item.objectId === objectId);

                if(shopItem) return (
                    <RanchFurniAnchorView key={ objectId } objectId={ objectId }>
                        <div className="ranch-badge-stack is-hover">
                            <RanchCounterFx icon={ (shopItem.currency === 'tokens') ? RANCH_ICONS.honor : RANCH_ICONS.gold } value={ shopItem.price } color={ (shopItem.currency === 'tokens') ? RANCH_COLORS.limeGreen : RANCH_COLORS.orange } alignment="right" />
                        </div>
                    </RanchFurniAnchorView>);

                const crop = crops.find(info => info.objectId === objectId);

                if(!crop || crop.ready || !RANCH_ICONS[crop.crop]) return null;

                const grown = Math.max(0, Math.min(1, (now - crop.plantedAt) / Math.max(1, crop.total * 1000)));
                const progress = (GROWTH_START + Math.floor(grown * GROWTH_RANGE)) / 100;

                return (
                    <RanchFurniAnchorView key={ objectId } objectId={ objectId }>
                        <div className="ranch-badge-stack is-hover">
                            <RanchBlockBarFx progress={ progress } color={ RANCH_COLORS.growth } />
                            <RanchCounterFx icon={ RANCH_ICONS[crop.crop] } value={ crop.yield } color={ RANCH_COLORS.white } />
                        </div>
                    </RanchFurniAnchorView>);
            }) }
        </>
    );
}
