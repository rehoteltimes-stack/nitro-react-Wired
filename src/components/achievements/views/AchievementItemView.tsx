import { AchievementData } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { LayoutGridItem } from '../../../common';
import { useAchievements } from '../../../hooks';
import { AchievementBadgeView } from './AchievementBadgeView';

interface AchievementItemViewProps
{
    achievement: AchievementData;
}

export const AchievementItemView: FC<AchievementItemViewProps> = props =>
{
    const { achievement = null } = props;
    const { selectedAchievement = null, setSelectedAchievementId = null } = useAchievements();

    return (
        <LayoutGridItem itemActive={ (selectedAchievement?.achievementId === achievement.achievementId) } itemUnseen={ (achievement.unseen > 0) } onMouseDown={ event => setSelectedAchievementId(achievement.achievementId) }>
            <AchievementBadgeView achievement={ achievement } />
        </LayoutGridItem>
    );
}
