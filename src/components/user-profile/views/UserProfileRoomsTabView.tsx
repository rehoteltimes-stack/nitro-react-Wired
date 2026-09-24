import { NavigatorSearchComposer, UserProfileParser } from '@nitrots/nitro-renderer';
import { FC, useEffect } from 'react';
import { SendMessageComposer } from '../../../api';
import { ScrollContainer } from '../../../common';
import { useNavigator } from '../../../hooks';
import { NavigatorSearchResultView } from '../../navigator/views/search/NavigatorSearchResultView';

interface UserProfileRoomsTabViewProps
{
    userProfile: UserProfileParser;
}

// Real reference: the "Apparts" tab (MU in the minified source) sends a real NavigatorSearchComposer with
// code "profile_view" and query `owner:${username}` - reusing this project's own already-working Navigator
// search/results pipeline (NavigatorSearchComposer -> NavigatorSearchEvent -> useNavigator().searchResult ->
// NavigatorSearchResultView), not a separate mechanism. Real, documented limitation: useNavigator() is a
// single shared (useBetween) store app-wide, same one the main Navigator window itself uses - if both the
// Navigator and a profile are open at once, this request's response briefly overwrites the Navigator's own
// displayed results too (both listen to the same NavigatorSearchEvent). Filtering by code==="profile_view"
// below stops US from rendering the WRONG result set, but doesn't stop the Navigator itself from flashing
// this one - a real architectural gap in the shared hook, not something to silently patch around here.
//
// Real bug fixed here (found live against the reference, confirmed via the minified source too): this was
// rendering NavigatorSearchResultView with its default header/toggle behavior, which reads its title from
// searchResult.code's locale lookup - since "profile_view" isn't a real navigator code, that lookup falls
// through to searchResult.data (the server's own literal echo, e.g. "Text Search"), producing a wrong-
// looking header, plus a live, working expand/collapse toggle the reference's own profile tab doesn't have.
// The real reference (`VI` in the minified bundle) passes two extra props into this exact same shared
// component instead of using a separate one: `fromProfile:!0` (disables the collapse toggle entirely -
// confirmed live, the reference's profile Rooms-tab header has no +/- icon and clicking it does nothing)
// and `setCategoryTitle:\`Appartements de ${username}\`` (a literal override string hardcoded in their own
// source, not a LocalizeText key - matched here with a plain English literal for the same reason the Photos
// tab's own empty-state title has no confirmed key). Also missing: the real `.scroll-container` wrapper
// (confirmed via live DOM capture of the reference's own Apparts panel) - was a plain Column overflow="auto".
export const UserProfileRoomsTabView: FC<UserProfileRoomsTabViewProps> = props =>
{
    const { userProfile } = props;
    const { searchResult = null } = useNavigator();

    useEffect(() =>
    {
        SendMessageComposer(new NavigatorSearchComposer('profile_view', `owner:${ userProfile.username }`));
    }, [ userProfile ]);

    if(!searchResult || (searchResult.code !== 'profile_view')) return null;

    return (
        <ScrollContainer className="h-100">
            { searchResult.results.map((result, index) => <NavigatorSearchResultView key={ index } searchResult={ result } fromProfile categoryTitle={ `${ userProfile.username }'s Rooms` } />) }
        </ScrollContainer>
    );
}
