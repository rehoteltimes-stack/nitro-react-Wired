import { cloneElement, FC, MouseEvent, ReactElement, useMemo } from 'react';
import { FaFlag, FaTimes } from 'react-icons/fa';
import { Column, ColumnProps, Flex } from '..';

export interface NitroCardHeaderButton
{
    iconElement: ReactElement;
    onClick: (event: MouseEvent) => void;
}

interface NitroCardHeaderViewProps extends ColumnProps
{
    headerText: string;
    isGalleryPhoto?: boolean;
    noCloseButton?: boolean;
    buttonList?: NitroCardHeaderButton[];
    onReportPhoto?: (event: MouseEvent) => void;
    onCloseClick: (event: MouseEvent) => void;
}

export const NitroCardHeaderView: FC<NitroCardHeaderViewProps> = props =>
{
    const { headerText = '', isGalleryPhoto = false, noCloseButton = false, buttonList = [], onReportPhoto = null, onCloseClick = null, justifyContent = 'center', alignItems = 'center', classNames = [], children = null, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'drag-handler', 'nitro-card-header' ];

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames ]);

    // the header is the drag handle: its buttons must not start a drag
    const onMouseDown = (event: MouseEvent<HTMLDivElement>) =>
    {
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
    }

    return (
        <Column center position="relative" classNames={ getClassNames } { ...rest }>
            <Flex className="nitro-card-header-content" justifyContent="between" alignItems="center">
                <span className="nitro-card-header-text">{ headerText }</span>
                <Flex center className="end-2" gap={ 1 } alignSelf="center">
                    { buttonList && buttonList.map((button, index) =>
                        <Flex center key={ index } className="nitro-card-header-button" onMouseDownCapture={ onMouseDown } onClick={ button.onClick }>
                            { cloneElement(button.iconElement, { className: `${ button.iconElement.props.className || '' } fa-icon w-12 h-12`.trim() }) }
                        </Flex>) }
                    { isGalleryPhoto &&
                        <Flex className="nitro-card-header-button" onClick={ onReportPhoto }>
                            <FaFlag className="fa-icon w-12 h-12" />
                        </Flex> }
                    { !noCloseButton &&
                        <Flex center className="nitro-card-header-button" onMouseDownCapture={ onMouseDown } onClick={ onCloseClick }>
                            <FaTimes className="fa-icon w-12 h-12" />
                        </Flex> }
                </Flex>
            </Flex>
        </Column>
    );
}
