import { FriendlyTime, HabboClubLevelEnum } from '@nitrots/nitro-renderer';
import { FC, useMemo } from 'react';
import { CreateLinkEvent, GetConfiguration, LocalizeText } from '../../api';
import { usePurse } from '../../hooks';
import { CurrencyView } from './views/CurrencyView';

// HabboPie's purse, 1:1 (their component `aB0` in cdn.habbopie.biz/nitro/dist/assets/index-cc627c03.js, read in their
// running client at play.habbo.nz/pie.html, 2026-10-01). Same elements, same classes ("Habbopie" renamed "Habbo"),
// same order and the same links; CSS verbatim in PurseView.scss. Only the texts are English (theirs are Turkish:
// Yardım / Ayarlar), the credits row is not shown because this hotel has no credits (system.currency.types decides the
// rows), and their Income / Expenses and Hide wallet buttons are left out: the purse always shows (user, 2026-10-01).
export const PurseView: FC<{}> = props =>
{
    const { purse = null, hcDisabled = false, currencyMeta = new Map() } = usePurse();

    const displayedCurrencies = useMemo(() => GetConfiguration<number[]>('system.currency.types', []), []);
    const currencyDisplayNumberShort = useMemo(() => GetConfiguration<boolean>('currency.display.number.short', false), []);

    const clubText = useMemo(() =>
    {
        if(!purse) return null;

        const totalDays = ((purse.clubPeriods * 31) + purse.clubDays);
        const minutesUntilExpiration = purse.minutesUntilExpiration;

        if(purse.clubLevel === HabboClubLevelEnum.NO_CLUB) return LocalizeText('purse.clubdays.zero.amount.text');

        if((minutesUntilExpiration > -1) && (minutesUntilExpiration < (60 * 24))) return FriendlyTime.shortFormat(minutesUntilExpiration * 60);

        return FriendlyTime.shortFormat(totalDays * 86400);
    }, [ purse ]);

    if(!purse) return null;

    return (
        <div className="Habbo-right-side-purse d-none d-sm-block mt-2">
            <div className="d-flex flex-column animasyonlagizlenecekdiv">
                { displayedCurrencies.map(type =>
                {
                    const meta = currencyMeta.get(type);

                    return <CurrencyView key={ type } type={ type } amount={ purse.activityPoints?.get(type) ?? 0 } short={ currencyDisplayNumberShort } name={ meta?.pluralName || meta?.name || '' } color={ meta?.color } />;
                }) }
                { !hcDisabled &&
                    <div className="Habbo-right-side-purse-item icon-club" onClick={ event => CreateLinkEvent('habboUI/open/hccenter') }>
                        <div className="Habbo-right-side-purse-item-left-side">
                            <p className="Habbo-right-side-purse-item-text-type">Club</p>
                        </div>
                        <div className="Habbo-right-side-purse-item-right-side">
                            <p className="Habbo-right-side-purse-item-text">{ clubText }</p>
                        </div>
                        <div className="Habbo-right-side-purse-item-type-container">
                            <i className="Habbo-right-side-purse-item-type-container-icon" />
                        </div>
                    </div> }
                <div className="Habbo-right-side-purse-buttons" style={ { pointerEvents: 'all' } }>
                    <div className="Habbo-right-side-purse-buttons-item position-relative" onClick={ event => CreateLinkEvent('help/show') }>
                        Help
                        <div className="HabboHelp" />
                    </div>
                    <div className="Habbo-right-side-purse-buttons-item position-relative" onClick={ event => CreateLinkEvent('user-settings/toggle') }>
                        Settings
                        <div className="HabboSettings" />
                    </div>
                </div>
            </div>
        </div>
    );
}
