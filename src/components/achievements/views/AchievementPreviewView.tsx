import { AchievementData } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { AchievementUtilities, LocalizeBadgeDescription, LocalizeBadgeName, LocalizeText } from '../../../api';
import { Column, Flex, LayoutCurrencyIcon, LayoutProgressBar, Text } from '../../../common';
import { AchievementBadgeView } from './AchievementBadgeView';

interface AchievementPreviewViewProps
{
    achievement: AchievementData;
}

export const AchievementPreviewView: FC<AchievementPreviewViewProps> = props =>
{
    const { achievement = null } = props;

    if(!achievement) return null;

    const badgeCode = AchievementUtilities.getAchievementBadgeCode(achievement);

    return (
        <Column shrink gap={ 1 }>
            <Flex gap={ 2 } alignItems="center" overflow="hidden">
                <AchievementBadgeView achievement={ achievement } />
                <Column gap={ 0 } overflow="hidden">
                    <Text bold truncate>{ LocalizeBadgeName(badgeCode) }</Text>
                    <Text small className="achievement-description">{ LocalizeBadgeDescription(badgeCode) }</Text>
                    <Flex gap={ 2 } alignItems="center">
                        <Text small bold>{ LocalizeText('achievements.details.level', [ 'level', 'limit' ], [ AchievementUtilities.getAchievementLevel(achievement).toString(), achievement.levelCount.toString() ]) }</Text>
                        { (achievement.levelRewardPoints > 0) &&
                            <Flex alignItems="center" gap={ 1 }>
                                <Text small>{ LocalizeText('achievements.details.reward') }</Text>
                                <Text small bold>{ achievement.levelRewardPoints }</Text>
                                <LayoutCurrencyIcon type={ achievement.levelRewardPointType } />
                            </Flex> }
                    </Flex>
                </Column>
            </Flex>
            { (achievement.scoreLimit > 0) &&
                <LayoutProgressBar text={ LocalizeText('achievements.details.progress', [ 'progress', 'limit' ], [ (achievement.currentPoints + achievement.scoreAtStartOfLevel).toString(), (achievement.scoreLimit + achievement.scoreAtStartOfLevel).toString() ]) } progress={ (achievement.currentPoints + achievement.scoreAtStartOfLevel) } maxProgress={ (achievement.scoreLimit + achievement.scoreAtStartOfLevel) } /> }
        </Column>
    );
}
