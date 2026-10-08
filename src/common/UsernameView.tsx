import { FC, HTMLAttributes } from 'react';
import { GetUsernameStyle } from '../api';
import { ShopStyledName } from '../components/shop/ShopStyledName';
import { useUserIdentity } from '../hooks';

export interface UsernameViewProps extends HTMLAttributes<HTMLSpanElement>
{
    userId: number;
    name: string;
}

// A player's name wherever a name is shown: their Presence name tag and name decorations (a rank's colour and background
// gif are name items too, worn by default). Until those have loaded, the rank / VIP style.
export const UsernameView: FC<UsernameViewProps> = props =>
{
    const { userId = 0, name = '', style = {}, ...rest } = props;
    const identity = useUserIdentity(userId);

    return (
        <span { ...rest }>
            <ShopStyledName userId={ userId } name={ name } baseStyle={ { ...GetUsernameStyle(identity), ...style } } plainStyle={ style } />
        </span>
    );
}
