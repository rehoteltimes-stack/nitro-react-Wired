import { NitroCommunicationDemoEvent, NitroConfiguration, SocketConnection } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { CreateRoomSession, GetConfiguration, GetConnection, GetRoomSession, RegisterReconnectMessages, ReconnectTicketEvent, ReconnectTicketRequestComposer, SendMessageComposer } from '../../api';
import { Base, Button, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useMainEvent, useMessageEvent } from '../../hooks';

const STORAGE_KEY = 'hcms:reconnect';
const REENTER_DELAY = 500;
const MAX_ATTEMPTS = 3;

SocketConnection.MAX_RECONNECT_ATTEMPTS = MAX_ATTEMPTS;
SocketConnection.BASE_RECONNECT_DELAY_MS = 10000;

// Seamless reconnect, like MetroHotel's client (read from their minified app `P63` + renderer `Is`, 2026-09-29):
//  - the renderer re-opens a dropped socket by itself and logs in again (SocketConnection patch); the ticket it logs in
//    with is a reconnect ticket this view asks the server for after every login (plugin ReconnectTicket, 9614 / 9613),
//    because the website's SSO ticket only works once. The ticket is also kept in sessionStorage, so a page reload of
//    the same client URL (whose own ?sso= is spent) logs in with it (see index.html's NitroConfig);
//  - the room you were in is remembered when the connection drops and entered again 500ms after the new login;
//  - while it is gone a "Connection lost" card is shown over the dimmed client (theirs: `connection-lost-card`, 360px,
//    no close button, not draggable, green reconnect button = reload), with an offline / back online text.
export const ReconnectView: FC<{}> = props =>
{
    const [ isLost, setIsLost ] = useState(false);
    const [ message, setMessage ] = useState('The connection to the server was interrupted. Reconnecting...');
    const [ gaveUp, setGaveUp ] = useState(false);
    const [ attempt, setAttempt ] = useState(1);
    const roomRef = useRef<{ roomId: number, password: string }>(null);

    RegisterReconnectMessages();

    // braces: returns nothing, so an effect calling it doesn't hand React a boolean as its clean-up
    const requestTicket = () => { SendMessageComposer(new ReconnectTicketRequestComposer()); };

    useMessageEvent<ReconnectTicketEvent>(ReconnectTicketEvent, event =>
    {
        const ticket = event.getParser().ticket;

        if(!ticket) return;

        NitroConfiguration.setValue('sso.ticket', ticket);

        try
        {
            const urlTicket = new URLSearchParams(window.location.search).get('sso') || null;

            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ urlTicket, ticket }));
            window.sessionStorage.removeItem('hcms:reconnect-try');
        }
        catch(error) {}
    });

    // already logged in when this mounts: ask for the first reconnect ticket
    useEffect(() => requestTicket(), []);

    useMainEvent<NitroCommunicationDemoEvent>(NitroCommunicationDemoEvent.CONNECTION_CLOSED, event =>
    {
        const session = GetRoomSession();

        if(session && (session.roomId > 0) && !roomRef.current) roomRef.current = { roomId: session.roomId, password: ((session as unknown as { password?: string }).password || null) };

        setMessage(navigator.onLine ? 'The connection to the server was interrupted. Reconnecting...' : 'You lost your internet connection. Reconnecting as soon as it is back...');
        setIsLost(true);
    });

    // the renderer stops when the server keeps refusing the ticket (e.g. the website started a new session because the
    // account logged in somewhere else) or after its last attempt: then the card offers to reopen the hotel page
    useEffect(() =>
    {
        if(!isLost) return;

        const interval = setInterval(() =>
        {
            const connection = GetConnection() as unknown as { isGaveUp?: boolean, _reconnectAttempt?: number };

            setAttempt(Math.min(MAX_ATTEMPTS, Math.max(1, connection?._reconnectAttempt ?? 1)));

            if(!connection?.isGaveUp) return;

            clearInterval(interval);

            try { window.sessionStorage.removeItem(STORAGE_KEY); }
            catch(error) {}

            setGaveUp(true);
            setMessage('Your session has ended, maybe because you logged in somewhere else. Open the hotel again to continue.');
        }, 500);

        return () => clearInterval(interval);
    }, [ isLost ]);

    // reopens the website's hotel page (it hands out a fresh login ticket); the client runs inside that page's iframe
    const reopenHotel = () =>
    {
        const hotelUrl = `${ GetConfiguration<string>('url.prefix', '') }/hotel`;

        try
        {
            if(window.top !== window.self) { window.top.location.href = hotelUrl; return; }
        }
        catch(error) {}

        window.location.href = hotelUrl;
    }

    useMainEvent<NitroCommunicationDemoEvent>(NitroCommunicationDemoEvent.CONNECTION_AUTHENTICATED, event =>
    {
        setIsLost(false);
        setGaveUp(false);
        setAttempt(1);
        requestTicket();

        const room = roomRef.current;

        roomRef.current = null;

        if(room) setTimeout(() => CreateRoomSession(room.roomId, room.password), REENTER_DELAY);
    });

    useEffect(() =>
    {
        const offline = () => setMessage('You lost your internet connection. Reconnecting as soon as it is back...');
        const online = () => setMessage('Internet connection is back. Reconnecting...');

        window.addEventListener('offline', offline);
        window.addEventListener('online', online);

        return () =>
        {
            window.removeEventListener('offline', offline);
            window.removeEventListener('online', online);
        };
    }, []);

    if(!isLost) return null;

    return (
        <Base fit position="absolute" className="reconnect-overlay top-0 start-0 d-flex align-items-center justify-content-center">
            <NitroCardView uniqueKey="connection-lost" theme="primary" className="connection-lost-card" disableDrag={ true }>
                <NitroCardHeaderView headerText="Connection lost" noCloseButton={ true } onCloseClick={ null } />
                <NitroCardContentView gap={ 2 } className="text-center">
                    <div className="fw-bold">Oops, you were disconnected.</div>
                    <div>{ message }</div>
                    { !gaveUp && <div className="small">Attempt { attempt } of { MAX_ATTEMPTS }</div> }
                    { gaveUp
                        ? <Button variant="success" className="mt-2" onClick={ reopenHotel }>Open the hotel</Button>
                        : <Button variant="success" className="mt-2" onClick={ () => window.location.reload() }>Reconnect</Button> }
                </NitroCardContentView>
            </NitroCardView>
        </Base>
    );
}
