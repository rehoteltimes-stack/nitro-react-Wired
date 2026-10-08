import { FC } from 'react';
import { GetConfiguration } from '../../api';
import { Base, BaseProps } from '../Base';

export interface UserProfileHouseIconViewProps extends BaseProps<HTMLDivElement>
{
    userName?: string;
}

// Real reference (G0 in the minified bundle): the small house icon in the user infostand's header,
// opening the member's website profile page (`${profile.url}/${userName}`) in a new tab.
export const UserProfileHouseIconView: FC<UserProfileHouseIconViewProps> = props =>
{
    const { userName = null, pointer = true, children = null, ...rest } = props;

    return (
        <Base className="icon icon-profile-house-cms" pointer={ pointer } onClick={ event => window.open(`${ GetConfiguration<string>('profile.url') }/${ userName }`, '_blank') } { ...rest }>
            { children }
        </Base>
    );
}
