import { FC } from 'react';

// The marks every Presence tile shows without clicking it: VIP / STAFF top right (the Auras card's VIP mark), and the
// player's own state bottom left: "In use" (green) or "Owned" (blue). Tiles need position: relative.
// label: text for the top-right mark instead of VIP / STAFF (the Auras cards show their tier), labelClass its colour.
export const ShopItemFlags: FC<{ owned?: boolean, active?: boolean, vip?: boolean, staff?: boolean, small?: boolean, label?: string, labelClass?: string, t: (key: string, fallback?: string) => string }> = props =>
{
    const { owned = false, active = false, vip = false, staff = false, small = false, label = null, labelClass = '', t } = props;
    const size = small ? ' is-small' : '';

    return (
        <>
            { label
                ? <span className={ `shop-aura-card-vip shop-item-flag ${ labelClass }${ size }` }>{ label }</span>
                : staff
                ? <span className={ `shop-aura-card-vip shop-item-flag is-staff${ size }` }>STAFF</span>
                : vip && <span className={ `shop-aura-card-vip shop-item-flag${ size }` }>VIP</span> }
            { (active || owned) &&
                <span className={ `shop-item-state${ active ? ' is-active' : '' }${ size }` }>{ active ? t('label.in_use', 'In use') : t('label.owned', 'Owned') }</span> }
        </>
    );
}
