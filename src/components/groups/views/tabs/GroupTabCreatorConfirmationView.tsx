import { Dispatch, FC, SetStateAction } from 'react';
import { IGroupData, LocalizeText } from '../../../../api';
import { Base, Column, Flex, LayoutBadgeImageView, ScrollContainer, Text } from '../../../../common';
import { useGroup } from '../../../../hooks';

interface GroupTabCreatorConfirmationViewProps
{
    groupData: IGroupData;
    setGroupData: Dispatch<SetStateAction<IGroupData>>;
}

export const GroupTabCreatorConfirmationView: FC<GroupTabCreatorConfirmationViewProps> = props =>
{
    const { groupData = null, setGroupData = null } = props;
    const { groupCustomize = null } = useGroup();

    const getCompleteBadgeCode = () =>
    {
        if(!groupData || !groupData.groupBadgeParts || !groupData.groupBadgeParts.length) return '';

        let badgeCode = '';

        groupData.groupBadgeParts.forEach(part => (part.code && (badgeCode += part.code)));

        return badgeCode;
    }
    
    const getGroupColor = (colorIndex: number) =>
    {
        if(colorIndex === 0) return groupCustomize.groupColorsA.find(c => c.id === groupData.groupColors[colorIndex]).color;

        return groupCustomize.groupColorsB.find(c => c.id === groupData.groupColors[colorIndex]).color;
    }

    if(!groupData) return null;

    return (
        <Column overflow="hidden" gap={ 1 } fullHeight>
            <Flex fill shrink gap={ 2 }>
                <Column center className="bg-muted rounded p-1" gap={ 2 }>
                    <Text bold center>{ LocalizeText('group.create.confirm.guildbadge') }</Text>
                    <LayoutBadgeImageView badgeCode={ getCompleteBadgeCode() } isGroup={ true } />
                </Column>
                <Column center className="bg-muted rounded p-1" gap={ 2 }>
                    <Text bold center>{ LocalizeText('group.edit.color.guild.color') }</Text>
                    <Flex overflow="hidden" className="rounded border">
                        <Base className="group-color-swatch" style={ { backgroundColor: '#' + getGroupColor(0) } } />
                        <Base className="group-color-swatch" style={ { backgroundColor: '#' + getGroupColor(1) } } />
                    </Flex>
                </Column>
            </Flex>
            <Column justifyContent="between" fullHeight>
                <Column gap={ 2 }>
                    <Column shrink>
                        <Text bold>Title:</Text>
                        <Text>{ groupData.groupName }</Text>
                    </Column>
                    <Column>
                        <Text bold>Description:</Text>
                        <ScrollContainer>
                            <Text textBreak>{ groupData.groupDescription }</Text>
                        </ScrollContainer>
                    </Column>
                </Column>
                <Text shrink small variant="muted" overflow="auto">Your group is finally ready. After buying it you can invite other users and give them rights.</Text>
            </Column>
        </Column>
    );
};
