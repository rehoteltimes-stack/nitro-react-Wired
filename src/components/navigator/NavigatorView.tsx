import { ConvertGlobalRoomIdMessageComposer, HabboWebTools, ILinkEventTracker, LegacyExternalInterface, NavigatorInitComposer, NavigatorSearchComposer, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { AddEventLinkTracker, LocalizeText, RemoveLinkEventTracker, SendMessageComposer, TryVisitRoom, VisitNavigatorRoom } from '../../api';
import { Flex, HoloButton, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, ScrollContainer } from '../../common';
import { useNavigator, useRoomSessionManagerEvent } from '../../hooks';
import { NavigatorDoorStateView } from './views/NavigatorDoorStateView';
import { NavigatorRoomCreatorView } from './views/NavigatorRoomCreatorView';
import { NavigatorRoomInfoView } from './views/NavigatorRoomInfoView';
import { NavigatorRoomLinkView } from './views/NavigatorRoomLinkView';
import { NavigatorRoomSettingsView } from './views/room-settings/NavigatorRoomSettingsView';
import { NavigatorSearchResultView } from './views/search/NavigatorSearchResultView';
import { NavigatorSearchView } from './views/search/NavigatorSearchView';

export const NavigatorView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ isReady, setIsReady ] = useState(false);
    const [ isCreatorOpen, setCreatorOpen ] = useState(false);
    const [ isRoomInfoOpen, setRoomInfoOpen ] = useState(false);
    const [ isRoomLinkOpen, setRoomLinkOpen ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ needsInit, setNeedsInit ] = useState(true);
    const [ needsSearch, setNeedsSearch ] = useState(false);
    const { searchResult = null, topLevelContext = null, topLevelContexts = null, navigatorData = null, setDoorData = null } = useNavigator();
    const pendingSearch = useRef<{ value: string, code: string }>(null);
    const resultsRef = useRef<HTMLDivElement>();

    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.CREATED, event =>
    {
        setIsVisible(false);
        setCreatorOpen(false);
    });

    const sendSearch = useCallback((searchValue: string, contextCode: string) =>
    {
        setCreatorOpen(false);

        SendMessageComposer(new NavigatorSearchComposer(contextCode, searchValue));

        setIsLoading(true);
    }, []);

    const reloadCurrentSearch = useCallback(() =>
    {
        if(!isReady)
        {
            setNeedsSearch(true);

            return;
        }

        if(pendingSearch.current)
        {
            sendSearch(pendingSearch.current.value, pendingSearch.current.code);

            pendingSearch.current = null;

            return;
        }

        if(searchResult)
        {
            sendSearch(searchResult.data, searchResult.code);

            return;
        }

        if(!topLevelContext) return;

        sendSearch('', topLevelContext.code);
    }, [ isReady, searchResult, topLevelContext, sendSearch ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show': {
                        setIsVisible(true);
                        setNeedsSearch(true);
                        return;
                    }
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle': {
                        if(isVisible)
                        {
                            setIsVisible(false);

                            return;
                        }

                        setIsVisible(true);
                        setNeedsSearch(true);
                        return;
                    }
                    case 'toggle-room-info':
                        setRoomInfoOpen(value => !value);
                        return;
                    case 'toggle-room-link':
                        setRoomLinkOpen(value => !value);
                        return;
                    case 'goto':
                        if(parts.length <= 2) return;

                        switch(parts[2])
                        {
                            case 'home':
                                if(navigatorData.homeRoomId <= 0) return;

                                TryVisitRoom(navigatorData.homeRoomId);
                                break;
                            default: {
                                const roomId = parseInt(parts[2]);

                                TryVisitRoom(roomId);
                            }
                        }
                        return;
                    case 'create':
                        setIsVisible(true);
                        setCreatorOpen(true);
                        return;
                    case 'search':
                        if(parts.length > 2)
                        {
                            const topLevelContextCode = parts[2];

                            let searchValue = '';

                            if(parts.length > 3) searchValue = parts[3];

                            pendingSearch.current = { value: searchValue, code: topLevelContextCode };

                            setIsVisible(true);
                            setNeedsSearch(true);
                        }
                        return;
                }
            },
            eventUrlPrefix: 'navigator/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ isVisible, navigatorData ]);

    useEffect(() =>
    {
        if(!searchResult) return;

        setIsLoading(false);

        if(resultsRef.current) resultsRef.current.scrollTop = 0;
    }, [ searchResult ]);

    useEffect(() =>
    {
        if(!isVisible || !isReady || !needsSearch) return;

        reloadCurrentSearch();

        setNeedsSearch(false);
    }, [ isVisible, isReady, needsSearch, reloadCurrentSearch ]);

    useEffect(() =>
    {
        if(isReady || !topLevelContext) return;

        setIsReady(true);
    }, [ isReady, topLevelContext ]);

    useEffect(() =>
    {
        if(!isVisible || !needsInit) return;

        SendMessageComposer(new NavigatorInitComposer());

        setNeedsInit(false);
    }, [ isVisible, needsInit ]);

    useEffect(() =>
    {
        LegacyExternalInterface.addCallback(HabboWebTools.OPENROOM, (k: string, _arg_2: boolean = false, _arg_3: string = null) => SendMessageComposer(new ConvertGlobalRoomIdMessageComposer(k)));
    }, []);

    // "navigator.random.room" ("Somewhere new"): the reference closes the navigator and visits a random room out of
    // whatever is currently loaded - not a dedicated server request (confirmed live: clicking it sends no packet).
    const visitRandomRoom = () =>
    {
        if(!searchResult) return;

        const rooms = searchResult.results.flatMap(result => result.rooms);

        if(!rooms.length) return;

        VisitNavigatorRoom(rooms[Math.floor(Math.random() * rooms.length)], setDoorData);
    }

    if(!isVisible)
    {
        return (
            <>
                <NavigatorDoorStateView />
                { isRoomInfoOpen && <NavigatorRoomInfoView onCloseClick={ () => setRoomInfoOpen(false) } /> }
                { isRoomLinkOpen && <NavigatorRoomLinkView onCloseClick={ () => setRoomLinkOpen(false) } /> }
                <NavigatorRoomSettingsView />
            </>
        );
    }

    return (
        <>
            <NitroCardView uniqueKey="navigator" resize="vertical" overflow="visible" className="nitro-navigator">
                <NitroCardHeaderView headerText={ LocalizeText(isCreatorOpen ? 'navigator.createroom.title' : 'navigator.title') } onCloseClick={ event => setIsVisible(false) } />
                <NitroCardContentView position="relative">
                    { !isCreatorOpen &&
                        <>
                            <NavigatorSearchView sendSearch={ sendSearch } />
                            <NitroCardTabsView>
                                { topLevelContexts && (topLevelContexts.length > 0) && topLevelContexts.map((context, index) =>
                                    <NitroCardTabsItemView key={ index } isActive={ (topLevelContext === context) && !isCreatorOpen } onClick={ event => sendSearch('', context.code) }>
                                        { LocalizeText('navigator.toplevelview.' + context.code) }
                                    </NitroCardTabsItemView>) }
                            </NitroCardTabsView>
                            <ScrollContainer innerRef={ resultsRef } className="flex-grow-1">
                                { searchResult && searchResult.results.map((result, index) => <NavigatorSearchResultView key={ index } searchResult={ result } />) }
                            </ScrollContainer>
                            <Flex shrink fullWidth gap={ 2 }>
                                <HoloButton fullWidth onClick={ event => visitRandomRoom() } text={ LocalizeText('navigator.random.room') } variant="primary" iconClass="icon-navigator-visit-rooms" />
                                <HoloButton fullWidth onClick={ event => setCreatorOpen(true) } text={ LocalizeText('navigator.createroom') } variant="success" iconClass="icon-navigator-create-room" />
                            </Flex>
                        </> }
                    { isCreatorOpen && <NavigatorRoomCreatorView /> }
                </NitroCardContentView>
            </NitroCardView>
            <NavigatorDoorStateView />
            { isRoomInfoOpen && <NavigatorRoomInfoView onCloseClick={ () => setRoomInfoOpen(false) } /> }
            { isRoomLinkOpen && <NavigatorRoomLinkView onCloseClick={ () => setRoomLinkOpen(false) } /> }
            <NavigatorRoomSettingsView />
        </>
    );
}
