import { FC, useMemo } from 'react';
import { Flex, FlexProps } from './Flex';
import { ButtonSizeType, ColorVariantType } from './types';

export interface ButtonProps extends FlexProps
{
    variant?: ColorVariantType;
    size?: ButtonSizeType;
    active?: boolean;
    disabled?: boolean;
    color?: string;
    customColor?: boolean;
    disableUpperCase?: boolean;
}

export const Button: FC<ButtonProps> = props =>
{
    const { variant = 'primary', size = 'sm', active = false, disabled = false, classNames = [], color = null, customColor = false, style = {}, disableUpperCase = false, ...rest } = props;

    // `custom-color` is the reference's opt-out from the variant palette: every `.btn:not(.custom-color).btn-<variant>`
    // rule only paints a background while that class is absent, so a caller-supplied colour (or a CSS-variable driven
    // one) must replace the variant class, not sit next to it.
    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'btn' ];

        if(variant && !color && !customColor) newClassNames.push('btn-' + variant);

        if(size) newClassNames.push('btn-' + size);

        if(active) newClassNames.push('active');

        if(disabled) newClassNames.push('disabled');

        if(color || customColor) newClassNames.push('custom-color');

        if(disableUpperCase) newClassNames.push('disable-upper-case');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ variant, size, active, disabled, color, customColor, disableUpperCase, classNames ]);

    return <Flex center classNames={ getClassNames } { ...rest } style={ { ...style, ...(color ? { backgroundColor: color } : {}) } } />;
}
