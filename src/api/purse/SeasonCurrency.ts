import { GetConfiguration } from '../nitro';

export const SEASON_CURRENCY_TYPE: number = 103;

const season = { plural: '', color: '' };

export const SetSeasonCurrency = (plural: string, color: string) =>
{
    season.plural = plural;
    season.color = color;
}

export const GetSeasonCurrencyName = () => (season.plural || 'Season currency');

export const GetSeasonCurrencyColor = () => (season.color || '#38bdf8');

export const GetCurrencyIconUrl = (type: number | string) =>
{
    const url = GetConfiguration<string>('currency.asset.icon.url', '');

    if((Number(type) === SEASON_CURRENCY_TYPE) && season.plural) return url.replace('%type%', `season/${ season.plural.toLowerCase().replace(/[^a-z0-9_-]/g, '') }`);

    return url.replace('%type%', type.toString());
}
