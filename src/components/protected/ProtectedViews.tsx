import { FC, Suspense, useEffect } from 'react';
import { GetSessionDataManager, SendMessageComposer } from '../../api';
import { ChunkTokenEvent, ChunkTokenRequestComposer, RegisterChunkAccessMessages } from '../../api/chunk/ChunkAccessProtocol';
import { RegisterStaffPinMessages, StaffPinStateEvent } from '../../api/staffpin/StaffPinProtocol';
import { useMessageEvent, useNotification } from '../../hooks';
import { PreloadStaffViews } from '../mod-tools/ModToolsStaffViews';
import { LoadProtected, SetChunkLevel, SetProtectedFailureListener, SetProtectedReady, useChunkLevel } from './LoadProtected';

const EDITOR_LEVEL = 7;
const DEALER_LEVEL = 4;

const ShopView = LoadProtected(() => import('../shop/ShopView').then(m => m.ShopView));
const ShopAuraSync = LoadProtected(() => import('../shop/ShopAuraSync').then(m => m.ShopAuraSync));
const ShopBubbleSync = LoadProtected(() => import('../shop/ShopBubbleSync').then(m => m.ShopBubbleSync));
const ShopSpawnPlayer = LoadProtected(() => import('../shop/ShopSpawnPlayer').then(m => m.ShopSpawnPlayer));
const EventAlertView = LoadProtected(() => import('../event-alert/EventAlertView').then(m => m.EventAlertView));
const CommandConfirmView = LoadProtected(() => import('../commands/CommandConfirmView').then(m => m.CommandConfirmView));
const ListConfirmView = LoadProtected(() => import('../commands/ListConfirmView').then(m => m.ListConfirmView));
const AreaHideView = LoadProtected(() => import('../room-tools/AreaHideView').then(m => m.AreaHideView));
const BuilderToolbarView = LoadProtected(() => import('../builder-toolbar/BuilderToolbarView').then(m => m.BuilderToolbarView));
const ClothesShopView = LoadProtected(() => import('../clothes-shop/ClothesShopView').then(m => m.ClothesShopView));
const HabboPassView = LoadProtected(() => import('../habbopass/HabboPassView').then(m => m.HabboPassView));
const ClientDockView = LoadProtected(() => import('../client-dock/ClientDockView').then(m => m.ClientDockView));
const RoomYoutubeView = LoadProtected(() => import('../room-youtube/RoomYoutubeView').then(m => m.RoomYoutubeView));
const HotelInfoView = LoadProtected(() => import('../hotel-info/HotelInfoView').then(m => m.HotelInfoView));
const ForceVoteView = LoadProtected(() => import('../findretros-vote/ForceVoteView').then(m => m.ForceVoteView));
const BugReportView = LoadProtected(() => import('../bug-report/BugReportView').then(m => m.BugReportView));
const CreatorView = LoadProtected(() => import('../creator/CreatorView').then(m => m.CreatorView));
const AutomatView = LoadProtected(() => import('../automat/AutomatView').then(m => m.AutomatView));
const CasinoView = LoadProtected(() => import('../casino/CasinoView').then(m => m.CasinoView));
const CasinoDealersView = LoadProtected(() => import('../casino/CasinoDealersView').then(m => m.CasinoDealersView));
const PrisonerPanelView = LoadProtected(() => import('../prison/PrisonerPanelView').then(m => m.PrisonerPanelView));
const LottoLiveView = LoadProtected(() => import('../lotto-live/LottoLiveView').then(m => m.LottoLiveView));
const UserProfileModerationView = LoadProtected(() => import('../user-profile/UserProfileModerationView').then(m => m.UserProfileModerationView));
const RanchView = LoadProtected(() => import('../ranch/RanchView').then(m => m.RanchView));
const CasinoDealerSettingsView = LoadProtected(() => import('../casino/CasinoDealerSettingsView').then(m => m.CasinoDealerSettingsView));
const FurniEditorView = LoadProtected(() => import('../furni-editor/FurniEditorView').then(m => m.FurniEditorView));

const PLAYER_VIEWS = [ AreaHideView, ShopView, ShopAuraSync, ShopBubbleSync, ShopSpawnPlayer, EventAlertView, CommandConfirmView, ListConfirmView, BuilderToolbarView, ClothesShopView, HabboPassView, ClientDockView, RoomYoutubeView, HotelInfoView, ForceVoteView, BugReportView, CreatorView, AutomatView, CasinoView, CasinoDealersView, PrisonerPanelView, LottoLiveView, RanchView, UserProfileModerationView ];

const writeCookie = (token: string, lifetime: number) =>
{
    document.cookie = `hcms_ct=${ token }; Path=/assets; Max-Age=${ lifetime }; Secure; SameSite=Strict`;
}

const FAST_RETRIES = 10;
const FAST_DELAY = 6000;
const SLOW_DELAY = 30000;

let retryTimer = 0;
let attempts = 0;

const requestToken = () =>
{
    window.clearTimeout(retryTimer);
    SendMessageComposer(new ChunkTokenRequestComposer());

    attempts++;
    retryTimer = window.setTimeout(requestToken, (attempts < FAST_RETRIES) ? FAST_DELAY : SLOW_DELAY);
}

const stopRetrying = () =>
{
    window.clearTimeout(retryTimer);
    attempts = 0;
}

export const ProtectedViews: FC<{}> = props =>
{
    const level = useChunkLevel();
    const { showConfirm = null } = useNotification();

    RegisterChunkAccessMessages();
    RegisterStaffPinMessages();

    useMessageEvent<ChunkTokenEvent>(ChunkTokenEvent, event =>
    {
        const parser = event.getParser();

        if(!parser.token) return;

        stopRetrying();
        writeCookie(parser.token, parser.lifetime);
        SetChunkLevel(parser.level);
        Promise.all(PLAYER_VIEWS.map(view => view.preload())).then(SetProtectedReady);
        PreloadStaffViews(parser.level);

        if(parser.level >= EDITOR_LEVEL) FurniEditorView.preload();
    });

    useMessageEvent<StaffPinStateEvent>(StaffPinStateEvent, event =>
    {
        if(import.meta.env.DEV || event.getParser().locked) return;

        if(level > 0 && level < GetSessionDataManager().securityLevel)
        {
            stopRetrying();
            requestToken();
        }
    });

    useEffect(() =>
    {
        if(import.meta.env.DEV)
        {
            Promise.all(PLAYER_VIEWS.map(view => view.preload())).then(SetProtectedReady);
            PreloadStaffViews(level);

            return;
        }

        requestToken();

        return () => stopRetrying();
    }, []);

    useEffect(() =>
    {
        SetProtectedFailureListener(() => showConfirm('Part of the hotel did not load. Reload now to get it back; you stay logged in.', () => window.location.reload(), null, 'Reload', 'Later', 'Hotel'));

        return () => SetProtectedFailureListener(null);
    }, [ showConfirm ]);

    return (
        <>
            { (level > 0) && PLAYER_VIEWS.map((View, index) => <Suspense key={ index } fallback={ null }><View /></Suspense>) }
            { (level >= DEALER_LEVEL) && <Suspense fallback={ null }><CasinoDealerSettingsView /></Suspense> }
            { (level >= EDITOR_LEVEL) && <Suspense fallback={ null }><FurniEditorView /></Suspense> }
        </>
    );
}
