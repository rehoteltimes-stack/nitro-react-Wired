import { FC, useMemo } from 'react';
import { Base, BaseProps } from './Base';
import { BitmapFontName, BitmapText } from './bitmap-text';
import { ColorVariantType, FontSizeType, FontWeightType, TextAlignType } from './types';

export interface TextProps extends BaseProps<HTMLDivElement>
{
    variant?: ColorVariantType;
    fontWeight?: FontWeightType;
    fontSize?: FontSizeType;
    align?: TextAlignType;
    bold?: boolean;
    underline?: boolean;
    lineThrough?: boolean;
    italics?: boolean;
    truncate?: boolean;
    center?: boolean;
    textEnd?: boolean;
    small?: boolean;
    xsmall?: boolean;
    wrap?: boolean;
    noWrap?: boolean;
    textBreak?: boolean;
    select?: string;
    textTransform?: string;
    whitespace?: string;
    bitmap?: boolean;
    bitmapFont?: BitmapFontName;
    bitmapScale?: number;
}

export const Text: FC<TextProps> = props =>
{
    const { variant = '', fontWeight = null, fontSize = 0, align = null, bold = false, underline = false, lineThrough = false, italics = false, truncate = false, center = false, textEnd = false, small = false, xsmall = false, wrap = false, noWrap = false, textBreak = false, select = '', textTransform = null, whitespace = null, bitmap = false, bitmapFont = null, bitmapScale = 1, children = null, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'd-inline', 'text-element' ];

        if(variant) newClassNames.push('text-' + variant);

        if(bold) newClassNames.push('fw-bold');

        if(fontWeight) newClassNames.push('fw-' + fontWeight);

        if(fontSize) newClassNames.push('fs-' + fontSize);

        if(align) newClassNames.push('text-' + align);

        if(underline) newClassNames.push('text-decoration-underline');

        if(lineThrough) newClassNames.push('text-decoration-line-through');

        if(italics) newClassNames.push('fst-italic');

        if(truncate) newClassNames.push('text-truncate');

        if(center) newClassNames.push('text-center');

        if(textEnd) newClassNames.push('text-end');

        if(small) newClassNames.push('small');

        if(xsmall) newClassNames.push('xsmall');

        if(wrap) newClassNames.push('text-wrap');

        if(noWrap) newClassNames.push('text-nowrap');

        if(textBreak) newClassNames.push('text-break');

        if(select) newClassNames.push('text-select-' + select);

        if(textTransform) newClassNames.push('text-transform-' + textTransform);

        if(whitespace) newClassNames.push('whitespace-' + whitespace);

        return newClassNames;
    }, [ variant, fontWeight, fontSize, align, bold, underline, lineThrough, italics, truncate, center, textEnd, small, xsmall, wrap, noWrap, textBreak, select, textTransform, whitespace ]);

    const canUseBitmap = (bitmap || !!bitmapFont) && ((typeof children === 'string') || (typeof children === 'number'));

    return (
        <Base tabIndex={ -1 } classNames={ getClassNames } { ...rest }>
            { canUseBitmap ? <BitmapText font={ bitmapFont || 'regular' } text={ children as string | number } scale={ bitmapScale } /> : children }
        </Base>
    );
}
