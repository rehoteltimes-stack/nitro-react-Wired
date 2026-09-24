import { FC, useMemo } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { LocalizeFormattedNumber, LocalizeShortNumber } from '../../../api';
import { Flex, LayoutCurrencyIcon, Text } from '../../../common';

interface CurrencyViewProps
{
    type: number;
    amount: number;
    short: boolean;
    color?: string;
}

export const CurrencyView: FC<CurrencyViewProps> = props =>
{
    const { type = -1, amount = -1, short = false, color = null } = props;

    // Real reference behavior, confirmed live: each currency's own amount text carries a real
    // per-currency `--holo-text-primary` CSS variable (see PurseCurrencyColorProtocol.ts's own
    // comment for where this value comes from - a new, additive server protocol, since the stock
    // wire format has no color field at all).
    const element = useMemo(() =>
    {
        return (
            <Flex alignItems="center" justifyContent="end" pointer gap={ 1 } className="nitro-purse-button currency rounded">
                <LayoutCurrencyIcon type={ type } />
                <Text fontSize={ 5 } truncate textEnd grow style={ color ? ({ '--holo-text-primary': color } as any) : undefined }>{ short ? LocalizeShortNumber(amount) : LocalizeFormattedNumber(amount) }</Text>
            </Flex>);
    }, [ amount, short, type, color ]);

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
