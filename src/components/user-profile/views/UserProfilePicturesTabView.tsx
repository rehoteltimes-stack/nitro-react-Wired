import { UserProfileParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetConfiguration, LocalizeText, ProfilePictureData, ProfilePicturesDataEvent, ProfilePicturesRequestComposer, RegisterProfilePicturesMessages, SendMessageComposer } from '../../../api';
import { AutoGrid, LayoutLoadingSpinnerView, ScrollContainer } from '../../../common';
import { useMessageEvent } from '../../../hooks';
import { InventoryCategoryEmptyView } from '../../inventory/views/InventoryCategoryEmptyView';

interface UserProfilePicturesTabViewProps
{
    userProfile: UserProfileParser;
}

// Real reference feature (PU in the minified HabboCity client source): a grid of the profile owner's
// photos published to their web profile - genuinely already-working Octane data (Arcturus core's own
// stock camera_web table, see ProfilePicturesProtocol.java's own doc comment), this pass only exposes a
// read path for it. Real reference states: loading spinner, "no photos yet", and the populated grid -
// all three real, not guessed. The reference's own "private photos" empty state has no real backing
// anywhere in this project's stack (no privacy-toggle column found) - flagged, not built, so this
// project's own gallery is always public, matching the account's real data honestly rather than faking
// a toggle that doesn't exist yet.
export const UserProfilePicturesTabView: FC<UserProfilePicturesTabViewProps> = props =>
{
    const { userProfile } = props;

    // Real bug fixed here, same root cause/fix shape as hooks/inventory/useInventoryBanner.ts's own
    // documented one: this must run synchronously in the component body, before the useMessageEvent
    // hook below - React commits effects in hook-declaration order, so if this were called from a
    // useEffect (as it originally was) it would run AFTER useMessageEvent's own internal subscription
    // effect, which resolves the real network header via getEventId() at subscribe time. Registering
    // too late means getEventId() returns -1 and the subscription silently no-ops, so the real 9536
    // response arrives with zero live listeners and is dropped - the spinner then never resolves, with
    // no client or server error either. RegisterProfilePicturesMessages() is idempotent.
    RegisterProfilePicturesMessages();

    const [ pictures, setPictures ] = useState<ProfilePictureData[]>(null);

    useMessageEvent<ProfilePicturesDataEvent>(ProfilePicturesDataEvent, event =>
    {
        const parser = event.getParser();

        if(parser.userId !== userProfile.id) return;

        setPictures(parser.pictures);
    });

    useEffect(() =>
    {
        setPictures(null);

        SendMessageComposer(new ProfilePicturesRequestComposer(userProfile.id));
    }, [ userProfile ]);

    if(!pictures) return <LayoutLoadingSpinnerView />;

    // Real reference empty state (CDP-verified via the real minified bundle, index-b7d2b6d3.js:
    // `n&&!(n!=null&&n.isPrivate)&&(n==null?void 0:n.pictureCount)===0&&t(Nl,{title:"Pas de photos!",
    // desc:"Cet utilisateur ne possède pas encore de photos."})`). The reference also has a distinct
    // isPrivate branch ("Photos privées!") - not built, same documented reason as before: no privacy-
    // toggle column exists anywhere in this project's own stack, so there is no real state to drive it
    // from. desc uses the one confirmed-real locale key found in ExternalTexts.json
    // (avatar.profile.photos.empty); no separate title key was found for "Pas de photos!" specifically,
    // so the title stays a plain, honest literal translation rather than an invented key.
    if(pictures.length === 0) return <InventoryCategoryEmptyView title="No photos!" desc={ LocalizeText('avatar.profile.photos.empty') } />;

    // Real reference structure (CDP-verified against habbocity.fr's own live Photos tab): the grid
    // sits inside the same .scroll-container/.scroll-bar custom-scrollbar chrome used elsewhere
    // (Catalog's furni grid, Navigator's results list) - h-100/overflow-hidden/grid/gap-2, a single
    // .scroll-content.vertical child wrapping the AutoGrid. The image src itself is NOT the raw stored
    // value - the reference builds it as `${camera.url config}/${a.url}.png` (confirmed: the stored
    // camera_web.url value is a bare id with no host/extension, same as CameraWidgetCheckoutView.tsx's
    // own already-working use of the same camera.url config for a different camera flow). Passing
    // picture.url directly as src (the original guess) would have rendered a broken relative path for
    // every real photo.
    return (
        <ScrollContainer className="h-100">
            <AutoGrid columnCount={ 3 } columnMinWidth={ 100 } columnMinHeight={ 100 } justifyContent="start">
                { pictures.map((picture, index) => <img key={ index } className="profile-picture-entry" src={ `${ GetConfiguration<string>('camera.url') }/${ picture.url }.png` } alt="" />) }
            </AutoGrid>
        </ScrollContainer>
    );
}
