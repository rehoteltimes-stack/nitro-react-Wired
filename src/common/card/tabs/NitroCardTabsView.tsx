import { FC, useMemo } from 'react';
import { Flex, FlexProps } from '../..';

interface NitroCardTabsViewProps extends FlexProps
{
    small?: boolean;
}

export const NitroCardTabsView: FC<NitroCardTabsViewProps> = props =>
{
    const { justifyContent = 'between', gap = 1, classNames = [], children = null, small = false, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'nitro-card-tabs', 'pt-1' ];

        if(small) newClassNames.push('small');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames, small ]);

    return (
        <Flex shrink justifyContent={ justifyContent } gap={ gap } classNames={ getClassNames } { ...rest }>
            { children }
        </Flex>
    );
}
