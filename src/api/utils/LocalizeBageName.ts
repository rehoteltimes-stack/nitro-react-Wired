import { GetNitroInstance } from '..';
import { GetCustomBadgeName, IsCustomBadge } from '../creator/CustomBadgeTexts';

export const LocalizeBadgeName = (key: string) =>
{
    let badgeName = GetNitroInstance().localization.getBadgeName(key);

    if(IsCustomBadge(key) && (!badgeName || badgeName.startsWith('badge_name_'))) badgeName = GetCustomBadgeName(key);

    if(!badgeName || !badgeName.length) badgeName = `badge_name_${ key }`;

    return badgeName;
}
