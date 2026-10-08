import { FC, useMemo } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { LocalizeFormattedNumber, LocalizeShortNumber } from '../../../api';
import { LayoutCurrencyIcon } from '../../../common';

interface CurrencyViewProps
{
    type: number;
    amount: number;
    short: boolean;
    name?: string;
    color?: string;
}

// HabboPie's purse row (their `_f`), 1:1: `.Habbo-right-side-purse-item icon-<type>` with the name, the amount and an
// empty icon box (its picture is a CSS background per type). With short numbers on, the full amount is a tooltip on
// the left. Their name is LocalizeText(`Habbopie.purse.<type>`); ours is the currency name our server sends.
export const CurrencyView: FC<CurrencyViewProps> = props =>
{
    const { type = -1, amount = -1, short = false, name = '', color = null } = props;

    // Ours on top of their layout (user, 2026-10-01: "add our icons and colors"): the text in the currency's own colour
    // from our server, and our wallet icon in the box (has-own-icon, see the own block at the end of PurseView.scss).
    const element = useMemo(() =>
    {
        return (
            <div className={ `Habbo-right-side-purse-item icon-${ type } has-own-icon` } style={ color ? ({ '--currency-color': color } as any) : undefined }>
                <div className="Habbo-right-side-purse-item-left-side">
                    <p className="Habbo-right-side-purse-item-text-type">{ name }</p>
                </div>
                <div className="Habbo-right-side-purse-item-right-side">
                    <p className="Habbo-right-side-purse-item-text-type">{ short ? LocalizeShortNumber(amount) : LocalizeFormattedNumber(amount) }</p>
                </div>
                <div className="Habbo-right-side-purse-item-type-container">
                    <LayoutCurrencyIcon type={ type } />
                </div>
            </div>);
    }, [ amount, short, type, name, color ]);

    if(!short) return element;

    return (
        <OverlayTrigger
            placement="left"
            overlay={
                <Tooltip id={ `tooltip-${ type }` }>
                    { LocalizeFormattedNumber(amount) }
                </Tooltip>
            }>
            { element }
        </OverlayTrigger>
    );
}
