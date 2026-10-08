import { CSSProperties } from 'react';
import { GetConfiguration } from '../nitro';

export interface IUsernameIdentity
{
    staffColor: string;
    staffBackground: string;
    isVip: boolean;
}

// The profile username style of ltdws (ProfileHelpers.php: profile_rank_username_style + profile_vip_username_style): a staff rank shows in its
// colour with a soft glow of the same colour and, when the rank has one, a background gif (sparkles) behind the name; a VIP without a staff
// colour shows in gold. Everybody else keeps the normal text. Used by the profile card and the mention cards.
export const GetUsernameStyle = (identity: IUsernameIdentity): CSSProperties | undefined =>
{
    if(identity.staffColor)
    {
        const style: CSSProperties = { color: identity.staffColor, textShadow: `${ identity.staffColor } 1px 1px 10px` };

        if(identity.staffBackground) style.background = `transparent url("${ GetConfiguration<string>('asset.url') }/profile-icons/${ encodeURIComponent(identity.staffBackground) }")`;

        return style;
    }

    // A club VIP with no rank colour: the habbo.st client's ".vip" style (gold, with the premium gif behind it).
    if(identity.isVip) return { color: '#F1C40F', textShadow: '#F1C40F 1px 1px 10px', background: `transparent url("${ GetConfiguration<string>('asset.url') }/profile-icons/prem.gif")` };

    return undefined;
}
