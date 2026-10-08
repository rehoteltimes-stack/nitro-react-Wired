import { Dispatch, FC, SetStateAction, useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { GroupBadgePart } from '../../../api';
import { Base, Column, Flex, Grid, LayoutBadgeImageView, ScrollContainer } from '../../../common';
import { useGroup } from '../../../hooks';

interface GroupBadgeCreatorViewProps
{
    badgeParts: GroupBadgePart[];
    setBadgeParts: Dispatch<SetStateAction<GroupBadgePart[]>>;
}

const POSITIONS: number[] = [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ];

export const GroupBadgeCreatorView: FC<GroupBadgeCreatorViewProps> = props =>
{
    const { badgeParts = [], setBadgeParts = null } = props;
    const [ selectedIndex, setSelectedIndex ] = useState<number>(-1);
    const { groupCustomize = null } = useGroup();

    const setPartProperty = (partIndex: number, property: string, value: number) =>
    {
        const newBadgeParts = [ ...badgeParts ];

        newBadgeParts[partIndex][property] = value;

        setBadgeParts(newBadgeParts);

        if(property === 'key') setSelectedIndex(-1);
    }

    if(!badgeParts || !badgeParts.length) return null;

    return (
        <ScrollContainer>
            <Column overflow="hidden" gap={ 1 }>
                { (selectedIndex < 0) && badgeParts.map((part, index) =>
                    <Flex key={ index } alignItems="center" justifyContent="between" gap={ 2 } className="badge-select rounded px-2 py-1">
                        <Flex pointer center className="badge-select rounded p-1" onClick={ event => setSelectedIndex(index) }>
                            { (badgeParts[index].code && (badgeParts[index].code.length > 0)) &&
                                <LayoutBadgeImageView badgeCode={ badgeParts[index].code } isGroup={ true } /> }
                            { (!badgeParts[index].code || !badgeParts[index].code.length) &&
                                <Flex center className="badge-image group-badge">
                                    <FaPlus className="fa-icon" />
                                </Flex> }
                        </Flex>
                        { (part.type !== GroupBadgePart.BASE) &&
                            <Grid gap={ 1 } columnCount={ 3 }>
                                { POSITIONS.map((position, posIndex) =>
                                    <Base key={ posIndex } pointer className={ `group-badge-position-swatch ${ (badgeParts[index].position === position) ? 'active' : '' }` } onClick={ event => setPartProperty(index, 'position', position) } />) }
                            </Grid> }
                        <Grid gap={ 1 } columnCount={ 8 }>
                            { (groupCustomize.badgePartColors.length > 0) && groupCustomize.badgePartColors.map((item, colorIndex) =>
                                <Base key={ colorIndex } pointer className={ `group-badge-color-swatch ${ (badgeParts[index].color === (colorIndex + 1)) ? 'active' : '' }` } style={ { backgroundColor: '#' + item.color } } onClick={ event => setPartProperty(index, 'color', (colorIndex + 1)) } />) }
                        </Grid>
                    </Flex>) }
                { (selectedIndex >= 0) &&
                    <Grid gap={ 1 } columnCount={ 5 }>
                        <Column pointer center className="badge-select rounded p-1" onClick={ event => setPartProperty(selectedIndex, 'key', 0) }>
                            <Flex center className="badge-image group-badge">
                                <FaTimes className="fa-icon" />
                            </Flex>
                        </Column>
                        { ((badgeParts[selectedIndex].type === GroupBadgePart.BASE) ? groupCustomize.badgeBases : groupCustomize.badgeSymbols).map((item, index) =>
                            <Column key={ index } pointer center className="badge-select rounded p-1" onClick={ event => setPartProperty(selectedIndex, 'key', item.id) }>
                                <LayoutBadgeImageView badgeCode={ GroupBadgePart.getCode(badgeParts[selectedIndex].type, item.id, badgeParts[selectedIndex].color, 4) } isGroup={ true } />
                            </Column>) }
                    </Grid> }
            </Column>
        </ScrollContainer>
    );
}
