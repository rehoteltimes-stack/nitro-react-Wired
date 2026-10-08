import { FC } from 'react';
import { Base, Column, Flex, Text } from '../../common';

interface LoadingViewProps
{
    isError: boolean;
    message: string;
    percent: number;
    anim?: string;
}

export const LoadingView: FC<LoadingViewProps> = props =>
{
    const { isError = false, message = '', percent = 0, anim = '' } = props;

    return (
        <Column fullHeight position="fixed" className={ `nitro-loading ${ anim }` }>
            <Base fullHeight className="container h-100">
                <Column fullHeight alignItems="center" justifyContent="center">
                    <Base className="connecting-duck" />
                    <Column size={ 6 } className="text-center">
                        <Flex alignItems="center" justifyContent="center" gap={ 2 }>
                            <div className="percentage p-1 px-2">
                                { (isError && message) ?
                                    <Text variant="white" style={ { fontSize: '10px' } }>{ message }</Text>
                                    :
                                    <Text variant="white" className="fw-bold" style={ { fontSize: '11px' } }>({ percent.toFixed() }%)</Text> }
                            </div>
                        </Flex>
                    </Column>
                </Column>
            </Base>
        </Column>
    );
}
