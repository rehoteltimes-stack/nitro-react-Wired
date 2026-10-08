import { GetNitroInstance } from '..';
import { GetCustomBadgeDescription, IsCustomBadge } from '../creator/CustomBadgeTexts';

export const LocalizeBadgeDescription = (key: string) =>
{
    let badgeDesc = GetNitroInstance().localization.getBadgeDesc(key);

    if(IsCustomBadge(key) && (!badgeDesc || badgeDesc.startsWith('badge_desc_'))) badgeDesc = GetCustomBadgeDescription(key);

    if(!badgeDesc || !badgeDesc.length) badgeDesc = `badge_desc_${ key }`;

    return badgeDesc;
}
