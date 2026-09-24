import { ExtendedProfileChangedMessageEvent, FriendlyTime, RequestFriendComposer, RoomEngineObjectEvent, RoomObjectCategory, RoomObjectType, UserCurrentBadgesComposer, UserCurrentBadgesEvent, UserProfileEvent, UserProfileParser } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { CreateLinkEvent, GetConfiguration, GetRoomSession, GetSessionDataManager, GetUserProfile, LocalizeText, OpenMessengerChat, ProfileBannerDataEvent, ProfileBannerRequestComposer, ProfileCoverDataEvent, ProfileCoverRequestComposer, ProfileStatsDataEvent, ProfileStatsRequestComposer, RegisterProfileBannerMessages, RegisterProfileCoverMessages, RegisterProfileStatsMessages, SendMessageComposer } from '../../api';
import { Button, Column, Flex, LayoutAvatarImageView, LayoutBadgeRackView, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../common';
import { useMessageEvent, useRoomEngineEvent } from '../../hooks';
import { GroupsContainerView } from './views/GroupsContainerView';
import { UserProfilePicturesTabView } from './views/UserProfilePicturesTabView';
import { UserProfileRoomsTabView } from './views/UserProfileRoomsTabView';
import { UserProfileWealthTabView } from './views/UserProfileWealthTabView';

// Real reference structure (FU in the minified index-b7d2b6d3.js, cross-referenced live): a real 4-tab card
// - Groupes / Apparts / Photos / Richesse - not the single always-visible groups block + link-out row this
// project had before. Ported this pass: Groupes (already had a working equivalent, GroupsContainerView, now
// just a tab instead of always shown), Apparts (real Navigator search reuse, see UserProfileRoomsTabView),
// and the small ".body-image" avatar-area banner (playerBanner - real, already-working hCMS equippable-
// banner feature, see hcms-emulator-plugin's ProfileBannerProtocol.java - just never threaded through the
// profile packet before). Corrected after live computed-style verification: this is NOT the same as the
// big ".profile-banner" cover area (profileBanner, a separate real 452x115 USER-UPLOADED image) - fetch/
// display is now wired via ProfileCoverProtocol; the upload UI itself (the real drag-to-position crop
// widget from User Settings) is built separately - see ProfileCoverCropWidgetView. Photos is also now
// built (see UserProfilePicturesTabView) - genuinely already-working Octane data (Arcturus core's own
// stock camera_web table, written by the real "Publish to web" camera action, zero core changes needed
// to read it). Richesse (a real wealth-over-time chart, diamonds/badges/rares-value/total, plus unique
// rare/badge counts) is now also built (see UserProfileWealthTabView) - correcting an earlier, wrong
// claim in this comment that no backing existed anywhere in the stack: hCMS's own website (a separate
// repo, same shared MySQL database) already has a full wealth-snapshot system
// (hcms_wealth_snapshots/hcms_values_rares/hcms_values_badges, WealthSnapshotService.php/
// WealthCalculator.php) powering its own Center > Inventory > Richesse chart - this pass exposes a read
// path for it via a new hcms-emulator-plugin protocol, same pattern as Photos/Banner/Stats/Cover.
// Real reference tab labels (Groupes/Apparts/Photos/Richesse) have no matching ExternalTexts.json key on
// this project except 'extendedprofile.rooms' ("Rooms") - the other three are plain literal strings rather
// than invented locale keys, same honest-fallback convention already used elsewhere in this project (e.g.
// User Settings' Moderate tab) when no real key exists.
const TABS = [
    { key: 'groups', label: 'Groups' },
    { key: 'rooms', label: null },
    { key: 'photos', label: 'Photos' },
    { key: 'wealth', label: 'Wealth' }
];

export const UserProfileView: FC<{}> = props =>
{
    const [ userProfile, setUserProfile ] = useState<UserProfileParser>(null);
    const [ userBadges, setUserBadges ] = useState<string[]>([]);
    const [ activeTab, setActiveTab ] = useState(TABS[0].key);
    const [ requestSent, setRequestSent ] = useState(false);
    const [ playerBannerUrl, setPlayerBannerUrl ] = useState<string>(null);
    const [ respectsReceived, setRespectsReceived ] = useState(0);
    const [ profileCoverUrl, setProfileCoverUrl ] = useState<string>(null);

    const onClose = () =>
    {
        setUserProfile(null);
        setUserBadges([]);
        setPlayerBannerUrl(null);
        setRespectsReceived(0);
        setProfileCoverUrl(null);
        setActiveTab(TABS[0].key);
    }

    useMessageEvent<UserCurrentBadgesEvent>(UserCurrentBadgesEvent, event =>
    {
        const parser = event.getParser();

        if(!userProfile || (parser.userId !== userProfile.id)) return;

        setUserBadges(parser.badges);
    });

    // Real gap, flagged not guessed: the old FriendsContainerView (mutual friends count + relationship
    // status) had no confirmed place in the real reference's new 4-tab structure - the minified FU
    // component's own render never references userRelationships/friendsCount anywhere, only the shared
    // Ls() store still tracks it (possibly used inside one of the tab components this pass didn't fully
    // decompile). Not re-added here without a confirmed real DOM location for it.

    useMessageEvent<ProfileBannerDataEvent>(ProfileBannerDataEvent, event =>
    {
        const parser = event.getParser();

        if(!userProfile || (parser.userId !== userProfile.id)) return;

        setPlayerBannerUrl(parser.imageFilename ? `${ GetConfiguration<string>('banner.url') }/${ parser.imageFilename }` : '');
    });

    useMessageEvent<ProfileStatsDataEvent>(ProfileStatsDataEvent, event =>
    {
        const parser = event.getParser();

        if(!userProfile || (parser.userId !== userProfile.id)) return;

        setRespectsReceived(parser.respectsReceived);
    });

    useMessageEvent<ProfileCoverDataEvent>(ProfileCoverDataEvent, event =>
    {
        const parser = event.getParser();

        if(!userProfile || (parser.userId !== userProfile.id)) return;

        setProfileCoverUrl(parser.filename ? `${ GetConfiguration<string>('profile.banner.url') }/${ parser.filename }` : '');
    });

    useMessageEvent<UserProfileEvent>(UserProfileEvent, event =>
    {
        const parser = event.getParser();

        let isSameProfile = false;

        setUserProfile(prevValue =>
        {
            if(prevValue && prevValue.id) isSameProfile = (prevValue.id === parser.id);

            return parser;
        });

        if(!isSameProfile)
        {
            setUserBadges([]);
            setPlayerBannerUrl(null);
            setRespectsReceived(0);
            setProfileCoverUrl(null);
            setActiveTab(TABS[0].key);
        }

        setRequestSent(parser.requestSent);

        RegisterProfileBannerMessages();
        RegisterProfileStatsMessages();
        RegisterProfileCoverMessages();
        SendMessageComposer(new UserCurrentBadgesComposer(parser.id));
        SendMessageComposer(new ProfileBannerRequestComposer(parser.id));
        SendMessageComposer(new ProfileStatsRequestComposer(parser.id));
        SendMessageComposer(new ProfileCoverRequestComposer(parser.id));
    });

    useMessageEvent<ExtendedProfileChangedMessageEvent>(ExtendedProfileChangedMessageEvent, event =>
    {
        const parser = event.getParser();

        if(parser.userId != userProfile?.id) return;

        GetUserProfile(parser.userId);
    });

    useRoomEngineEvent<RoomEngineObjectEvent>(RoomEngineObjectEvent.SELECTED, event =>
    {
        if(!userProfile) return;

        if(event.category !== RoomObjectCategory.UNIT) return;

        const userData = GetRoomSession().userDataManager.getUserDataByIndex(event.objectId);

        if(userData.type !== RoomObjectType.USER) return;

        GetUserProfile(userData.webID);
    });

    if(!userProfile) return null;

    const isOwnProfile = (userProfile.id === GetSessionDataManager().userId);
    const canSendFriendRequest = !requestSent && !isOwnProfile && !userProfile.isMyFriend && !userProfile.requestSent;

    const addFriend = () =>
    {
        setRequestSent(true);

        SendMessageComposer(new RequestFriendComposer(userProfile.username));
    }

    const formatThousands = (value: number) => (value ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    return (
        <NitroCardView uniqueKey="nitro-user-profile" theme="primary-slim" className="user-profile">
            <NitroCardHeaderView headerText={ `${ LocalizeText('extendedprofile.caption') } - ${ userProfile.username }` } onCloseClick={ onClose } />
            <NitroCardContentView overflow="hidden">
                { /* Real reference structure, corrected after a full live DOM-hierarchy trace (user report:
                     "overall profile structure layout is not right" - traced upward per the mandated
                     protocol rather than patched with numbers). The header block is a COLUMN, not a row:
                     .profile-banner is a full-width sibling ABOVE .profile-data (confirmed via
                     getBoundingClientRect on the reference - both 452px wide, same x, banner y=127,
                     profile-data y=246, i.e. stacked, not side-by-side as this file had it before). Inside
                     .profile-data, the second child (buttons/stats/motto) is also a COLUMN
                     (flex-column, justify-content-between), not a row split - confirmed the same way
                     (profile-button-group/.profile-stats/motto row all share the same x, increasing y). */ }
                <Column gap={ 1 } shrink>
                    { /* Real reference, corrected after live computed-style verification against the actual
                         reference (not guessed): these are two genuinely DIFFERENT banners, confirmed via
                         their own real fields (profileBanner vs playerBanner) and own real config keys
                         (profile.banner.url vs banner.url). ".profile-banner" is the real, fixed 452x115
                         USER-UPLOADED cover image - now backed end to end by the new
                         hcms-emulator-plugin ProfileCoverProtocol (upload/fetch/delete), real
                         hcms_users_profile_banners table, real files under
                         public/assets/img/center/profile-banners/. ".body-image" is the one this project's
                         own already-working hcms_users_banners/BannerProtocol equippable-banner system
                         feeds (playerBanner) - this was wrongly placed on ".profile-banner" in an earlier
                         pass of this same file. */ }
                    <div className="profile-banner" style={ profileCoverUrl ? { backgroundImage: `url(${ profileCoverUrl })` } : undefined } />
                    <Flex className="profile-data" gap={ 1 }>
                        <Flex className="profile-infostand" gap={ 1 }>
                            { /* Real reference: clicking this opens an external website profile page
                                 (`${pe("profile.url")}/${username}`). No matching hCMS route/config key
                                 exists yet (checked routes/web.php and ui-config.json - genuinely
                                 unbuilt), so this stays a no-op rather than opening a broken URL. */ }
                            <Column fullWidth className="body-image" style={ playerBannerUrl ? { backgroundImage: `url(${ playerBannerUrl })` } : undefined }>
                                <LayoutAvatarImageView figure={ userProfile.figure } direction={ 2 } />
                            </Column>
                            <LayoutBadgeRackView badgeCodes={ userBadges } showInfo />
                        </Flex>
                        <Column fit gap={ 1 } justifyContent="between">
                            <Flex className="profile-button-group" gap={ 1 }>
                                { canSendFriendRequest &&
                                    <Button onClick={ addFriend }>{ LocalizeText('extendedprofile.addasafriend') }</Button> }
                                { !canSendFriendRequest &&
                                    <>
                                        { isOwnProfile &&
                                            <Button disabled>{ LocalizeText('extendedprofile.me') }</Button> }
                                        { !isOwnProfile && (requestSent || userProfile.requestSent) &&
                                            <Button disabled>{ LocalizeText('extendedprofile.friendrequestsent') }</Button> }
                                        { !isOwnProfile && userProfile.isMyFriend &&
                                            <Button onClick={ event => OpenMessengerChat(userProfile.id) }>Message</Button> }
                                    </> }
                                { isOwnProfile &&
                                    <Button onClick={ event => CreateLinkEvent('user-settings/toggle') }>Settings</Button> }
                                { !isOwnProfile &&
                                    <Button onClick={ event => CreateLinkEvent(`user-profile-moderation/open/${ userProfile.username }/${ userProfile.id }/${ userProfile.figure }/${ userProfile.motto }/${ profileCoverUrl ?? '' }`) }>Moderate</Button> }
                            </Flex>
                            { /* Real classname (.profile-stats, with its own real font-size:13px rule
                                 already in _59-user-profile.scss) plus a real .vertical-separator between
                                 the two columns - both confirmed via live outerHTML capture, neither was in
                                 this file before. */ }
                            <Flex className="profile-stats" justifyContent="between">
                                <Column gap={ 1 }>
                                    { /* Real keys, used correctly: both carry their own embedded <b> label
                                         and %placeholder% (confirmed in ExternalTexts.json) - the OLD code
                                         wrapped the label in ANOTHER <b> and appended the value as a
                                         sibling, which both double-bolded the label and left the real
                                         %created%/%lastlogin% token substituted by nothing. */ }
                                    <Text small dangerouslySetInnerHTML={ { __html: LocalizeText('extendedprofile.created', [ 'created' ], [ userProfile.registration ]) } } />
                                    <Text small dangerouslySetInnerHTML={ { __html: userProfile.isOnline ? `<b>Online since:</b> ${ FriendlyTime.format(userProfile.secondsSinceLastVisit, '.ago', 2) }` : LocalizeText('extendedprofile.last.login', [ 'lastlogin' ], [ FriendlyTime.format(userProfile.secondsSinceLastVisit, '.ago', 2) ]) } } />
                                </Column>
                                <div className="vertical-separator" />
                                <Column gap={ 1 }>
                                    <Flex gap={ 1 }>
                                        <Text bold small>{ LocalizeText('extendedprofile.achievementscore') }</Text>
                                        <Text small>{ formatThousands(userProfile.achievementPoints) }</Text>
                                    </Flex>
                                    <Flex gap={ 1 }>
                                        <Text bold small>Respects:</Text>
                                        <Text small>{ formatThousands(respectsReceived) }</Text>
                                    </Flex>
                                </Column>
                            </Flex>
                            <Flex alignItems="center" gap={ 1 } justifyContent="between">
                                <Text className="profile-stats-motto rounded py-1 px-2" small truncate title={ userProfile.motto }>{ userProfile.motto }&nbsp;</Text>
                                <i className={ `profile-stats-online-icon icon ${ userProfile.isOnline ? 'icon-pf-online' : 'icon-pf-offline' }` } />
                            </Flex>
                        </Column>
                    </Flex>
                </Column>
                <NitroCardTabsView>
                    { TABS.map(tab =>
                        <NitroCardTabsItemView key={ tab.key } gap={ 1 } isActive={ (activeTab === tab.key) } onClick={ () => setActiveTab(tab.key) }>
                            <Text small>{ tab.label ?? LocalizeText('extendedprofile.rooms') }</Text>
                        </NitroCardTabsItemView>) }
                </NitroCardTabsView>
                { (activeTab === 'groups') &&
                    <GroupsContainerView fullWidth itsMe={ isOwnProfile } groups={ userProfile.groups } onLeaveGroup={ () => GetUserProfile(userProfile.id) } /> }
                { (activeTab === 'rooms') &&
                    <UserProfileRoomsTabView userProfile={ userProfile } /> }
                { (activeTab === 'photos') &&
                    <UserProfilePicturesTabView userProfile={ userProfile } /> }
                { (activeTab === 'wealth') &&
                    <UserProfileWealthTabView userProfile={ userProfile } /> }
            </NitroCardContentView>
        </NitroCardView>
    )
}
