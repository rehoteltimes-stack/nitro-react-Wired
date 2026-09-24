import { RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RoomSessionFavoriteGroupUpdateEvent, RoomSessionUserBadgesEvent, RoomSessionUserFigureUpdateEvent, UserCurrentBadgesComposer, UserCurrentBadgesEvent, UserRelationshipsComposer } from '@nitrots/nitro-renderer';
import { Dispatch, FC, FocusEvent, KeyboardEvent, SetStateAction, useEffect, useState } from 'react';
import { FaPencilAlt, FaTimes } from 'react-icons/fa';
import { AvatarInfoUser, CloneObject, GetConfiguration, GetGroupInformation, GetSessionDataManager, GetUserProfile, LocalizeText, SendMessageComposer } from '../../../../../api';
import { Column, Flex, LayoutAvatarImageView, LayoutBadgeImageView, Text, UserProfileIconView } from '../../../../../common';
import { useInventoryBanner, useMessageEvent, useRoom, useRoomSessionManagerEvent } from '../../../../../hooks';
import { InfoStandWidgetUserRelationshipsView } from './InfoStandWidgetUserRelationshipsView';
import { InfoStandWidgetUserTagsView } from './InfoStandWidgetUserTagsView';

interface InfoStandWidgetUserViewProps
{
    avatarInfo: AvatarInfoUser;
    setAvatarInfo: Dispatch<SetStateAction<AvatarInfoUser>>;
    onClose: () => void;
}

export const InfoStandWidgetUserView: FC<InfoStandWidgetUserViewProps> = props =>
{
    const { avatarInfo = null, setAvatarInfo = null, onClose = null } = props;
    const [ motto, setMotto ] = useState<string>(null);
    const [ isEditingMotto, setIsEditingMotto ] = useState(false);
    const [ relationships, setRelationships ] = useState<RelationshipStatusInfoMessageParser>(null);
    const { roomSession = null } = useRoom();
    // The reference's own .body-image carries the user's equipped profile banner as a background-image
    // (confirmed live: same mechanism/classname InventoryBannerItemView.tsx already uses for the Inventory's
    // own Banners tab). BannerProtocol only reports the LOCAL player's own inventory/equipped banner - there's
    // no per-peer banner field on room user data (checked AvatarInfoUtilities/RoomSessionUserFigureUpdateEvent,
    // not present) - so this only ever applies to the OWN_USER infostand, never a peer's.
    const { banners = [], activeBannerId = -1, requestBanners = null } = useInventoryBanner();
    const activeBanner = (avatarInfo.type === AvatarInfoUser.OWN_USER) ? banners.find(banner => (banner.bannerId === activeBannerId)) : null;
    const bannerImageUrl = activeBanner ? `${ GetConfiguration<string>('banner.url') }/${ activeBanner.imageFilename }` : null;

    // Real reference: .badge-layout holds badge[0] paired with the group badge in its own top row (align-items-end),
    // then every remaining slot in rows of 2 (align-items-center/justify-content-center) - confirmed live via CDP
    // against habbocity.fr (4 rows total = 7 non-group slots). 7 is this project's own already-existing
    // 'user.badges.max.slots' config (already used by useInventoryBadges.ts for the Inventory's Badges tab), not
    // a guessed number - matches the reference's own real slot count exactly. Every non-group slot gets a fixed
    // 42x42 placeholder box regardless of whether a badge is equipped there (confirmed: the reference sets this
    // inline on every one of them, empty or not) - only the group slot stays unsized until a group badge texture
    // actually loads, same as LayoutBadgeImageView's own existing behaviour.
    const maxBadgeCount = GetConfiguration<number>('user.badges.max.slots', 7);
    const badgeRowStartIndexes: number[] = [];
    for(let i = 1; i < maxBadgeCount; i += 2) badgeRowStartIndexes.push(i);

    useEffect(() =>
    {
        // Only InventoryBannerView requested this before - if the Inventory's Banners tab was never opened this
        // session, activeBannerId/banners stay empty and the infostand's own banner never shows despite one being
        // worn server-side. requestBanners() is a plain fire-and-forget composer send, safe to call again even if
        // InventoryBannerView already has (BannerDataEvent just re-delivers the same real state).
        if(avatarInfo.type === AvatarInfoUser.OWN_USER) requestBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveMotto = (motto: string) =>
    {
        if(!isEditingMotto || (motto.length > GetConfiguration<number>('motto.max.length', 38))) return;

        roomSession.sendMottoMessage(motto);

        setIsEditingMotto(false);
    }

    const onMottoBlur = (event: FocusEvent<HTMLInputElement>) => saveMotto(event.target.value);

    const onMottoKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        event.stopPropagation();

        switch(event.key)
        {
            case 'Enter':
                saveMotto((event.target as HTMLInputElement).value);
                return;
        }
    }

    // Real gap, not present until now: this infostand only ever listened for RSUBE_BADGES, a broadcast that
    // only fires when a badge is actively worn/removed near this session - it carries no initial state, so a
    // freshly-opened infostand showed 0 badges until someone happened to toggle one. UserCurrentBadgesComposer/
    // Event is a real, already-vendored request/response pair (already used the same way by UserProfileView.tsx)
    // that actively asks the server for this user's currently-worn badges on open, instead of waiting for one.
    useMessageEvent<UserCurrentBadgesEvent>(UserCurrentBadgesEvent, event =>
    {
        const parser = event.getParser();

        if(!avatarInfo || (parser.userId !== avatarInfo.webID)) return;

        setAvatarInfo(prevValue =>
        {
            const newValue = CloneObject(prevValue);

            newValue.badges = parser.badges;

            return newValue;
        });
    });

    useRoomSessionManagerEvent<RoomSessionUserBadgesEvent>(RoomSessionUserBadgesEvent.RSUBE_BADGES, event =>
    {
        if(!avatarInfo || (avatarInfo.webID !== event.userId)) return;

        const oldBadges = avatarInfo.badges.join('');

        if(oldBadges === event.badges.join('')) return;

        setAvatarInfo(prevValue =>
        {
            const newValue = CloneObject(prevValue);

            newValue.badges = event.badges;

            return newValue;
        });
    });

    useRoomSessionManagerEvent<RoomSessionUserFigureUpdateEvent>(RoomSessionUserFigureUpdateEvent.USER_FIGURE, event =>
    {
        if(!avatarInfo || (avatarInfo.roomIndex !== event.roomIndex)) return;

        setAvatarInfo(prevValue =>
        {
            const newValue = CloneObject(prevValue);

            newValue.figure = event.figure;
            newValue.motto = event.customInfo;
            newValue.achievementScore = event.activityPoints;

            return newValue;
        });
    });

    useRoomSessionManagerEvent<RoomSessionFavoriteGroupUpdateEvent>(RoomSessionFavoriteGroupUpdateEvent.FAVOURITE_GROUP_UPDATE, event =>
    {
        if(!avatarInfo || (avatarInfo.roomIndex !== event.roomIndex)) return;

        setAvatarInfo(prevValue =>
        {
            const newValue = CloneObject(prevValue);
            const clearGroup = ((event.status === -1) || (event.habboGroupId <= 0));

            newValue.groupId = clearGroup ? -1 : event.habboGroupId;
            newValue.groupName = clearGroup ? null : event.habboGroupName
            newValue.groupBadgeId = clearGroup ? null : GetSessionDataManager().getGroupBadge(event.habboGroupId);

            return newValue;
        });
    });

    useMessageEvent<RelationshipStatusInfoEvent>(RelationshipStatusInfoEvent, event =>
    {
        const parser = event.getParser();

        if(!avatarInfo || (avatarInfo.webID !== parser.userId)) return;

        setRelationships(parser);
    });

    useEffect(() =>
    {
        setIsEditingMotto(false);
        setMotto(avatarInfo.motto);

        SendMessageComposer(new UserRelationshipsComposer(avatarInfo.webID));
        SendMessageComposer(new UserCurrentBadgesComposer(avatarInfo.webID));

        return () =>
        {
            setIsEditingMotto(false);
            setMotto(null);
            setRelationships(null);
        }
    }, [ avatarInfo ]);

    if(!avatarInfo) return null;

    return (
        <Column className="nitro-infostand rounded">
            <Column overflow="visible" className="container-fluid content-area" gap={ 1 }>
                <Column gap={ 1 }>
                    <Flex alignItems="center" justifyContent="between">
                        <Flex alignItems="center" gap={ 1 }>
                            <UserProfileIconView userId={ avatarInfo.webID } />
                            <Text variant="white" small wrap>{ avatarInfo.name }</Text>
                        </Flex>
                        <FaTimes className="cursor-pointer fa-icon" onClick={ onClose } />
                    </Flex>
                    <hr className="m-0" />
                </Column>
                <Column gap={ 1 }>
                    <Flex gap={ 2 } alignItems="center">
                        <Column fullWidth className="body-image" style={ bannerImageUrl ? { backgroundImage: `url(${ bannerImageUrl })` } : undefined } onClick={ event => GetUserProfile(avatarInfo.webID) }>
                            <LayoutAvatarImageView figure={ avatarInfo.figure } direction={ 4 } />
                        </Column>
                        <Column alignItems="start" gap={ 1 } className="badge-layout">
                            <Flex alignItems="end" gap={ 1 }>
                                <Flex center className="badge-image" style={ { width: 42, height: 42 } }>
                                    { avatarInfo.badges[0] && <LayoutBadgeImageView badgeCode={ avatarInfo.badges[0] } showInfo={ true } /> }
                                </Flex>
                                <Flex center pointer={ ( avatarInfo.groupId > 0) } className="badge-image group-badge-image" onClick={ event => GetGroupInformation(avatarInfo.groupId) }>
                                    { avatarInfo.groupId > 0 &&
                                        <LayoutBadgeImageView badgeCode={ avatarInfo.groupBadgeId } isGroup={ true } showInfo={ true } customTitle={ avatarInfo.groupName } /> }
                                </Flex>
                            </Flex>
                            { badgeRowStartIndexes.map(startIndex =>
                                <Flex key={ startIndex } center gap={ 1 }>
                                    <Flex center className="badge-image" style={ { width: 42, height: 42 } }>
                                        { avatarInfo.badges[startIndex] && <LayoutBadgeImageView badgeCode={ avatarInfo.badges[startIndex] } showInfo={ true } /> }
                                    </Flex>
                                    <Flex center className="badge-image" style={ { width: 42, height: 42 } }>
                                        { avatarInfo.badges[startIndex + 1] && <LayoutBadgeImageView badgeCode={ avatarInfo.badges[startIndex + 1] } showInfo={ true } /> }
                                    </Flex>
                                </Flex>) }
                        </Column>
                    </Flex>
                    <hr className="m-0" />
                </Column>
                <Column gap={ 1 }>
                    <Flex alignItems="center" className="bg-light-dark rounded py-1 px-2">
                        { (avatarInfo.type !== AvatarInfoUser.OWN_USER) &&
                            <Flex grow alignItems="center" className="motto-content">
                                <Text fullWidth pointer wrap textBreak small variant="white">{ motto }</Text>
                            </Flex> }
                        { avatarInfo.type === AvatarInfoUser.OWN_USER &&
                            <Flex grow alignItems="center" gap={ 2 }>
                                <FaPencilAlt className="small fa-icon" />
                                <Flex grow alignItems="center" className="motto-content">
                                    { !isEditingMotto &&
                                        <Text fullWidth pointer wrap textBreak small variant="white" onClick={ event => setIsEditingMotto(true) }>{ motto }&nbsp;</Text> }
                                    { isEditingMotto &&
                                        <input type="text" className="motto-input" maxLength={ GetConfiguration<number>('motto.max.length', 38) } value={ motto } onChange={ event => setMotto(event.target.value) } onBlur={ onMottoBlur } onKeyDown={ onMottoKeyDown } autoFocus={ true } /> }
                                </Flex>
                            </Flex> }
                    </Flex>
                    <hr className="m-0" />
                </Column>
                <Column gap={ 1 }>
                    <Text variant="white" small wrap>
                        { LocalizeText('infostand.text.achievement_score') + ' ' + avatarInfo.achievementScore }
                    </Text>
                    { (avatarInfo.carryItem > 0) &&
                        <>
                            <hr className="m-0" />
                            <Text variant="white" small wrap>
                                { LocalizeText('infostand.text.handitem', [ 'item' ], [ LocalizeText('handitem' + avatarInfo.carryItem) ]) }
                            </Text>
                        </> }
                </Column>
                <Column gap={ 1 }>
                    <InfoStandWidgetUserRelationshipsView relationships={ relationships } />
                </Column>
                { GetConfiguration('user.tags.enabled') &&
                    <Column gap={ 1 } className="mt-1">
                        <InfoStandWidgetUserTagsView tags={ GetSessionDataManager().tags } />
                    </Column>
                }
            </Column>
        </Column>
    );
}
