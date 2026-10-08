import { FC, ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './LeftPanelStack.scss';

const LEFT_PANEL_STACK_ID = 'left-panel-stack';

export const LeftPanelStackView: FC<{}> = props => <div id={ LEFT_PANEL_STACK_ID } className="left-panel-stack" />;

export const LeftPanelPortal: FC<{ children: ReactNode }> = props =>
{
    const [ slot, setSlot ] = useState<HTMLElement>(null);

    useEffect(() => setSlot(document.getElementById(LEFT_PANEL_STACK_ID)), []);

    if(!slot) return null;

    return createPortal(props.children, slot);
}
