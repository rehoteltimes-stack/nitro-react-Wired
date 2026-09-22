import { FC, ReactNode, useState, WheelEvent } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { Column, ColumnProps } from './Column';
import { Flex } from './Flex';
import { Text } from './Text';

export interface PeekCarouselNavigateEvent
{
    direction: 'prev' | 'next';
    prevIndex: number;
    newIndex: number;
    index: number;
    element: ReactNode;
}

export interface PeekCarouselProps extends ColumnProps
{
    elements: ReactNode[];
    legend?: string;
    onNavigate?: (event: PeekCarouselNavigateEvent) => void;
}

// The reference's 3-up "peek" carousel (room-model picker): shows the previous/current/next element side by side,
// each a fixed slot, with left/right arrows and mouse-wheel navigation both driving the same index change.
export const PeekCarousel: FC<PeekCarouselProps> = props =>
{
    const { elements = [], legend = null, onNavigate = null, ...rest } = props;
    const [ index, setIndex ] = useState(0);

    if(elements.length === 0) return null;

    const navigate = (direction: 'prev' | 'next') =>
    {
        const prevIndex = index;
        const newIndex = (direction !== 'next') ? ((index - 1 + elements.length) % elements.length) : ((index + 1) % elements.length);

        setIndex(newIndex);

        if(onNavigate) onNavigate({ direction, prevIndex, newIndex, index: newIndex, element: elements[newIndex] });
    }

    const onWheel = (event: WheelEvent) =>
    {
        if(event.deltaY > 0) navigate('next');
        else if(event.deltaY < 0) navigate('prev');
    }

    return (
        <Column alignItems="center" onWheel={ onWheel } { ...rest }>
            <Flex alignItems="center" justifyContent="between" grow fullWidth>
                <div className="peek-carousel-item peek-carousel-prev">{ elements[(index - 1 + elements.length) % elements.length] }</div>
                <Column justifyContent="center" alignItems="center" className="peek-carousel-arrow peek-carousel-arrow-left">
                    <FaArrowLeft size={ 25 } onClick={ () => navigate('prev') } />
                </Column>
                <div className="peek-carousel-item peek-carousel-current">{ elements[index] }</div>
                <Column justifyContent="center" alignItems="center" className="peek-carousel-arrow peek-carousel-arrow-right">
                    <FaArrowRight size={ 25 } onClick={ () => navigate('next') } />
                </Column>
                <div className="peek-carousel-item peek-carousel-next">{ elements[(index + 1) % elements.length] }</div>
            </Flex>
            { legend && <Text className="peek-carousel-legend">{ legend }</Text> }
        </Column>
    );
}
