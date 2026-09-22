import { FC } from 'react';
import { Base } from './Base';
import { Flex, FlexProps } from './Flex';
import { Text } from './Text';

export interface HoloButtonProps extends FlexProps
{
    text?: string;
    variant?: string;
    iconClass?: string;
    disabled?: boolean;
}

// The reference's large icon+label action button (`.holo-button.<variant>`), used for window footers.
export const HoloButton: FC<HoloButtonProps> = props =>
{
    const { text = 'placeholder', variant = 'primary', iconClass = '', disabled = false, ...rest } = props;

    return (
        <Flex className={ `holo-button ${ variant } ${ disabled ? 'disabled' : '' }` } alignItems="center" gap={ 2 } { ...rest }>
            <Base className={ `icon ${ iconClass }` } />
            <Text>{ text }</Text>
        </Flex>
    );
}
