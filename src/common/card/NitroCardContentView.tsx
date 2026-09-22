import { FC, useMemo } from 'react';
import { Column, ColumnProps } from '..';

export const NitroCardContentView: FC<ColumnProps> = props =>
{
    const { overflow = null, classNames = [], children = null, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'content-area' ];

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames ]);

    return (
        <Column classNames={ getClassNames } overflow={ overflow } { ...rest }>
            <Column grow className="content-area-inner">
                { children }
            </Column>
        </Column>
    );
}
