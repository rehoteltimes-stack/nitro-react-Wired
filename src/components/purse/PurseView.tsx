import { FriendlyTime, HabboClubLevelEnum } from '@nitrots/nitro-renderer';
import { FC, useMemo } from 'react';
import { CreateLinkEvent, GetConfiguration, LocalizeText } from '../../api';
import { Column, Flex, LayoutCurrencyIcon, Text } from '../../common';
import { usePurse } from '../../hooks';
import { CurrencyView } from './views/CurrencyView';

export const PurseView: FC<{}> = props =>
{
    const { purse = null, hcDisabled = false } = usePurse();

    const displayedCurrencies = useMemo(() => GetConfiguration<number[]>('system.currency.types', []), []);
    const currencyDisplayNumberShort = useMemo(() => GetConfiguration<boolean>('currency.display.number.short', false), []);

    const getClubText = (() =>
    {
        if(!purse) return null;

        const totalDays = ((purse.clubPeriods * 31) + purse.clubDays);
        const minutesUntilExpiration = purse.minutesUntilExpiration;

        if(purse.clubLevel === HabboClubLevelEnum.NO_CLUB) return LocalizeText('purse.clubdays.zero.amount.text');

        else if((minutesUntilExpiration > -1) && (minutesUntilExpiration < (60 * 24))) return FriendlyTime.shortFormat(minutesUntilExpiration * 60);

        else return FriendlyTime.shortFormat(totalDays * 86400);
    })();

    const activityPointTypes = useMemo(() =>
    {
        if(!purse || !purse.activityPoints) return [];

        return Array.from(purse.activityPoints.keys()).filter(type => (displayedCurrencies.indexOf(type) >= 0));
    }, [ purse, displayedCurrencies ]);

    if(!purse) return null;

    return (
        <Column alignItems="end" className="nitro-purse-container" gap={ 1 }>
            <Flex className="nitro-purse" gap={ 2 }>
                <Column className="nitro-purse-list" justifyContent="center" gap={ 0 }>
                    <CurrencyView type={ -1 } amount={ purse.credits } short={ currencyDisplayNumberShort } />
                    { activityPointTypes.map(type => <CurrencyView key={ type } type={ type } amount={ purse.activityPoints.get(type) } short={ currencyDisplayNumberShort } />) }
                </Column>
                { !hcDisabled &&
                    <Column center pointer size={ 4 } gap={ 1 } className="nitro-purse-subscription rounded" onClick={ event => CreateLinkEvent('habboUI/open/hccenter') }>
                        <LayoutCurrencyIcon type="hc" />
                        <Text variant="white">{ getClubText }</Text>
                    </Column> }
                <Column justifyContent="center" gap={ 2 } className="nitro-purse-buttons">
                    <Flex center pointer className="nitro-purse-button" onClick={ event => CreateLinkEvent('help/show') }>
                        <i className="icon icon-help" />
                    </Flex>
                    <Flex center pointer className="nitro-purse-button" onClick={ event => CreateLinkEvent('user-settings/toggle') }>
                        <i className="icon icon-cog-purse" />
                    </Flex>
                </Column>
            </Flex>
        </Column>
    );
}
