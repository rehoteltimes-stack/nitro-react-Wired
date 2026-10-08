import { FC, ReactNode, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

export interface CollapsibleAreaProps
{
    header: ReactNode;
    defaultExpanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    className?: string;
}

// The reference client's collapsible section (its "dr" component): a header button with a chevron that turns over, and content that
// is only mounted while expanded. The .collapsible-* rules already live in the reference stylesheet.
export const CollapsibleArea: FC<CollapsibleAreaProps & { children?: ReactNode }> = props =>
{
    const { header = null, children = null, defaultExpanded = false, onExpandedChange = null, className = '' } = props;
    const [ expanded, setExpanded ] = useState(defaultExpanded);

    const toggle = () =>
    {
        const next = !expanded;

        setExpanded(next);

        if(onExpandedChange) onExpandedChange(next);
    }

    return (
        <div className={ `collapsible-area ${ className || '' } ${ expanded ? 'expanded' : '' }` }>
            <button className="collapsible-header" type="button" onClick={ toggle }>
                { header }
                <FaChevronDown className={ `collapsible-icon ${ expanded ? 'expanded' : '' }` } />
            </button>
            { expanded &&
                <div className={ `collapsible-content ${ expanded ? 'expanded' : '' }` }>
                    <div style={ { overflow: 'hidden' } }>
                        { children }
                    </div>
                </div> }
        </div>
    );
}
