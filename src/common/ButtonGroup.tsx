import { FC, useMemo } from 'react';
import { Base, BaseProps } from './Base';

export interface ButtonGroupProps extends BaseProps<HTMLDivElement>
{
    vertical?: boolean;
}

export const ButtonGroup: FC<ButtonGroupProps> = props =>
{
    const { classNames = [], vertical = false, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ vertical ? 'btn-group-vertical' : 'btn-group' ];

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames, vertical ]);

    return <Base classNames={ getClassNames } { ...rest } />;
}
