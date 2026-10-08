import { ILinkEventTracker, NitroSettingsEvent, UserSettingsCameraFollowComposer, UserSettingsEvent, UserSettingsRoomInvitesComposer, UserSettingsSoundComposer } from '@nitrots/nitro-renderer';
import { ChangeEvent, FC, useEffect, useRef, useState } from 'react';
import { FaVolumeDown, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { AddEventLinkTracker, CreateLinkEvent, DispatchMainEvent, DispatchUiEvent, GetSessionDataManager, LocalizeText, ProfileCoverDataEvent, ProfileCoverUploadComposer, RegisterProfileCoverMessages, RemoveLinkEventTracker, SendMessageComposer, SetCoverDeletePending } from '../../api';
import { Button, classNames, Column, CustomInputRange, Flex, LayoutAvatarImageView, LayoutBadgeRackView, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, ProfileCoverCropWidgetView, ScrollContainer, Text } from '../../common';
import { useInventoryBadges, useMessageEvent } from '../../hooks';
import { UserSettingsCoverInfoView } from './UserSettingsCoverInfoView';
import { UserSettingsFloorView } from './UserSettingsFloorView';
import { UserSettingsPerformanceView } from './UserSettingsPerformanceView';
import { UserSettingsModerateView } from './UserSettingsModerateView';
import { UserSettingsOptionsView } from './UserSettingsOptionsView';

const COVER_SIZE: [ number, number ] = [ 452, 115 ];

export const UserSettingsView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTab, setActiveTab ] = useState(0);
    const [ userSettings, setUserSettings ] = useState<NitroSettingsEvent>(null);
    const [ darkMode, setDarkMode ] = useState(() => document.body.classList.contains('dark-mode'));
    const { activeBadgeSlots = [] } = useInventoryBadges();
    const [ pendingCoverImage, setPendingCoverImage ] = useState<HTMLImageElement>(null);
    const [ croppedCoverCanvas, setCroppedCoverCanvas ] = useState<HTMLCanvasElement>(null);
    const [ coverError, setCoverError ] = useState<string>(null);
    const [ coverSuccess, setCoverSuccess ] = useState<string>(null);
    const [ coverBusy, setCoverBusy ] = useState(false);
    const [ coverDeleteQueued, setCoverDeleteQueued ] = useState(false);
    const coverFileInputRef = useRef<HTMLInputElement>(null);

    const processAction = (type: string, value?: boolean | number | string) =>
    {
        let doUpdate = true;

        const clone = userSettings.clone();

        switch(type)
        {
            case 'close_view':
                setIsVisible(false);
                doUpdate = false;
                return;
            case 'room_invites':
                clone.roomInvites = value as boolean;
                SendMessageComposer(new UserSettingsRoomInvitesComposer(clone.roomInvites));
                break;
            case 'camera_follow':
                clone.cameraFollow = value as boolean;
                SendMessageComposer(new UserSettingsCameraFollowComposer(clone.cameraFollow));
                break;
            case 'system_volume':
                clone.volumeSystem = value as number;
                clone.volumeSystem = Math.max(0, clone.volumeSystem);
                clone.volumeSystem = Math.min(100, clone.volumeSystem);
                break;
            case 'furni_volume':
                clone.volumeFurni = value as number;
                clone.volumeFurni = Math.max(0, clone.volumeFurni);
                clone.volumeFurni = Math.min(100, clone.volumeFurni);
                break;
            case 'trax_volume':
                clone.volumeTrax = value as number;
                clone.volumeTrax = Math.max(0, clone.volumeTrax);
                clone.volumeTrax = Math.min(100, clone.volumeTrax);
                break;
        }

        if(doUpdate) setUserSettings(clone);
        
        DispatchMainEvent(clone)
    }

    const saveRangeSlider = (type: string) =>
    {
        switch(type)
        {
            case 'volume':
                SendMessageComposer(new UserSettingsSoundComposer(Math.round(userSettings.volumeSystem), Math.round(userSettings.volumeFurni), Math.round(userSettings.volumeTrax)));
                break;
        }
    }

    // Real reference behavior, corrected after tracing the wire protocol: the reference's own "dark_mode"
    // checkbox sends the SAME composer opcode (slot 0) this project's stock Nitro build uses for
    // "prefer old chat style" (UserSettingsOldChatComposer) - HabboCity's own custom server fork
    // reinterprets that slot as dark-mode, but this project runs its own Arcturus emulator, which
    // stores/reads that slot with the STOCK meaning. Sending it here would silently flip an unrelated
    // server-side preference. Dark mode is already a real, working CLIENT-ONLY preference in this
    // project (src/index.tsx's own body.dark-mode class + localStorage['dark-mode'], driven by hCMS's
    // ?theme= on initial load) - toggled the same way here, with no server composer at all.
    const toggleDarkMode = (checked: boolean) =>
    {
        setDarkMode(checked);
        document.body.classList.toggle('dark-mode', checked);
        localStorage.setItem('dark-mode', checked ? 'true' : 'false');
    }

    // Real reference feature ("Changer la couverture de profil"): pick an image -> real drag-to-position
    // crop widget (ProfileCoverCropWidgetView) -> confirm sends the cropped canvas as raw PNG bytes over a
    // new plugin protocol (ProfileCoverProtocol), cancel just discards it. See UserProfileView.tsx for the
    // read side (fetching/displaying whichever cover is currently set).
    useEffect(() => { RegisterProfileCoverMessages(); }, []);

    const openCoverFilePicker = () => coverFileInputRef.current?.click();

    const onCoverFileSelected = (event: ChangeEvent<HTMLInputElement>) =>
    {
        setCoverError(null);
        setCoverSuccess(null);

        const file = event.target.files?.[0];

        event.target.value = '';

        if(!file) return;

        if(!file.type.startsWith('image/'))
        {
            setCoverError(`Unsupported format: ${ file.type }`);
            return;
        }

        const reader = new FileReader();

        reader.onload = () =>
        {
            const image = new Image();

            image.onload = () => setPendingCoverImage(image);
            image.onerror = () => setCoverError('Could not process that image.');
            image.src = reader.result as string;
        };
        reader.onerror = () => setCoverError('Could not process that image.');
        reader.readAsDataURL(file);
    }

    const cancelCoverCrop = () =>
    {
        setPendingCoverImage(null);
        setCroppedCoverCanvas(null);
    }

    const confirmCoverCrop = () =>
    {
        if(!croppedCoverCanvas) return;

        croppedCoverCanvas.toBlob(async blob =>
        {
            if(!blob)
            {
                setCoverBusy(false);
                setCoverError('Could not process that image.');
                return;
            }

            const buffer = await blob.arrayBuffer();

            SendMessageComposer(new ProfileCoverUploadComposer(new Uint8Array(buffer)));
        }, 'image/png');

        setCoverBusy(true);
        setCoverError(null);
        setCoverSuccess(null);
        cancelCoverCrop();
    }

    const deleteCover = () =>
    {
        setCoverError(null);
        setCoverSuccess('Profile cover removed!');
        CreateLinkEvent('user-profile/cover-removed');
        SetCoverDeletePending(true);

        if(coverBusy)
        {
            setCoverDeleteQueued(true);
            return;
        }

        setCoverBusy(true);
        SendMessageComposer(new ProfileCoverUploadComposer(null));
    }

    useEffect(() =>
    {
        if(!coverBusy) return;

        const timeout = setTimeout(() =>
        {
            if(coverDeleteQueued)
            {
                setCoverDeleteQueued(false);
                SendMessageComposer(new ProfileCoverUploadComposer(null));
                return;
            }

            setCoverBusy(false);
        }, 8000);

        return () => clearTimeout(timeout);
    }, [ coverBusy, coverDeleteQueued ]);

    useMessageEvent<ProfileCoverDataEvent>(ProfileCoverDataEvent, event =>
    {
        const parser = event.getParser();

        if(parser.userId !== GetSessionDataManager().userId) return;

        if(!parser.filename) SetCoverDeletePending(false);

        if(!coverBusy) return;

        if(coverDeleteQueued)
        {
            setCoverDeleteQueued(false);
            SendMessageComposer(new ProfileCoverUploadComposer(null));
            return;
        }

        setCoverBusy(false);

        if(parser.filename) setCoverSuccess('Profile cover saved!');
    });

    useMessageEvent<UserSettingsEvent>(UserSettingsEvent, event =>
    {
        const parser = event.getParser();
        const settingsEvent = new NitroSettingsEvent();

        settingsEvent.volumeSystem = parser.volumeSystem;
        settingsEvent.volumeFurni = parser.volumeFurni;
        settingsEvent.volumeTrax = parser.volumeTrax;
        settingsEvent.oldChat = parser.oldChat;
        settingsEvent.roomInvites = parser.roomInvites;
        settingsEvent.cameraFollow = parser.cameraFollow;
        settingsEvent.flags = parser.flags;
        settingsEvent.chatType = parser.chatType;

        setUserSettings(settingsEvent);
        DispatchMainEvent(settingsEvent);
    });

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
            eventUrlPrefix: 'user-settings/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!userSettings) return;

        DispatchUiEvent(userSettings);
    }, [ userSettings ]);

    if(!isVisible || !userSettings) return null;

    // Real reference: the fake mock profile preview shown behind/around the crop widget while positioning
    // a new cover (overlayContent on the reference's own sO component) - uses the real logged-in user's own
    // figure + currently-worn badges, not placeholder art.
    const coverPreviewOverlay = (
        <Flex className="cropping-fake-profile-data" gap={ 1 }>
            <Flex className="cropping-fake-profile-infostand" gap={ 1 }>
                <Column fullWidth className="body-image">
                    <LayoutAvatarImageView figure={ GetSessionDataManager().figure } direction={ 2 } />
                </Column>
                <LayoutBadgeRackView badgeCodes={ activeBadgeSlots } />
            </Flex>
            <Flex fit overflow="hidden" gap={ 1 } justifyContent="between">
                <Flex className="cropping-fake-profile-button-group" gap={ 1 }>
                    <Button disabled>Button 1</Button>
                    <Button disabled>Button 2</Button>
                </Flex>
            </Flex>
        </Flex>
    );

    return (
        <NitroCardView uniqueKey="user-settings" className={ `user-settings-window ${ pendingCoverImage ? 'cropping' : '' }` }>
            <NitroCardHeaderView headerText={ LocalizeText('widget.memenu.settings.title') } onCloseClick={ event => processAction('close_view') } />
            { !pendingCoverImage &&
            <NitroCardContentView className="user-settings-tab-container">
                <NitroCardTabsView>
                    <NitroCardTabsItemView isActive={ (activeTab === 0) } onClick={ event => setActiveTab(0) }>General</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ (activeTab === 1) } onClick={ event => setActiveTab(1) }>Floor</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ (activeTab === 4) } onClick={ event => setActiveTab(4) }>Performance</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ (activeTab === 2) } onClick={ event => setActiveTab(2) }>Moderate</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ (activeTab === 3) } onClick={ event => setActiveTab(3) }>Options</NitroCardTabsItemView>
                </NitroCardTabsView>
                { (activeTab === 0) &&
                <ScrollContainer>
                { /* Real reference structure, corrected after a user report ("layout spacing order
                     and all is still wrong") - traced via live DOM/computed-style capture, not
                     guessed: the whole General tab content is wrapped in the same real
                     .scroll-container/.scroll-content primitive used elsewhere in this project
                     (missing entirely before), with a real gap-3 (16px) between exactly 3 top-level
                     groups. The real order is checkboxes -> COVER UPLOAD -> VOLUME (confirmed by
                     reading each group's own first text content live: "Thème sombre", "Changer la
                     couverture de profil", "Régler le son", in that order) - this file previously
                     rendered volume before cover, a real ordering bug, not just a missing wrapper. */ }
                <Column gap={ 3 }>
                { /* Real reference has exactly 3 checkboxes here (confirmed via the live minified
                     source: darkMode/roomInvites/cameraFollow, in that order) - this file previously
                     had 5: a "prefer old chat" checkbox that doesn't exist in the reference at all
                     (dead field, read nowhere else in this project either), and 2 catalog-preference
                     checkboxes (place-multiple-objects/skip-purchase-confirmation) that ARE real
                     reference hooks (confirmed in their own bundle, CATALOG_PLACE_MULTIPLE_OBJECTS/
                     CATALOG_SKIP_PURCHASE_CONFIRMATION) but surfaced elsewhere on the reference (the
                     Catalog purchase flow itself), never as a Settings checkbox - removed both to
                     match. Added the real, previously entirely-missing "dark theme" toggle (see
                     toggleDarkMode's own comment for why it's wired client-only, not via a composer). */ }
                <Column gap={ 1 }>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="checkbox" checked={ darkMode } onChange={ event => toggleDarkMode(event.target.checked) } />
                        <Text>Dark theme</Text>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="checkbox" checked={ userSettings.roomInvites } onChange={ event => processAction('room_invites', event.target.checked) } />
                        <Text>{ LocalizeText('memenu.settings.other.ignore.room.invites') }</Text>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="checkbox" checked={ userSettings.cameraFollow } onChange={ event => processAction('camera_follow', event.target.checked) } />
                        <Text>{ LocalizeText('memenu.settings.other.disable.room.camera.follow') }</Text>
                    </Flex>
                </Column>
                <Column gap={ 2 }>
                    <Flex alignItems="center" justifyContent="between">
                        <Text bold>Change profile cover</Text>
                        { /* Real reference element here is an info icon (.icon-navigator-info) with a
                             real hover-triggered Overlay/Popover ("BU" in the minified bundle) - two
                             earlier live interaction tests (a click, then a CDP-simulated hover) both
                             came back with zero observable effect, wrongly concluding this was inert
                             like `.icon-rooms`/`FaRecycle` elsewhere - the real mechanism only
                             surfaced by reading the component's own source directly, which is why this
                             file briefly rendered it bare with no tooltip at all in between. See
                             UserSettingsCoverInfoView.tsx for the real content and the exact already-
                             established Overlay/Popover pattern this reuses from
                             NavigatorSearchResultItemInfoView.tsx (same icon class, different
                             context). */ }
                        <UserSettingsCoverInfoView size={ COVER_SIZE } />
                    </Flex>
                    <Flex gap={ 1 } className="user-settings-button-group">
                        <Button disabled={ coverBusy } onClick={ openCoverFilePicker }>Change</Button>
                        <Button onClick={ deleteCover }>Delete</Button>
                    </Flex>
                    <input type="file" accept="image/*" ref={ coverFileInputRef } onChange={ onCoverFileSelected } style={ { display: 'none' } } />
                    { coverError && <Text small textBreak variant="danger">{ coverError }</Text> }
                    { coverSuccess && <Text small textBreak variant="success">{ coverSuccess }</Text> }
                </Column>
                <Column gap={ 2 }>
                    <Text bold>{ LocalizeText('widget.memenu.settings.volume') }</Text>
                    <Column gap={ 1 }>
                        <Text>{ LocalizeText('widget.memenu.settings.volume.ui') }</Text>
                        { /* Real bug fixed here: found live via a direct width comparison against the
                             reference - this row used gap={1} (4px), but the reference's own real row
                             is gap-3 (16px), confirmed live. With a smaller gap eating less horizontal
                             space, the slider (which fills whatever's left after its sibling icons)
                             claimed 12px more than it should have, throwing off its real proportions
                             relative to the reference (176px vs our 197px in an identical 230px row). */ }
                        <Flex alignItems="center" gap={ 3 }>
                            { (userSettings.volumeSystem === 0) && <FaVolumeMute className={ classNames((userSettings.volumeSystem >= 50) && 'text-muted', 'fa-icon') } /> }
                            { (userSettings.volumeSystem > 0) && <FaVolumeDown className={ classNames((userSettings.volumeSystem >= 50) && 'text-muted', 'fa-icon') } /> }
                            <CustomInputRange min={ 0 } max={ 100 } step={ 1 } value={ userSettings.volumeSystem } onChange={ value => processAction('system_volume', value) } onChangeComplete={ () => saveRangeSlider('volume') } />
                            <FaVolumeUp className={ classNames((userSettings.volumeSystem < 50) && 'text-muted', 'fa-icon') } />
                        </Flex>
                    </Column>
                    <Column gap={ 1 }>
                        <Text>{ LocalizeText('widget.memenu.settings.volume.furni') }</Text>
                        <Flex alignItems="center" gap={ 3 }>
                            { (userSettings.volumeFurni === 0) && <FaVolumeMute className={ classNames((userSettings.volumeFurni >= 50) && 'text-muted', 'fa-icon') } /> }
                            { (userSettings.volumeFurni > 0) && <FaVolumeDown className={ classNames((userSettings.volumeFurni >= 50) && 'text-muted', 'fa-icon') } /> }
                            <CustomInputRange min={ 0 } max={ 100 } step={ 1 } value={ userSettings.volumeFurni } onChange={ value => processAction('furni_volume', value) } onChangeComplete={ () => saveRangeSlider('volume') } />
                            <FaVolumeUp className={ classNames((userSettings.volumeFurni < 50) && 'text-muted', 'fa-icon') } />
                        </Flex>
                    </Column>
                    <Column gap={ 1 }>
                        <Text>{ LocalizeText('widget.memenu.settings.volume.trax') }</Text>
                        <Flex alignItems="center" gap={ 3 }>
                            { (userSettings.volumeTrax === 0) && <FaVolumeMute className={ classNames((userSettings.volumeTrax >= 50) && 'text-muted', 'fa-icon') } /> }
                            { (userSettings.volumeTrax > 0) && <FaVolumeDown className={ classNames((userSettings.volumeTrax >= 50) && 'text-muted', 'fa-icon') } /> }
                            <CustomInputRange min={ 0 } max={ 100 } step={ 1 } value={ userSettings.volumeTrax } onChange={ value => processAction('trax_volume', value) } onChangeComplete={ () => saveRangeSlider('volume') } />
                            <FaVolumeUp className={ classNames((userSettings.volumeTrax < 50) && 'text-muted', 'fa-icon') } />
                        </Flex>
                    </Column>
                </Column>
                </Column>
                </ScrollContainer> }
                { (activeTab === 1) &&
                    <UserSettingsFloorView /> }
                { (activeTab === 4) &&
                    <UserSettingsPerformanceView /> }
                { (activeTab === 2) &&
                    <UserSettingsModerateView /> }
                { /* own feature: every personal on/off command (:nomention, :noaura, ...) as a switch */ }
                { (activeTab === 3) &&
                    <UserSettingsOptionsView /> }
            </NitroCardContentView> }
            { pendingCoverImage &&
                <NitroCardContentView className="user-settings-crop-container">
                    <Column shrink fullHeight justifyContent="between">
                        <Text bold>Position the image</Text>
                        <ProfileCoverCropWidgetView sourceImage={ pendingCoverImage } wantedSize={ COVER_SIZE } onUpdate={ setCroppedCoverCanvas } backgroundFillColor="#3b435c" overlayContent={ coverPreviewOverlay } updateFrequency={ 25 } />
                        <Text bold>Result</Text>
                        <div className="cropping-result" style={ { backgroundColor: '#3b435c' } }>
                            { coverPreviewOverlay }
                            { croppedCoverCanvas &&
                                <div className="cover-result" style={ { backgroundImage: `url(${ croppedCoverCanvas.toDataURL('image/png') })` } } /> }
                        </div>
                        <Flex className="user-settings-button-group" gap={ 1 }>
                            <Button variant="danger" onClick={ cancelCoverCrop }>Cancel</Button>
                            <Button onClick={ confirmCoverCrop }>Confirm</Button>
                        </Flex>
                    </Column>
                </NitroCardContentView> }
        </NitroCardView>
    );
}
