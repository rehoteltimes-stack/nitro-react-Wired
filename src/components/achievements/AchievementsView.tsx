import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, useEffect, useState } from 'react';
import { AchievementUtilities, AddEventLinkTracker, LocalizeText, RemoveLinkEventTracker } from '../../api';
import { Flex, Grid, LayoutImage, LayoutProgressBar, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../common';
import { useAchievements } from '../../hooks';
import { AchievementItemView } from './views/AchievementItemView';
import { AchievementPreviewView } from './views/AchievementPreviewView';

export const AchievementsView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { achievementCategories = [], selectedCategoryCode = null, setSelectedCategoryCode = null, selectedCategory = null, selectedAchievement = null, setSelectedAchievementId = null, achievementScore = 0, getProgress = 0, getMaxProgress = 0 } = useAchievements();

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'achievements/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!isVisible || selectedCategoryCode || !achievementCategories.length) return;

        setSelectedCategoryCode(achievementCategories[0].code);
    }, [ isVisible, selectedCategoryCode, achievementCategories, setSelectedCategoryCode ]);

    useEffect(() =>
    {
        if(!selectedCategory || selectedAchievement || !selectedCategory.achievements.length) return;

        setSelectedAchievementId(selectedCategory.achievements[0].achievementId);
    }, [ selectedCategory, selectedAchievement, setSelectedAchievementId ]);

    if(!isVisible) return null;

    return (
        <NitroCardView uniqueKey="achievements" className="nitro-achievements" theme="">
            <NitroCardHeaderView headerText={ LocalizeText('inventory.achievements') } onCloseClick={ event => setIsVisible(false) } />
            <NitroCardContentView overflow="hidden">
                <NitroCardTabsView>
                    { achievementCategories.map(category =>
                        <NitroCardTabsItemView key={ category.code } isActive={ (selectedCategoryCode === category.code) } count={ AchievementUtilities.getAchievementCategoryTotalUnseen(category) } title={ LocalizeText(`quests.${ category.code }.name`) } onClick={ event => setSelectedCategoryCode(category.code) }>
                            <LayoutImage imageUrl={ AchievementUtilities.getAchievementCategoryImageUrl(category, null, true) } />
                        </NitroCardTabsItemView>) }
                </NitroCardTabsView>
                <Grid grow columnCount={ 4 } gap={ 1 } fullHeight={ false } overflow="auto" style={ { '--nitro-grid-column-min-height': '48px', alignContent: 'start', minHeight: 0 } as CSSProperties }>
                    { selectedCategory && selectedCategory.achievements.map(achievement => <AchievementItemView key={ achievement.achievementId } achievement={ achievement } />) }
                </Grid>
                <AchievementPreviewView achievement={ selectedAchievement } />
                <Flex fullWidth gap={ 2 } alignItems="center">
                    <Text small noWrap>{ LocalizeText('achievements.categories.score', [ 'score' ], [ achievementScore.toString() ]) }</Text>
                    <LayoutProgressBar grow text={ LocalizeText('achievements.categories.totalprogress', [ 'progress', 'limit' ], [ getProgress.toString(), getMaxProgress.toString() ]) } progress={ getProgress } maxProgress={ getMaxProgress } />
                </Flex>
            </NitroCardContentView>
        </NitroCardView>
    );
};
