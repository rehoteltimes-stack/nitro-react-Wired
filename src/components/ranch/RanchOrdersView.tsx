import { FC, useEffect, useState } from 'react';
import { IRanchOrder } from '../../api/games/RanchProtocol';
import { RANCH_COLORS, RANCH_ICONS, RANCH_ORDER_COLORS, RanchCounterFx, RanchStripedBarFx } from './RanchFx';
import { RanchAnchorView } from './RanchPlayersView';

const ORDER_STACK = [ 'corn', 'duckbergine', 'pumpkin', 'grapes', 'tomato' ];

export const RanchOrdersView: FC<{ orders: IRanchOrder[] }> = props =>
{
    const { orders } = props;
    const [ now, setNow ] = useState(Date.now());

    useEffect(() =>
    {
        const interval = setInterval(() => setNow(Date.now()), 630);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            { orders.map(order =>
            {
                const progress = Math.max(0, Math.min(1, (order.endsAt - now) / Math.max(1, order.duration * 1000)));

                return (
                    <RanchAnchorView key={ order.roomIndex } roomIndex={ order.roomIndex }>
                        <div className="ranch-badge-stack is-order">
                            { ORDER_STACK.filter(crop => order.crops[crop] > 0 && RANCH_ICONS[crop]).map(crop =>
                                <RanchCounterFx key={ crop } icon={ RANCH_ICONS[crop] } value={ order.crops[crop] } color={ RANCH_ORDER_COLORS[crop] } />) }
                            <RanchCounterFx icon={ RANCH_ICONS.gold } value={ order.reward } color={ RANCH_COLORS.gold } alignment="double" />
                            <RanchStripedBarFx progress={ progress } color={ RANCH_COLORS.timeleft } />
                        </div>
                    </RanchAnchorView>
                );
            }) }
        </>
    );
}
