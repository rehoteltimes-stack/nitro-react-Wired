import { GetTicker, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaCompress, FaExpand, FaTimes, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { ChatEntryType, GetRoomEngine, GetRoomSession, GetUserProfile } from '../../api';
import { GetVideoTvScreen, IVideoTvState, VIDEO_TV_PAUSED, VIDEO_TV_PLAYING, VideoTvYoutubeId } from '../../api/videotv/VideoTvProtocol';
import { IVideoTvAudio, useChatHistory, useRoom, useVideoTv } from '../../hooks';

const SLANT_DEGREES = 26.565;
const CHAT_LINES = 80;

const BUTTON_STYLE: CSSProperties = { position: 'absolute', right: 4, pointerEvents: 'auto', width: 22, height: 22, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 4, background: 'rgba(0, 0, 0, 0.55)', color: '#fff', cursor: 'pointer', opacity: 0.9, zIndex: 2 };

const positionSeconds = (tv: IVideoTvState) => Math.max(0, Math.floor(((tv.state === VIDEO_TV_PLAYING) ? tv.positionMs + (Date.now() - tv.receivedAt) : tv.positionMs) / 1000));

const twitchSource = (url: string, playing: boolean, muted: boolean, seconds: number) =>
{
    try
    {
        const parsed = new URL(url);
        const parent = window.location.hostname;
        const clip = parsed.hostname.startsWith('clips.') ? parsed.pathname.split('/').filter(Boolean)[0] : (parsed.pathname.match(/\/clip\/([A-Za-z0-9_-]+)/i)?.[1] ?? parsed.searchParams.get('clip'));

        if(clip) return `https://clips.twitch.tv/embed?clip=${ encodeURIComponent(clip) }&parent=${ parent }&muted=${ muted }&autoplay=${ playing }`;

        const video = parsed.pathname.match(/\/videos\/(\d+)/i)?.[1];

        if(video) return `https://player.twitch.tv/?video=v${ video }&parent=${ parent }&muted=${ muted }&autoplay=${ playing }&time=${ Math.floor(seconds / 3600) }h${ Math.floor((seconds % 3600) / 60) }m${ seconds % 60 }s`;

        const channel = parsed.pathname.split('/').filter(Boolean)[0];

        return channel ? `https://player.twitch.tv/?channel=${ encodeURIComponent(channel) }&parent=${ parent }&muted=${ muted }&autoplay=${ playing }` : null;
    }
    catch
    {
        return null;
    }
}

const youtubeSource = (videoId: string, playing: boolean, seconds: number) => `https://www.youtube-nocookie.com/embed/${ videoId }?autoplay=${ playing ? 1 : 0 }&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&start=${ seconds }&origin=${ encodeURIComponent(window.location.origin) }`;

const VideoTvFullscreenChat: FC<{ onClose: () => void }> = props =>
{
    const { onClose } = props;
    const { chatHistory = [] } = useChatHistory();
    const { roomSession = null } = useRoom();
    const bodyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const roomId = roomSession?.roomId ?? -1;
    const lines = chatHistory.filter(entry => (entry.type === ChatEntryType.TYPE_CHAT) && ((roomId <= 0) || (entry.roomId === roomId))).slice(-CHAT_LINES);

    useEffect(() =>
    {
        if(bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [ lines.length ]);

    useEffect(() =>
    {
        const timeout = window.setTimeout(() => inputRef.current?.focus(), 50);

        return () => window.clearTimeout(timeout);
    }, []);

    const send = () =>
    {
        const text = (inputRef.current?.value ?? '').trim();

        if(!roomSession || !text.length) return;

        roomSession.sendChatMessage(text, 0);
        inputRef.current.value = '';
    }

    return (
        <div className="video-tv-fullscreen-chat">
            <div className="chat-history">
                <div className="chat-history-header">
                    <span className="chat-history-title">Chat history</span>
                    <button type="button" className="chat-history-close" title="Close video" onClick={ onClose }><FaTimes /></button>
                </div>
                <div className="chat-history-body" ref={ bodyRef }>
                    { lines.map(entry =>
                    {
                        const clickable = (entry.webId > 0);

                        return (
                            <div key={ entry.id } className={ 'chat-history-entry' + ((entry.chatType === 1) ? ' is-italic' : '') + ((entry.chatType === 2) ? ' is-bold' : '') }>
                                <div className={ 'chat-history-avatar' + (clickable ? ' is-clickable' : '') } style={ { backgroundImage: entry.imageUrl ? `url(${ entry.imageUrl })` : undefined } } onClick={ () => clickable && GetUserProfile(entry.webId) } />
                                <div className="chat-history-entry-content">
                                    <div className="chat-history-entry-line">
                                        <span className="chat-history-entry-name" onClick={ () => clickable && GetUserProfile(entry.webId) }>{ entry.name }:</span>
                                        <span className="chat-history-entry-message">{ entry.message }</span>
                                    </div>
                                    <div className="chat-history-entry-meta"><span className="chat-history-entry-time">{ entry.timestamp }</span></div>
                                </div>
                            </div>
                        );
                    }) }
                    { !lines.length && <div className="video-tv-fullscreen-chat__empty">No chat yet</div> }
                </div>
                <div className="video-tv-fullscreen-chat__input-wrap">
                    <input ref={ inputRef } type="text" className="form-control form-control-sm" placeholder="Say something..." maxLength={ 100 } onKeyDown={ event =>
                    {
                        if(event.key === 'Escape')
                        {
                            event.preventDefault();
                            onClose();
                        }

                        if(event.key === 'Enter')
                        {
                            event.preventDefault();
                            send();
                        }
                    } } />
                </div>
            </div>
        </div>
    );
}

const VideoTvFullscreenView: FC<{ itemId: number, muted: boolean, onToggleMute: () => void, onClose: () => void }> = props =>
{
    const { muted, onToggleMute, onClose } = props;

    useEffect(() =>
    {
        document.body.classList.add('video-tv-fullscreen-open');

        const onKey = (event: KeyboardEvent) =>
        {
            if(event.key !== 'Escape') return;

            event.preventDefault();
            onClose();
        }

        window.addEventListener('keydown', onKey);

        return () =>
        {
            document.body.classList.remove('video-tv-fullscreen-open');
            window.removeEventListener('keydown', onKey);
        };
    }, [ onClose ]);

    return createPortal(
        <div className="video-tv-fullscreen video-tv-fullscreen--chrome-only">
            <div className="video-tv-fullscreen__toolbar">
                <button type="button" className="video-tv-fullscreen__tool-btn" title={ muted ? 'Unmute' : 'Mute' } onClick={ onToggleMute }>{ muted ? <FaVolumeMute size={ 14 } /> : <FaVolumeUp size={ 14 } /> }</button>
                <button type="button" className="video-tv-fullscreen__tool-btn" title="Exit fullscreen" onClick={ onClose }><FaCompress size={ 14 } /></button>
            </div>
            <VideoTvFullscreenChat onClose={ onClose } />
        </div>, document.body);
}

const VideoTvScreenView: FC<{ tv: IVideoTvState, audio: IVideoTvAudio, fullscreen: boolean }> = props =>
{
    const { tv, audio, fullscreen } = props;
    const { setFullscreenId, toggleMute, control } = useVideoTv();
    const elementRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLIFrameElement>(null);
    const loadedKey = useRef('');
    const tvRef = useRef(tv);
    const audioRef = useRef(audio);
    const url = tv.urls[tv.track] ?? '';
    const videoId = VideoTvYoutubeId(url);
    const playing = (tv.state === VIDEO_TV_PLAYING);

    tvRef.current = tv;
    audioRef.current = audio;

    const command = (func: string, args: unknown[] = []) => frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');

    const applyAudio = () =>
    {
        command(audioRef.current.muted ? 'mute' : 'unMute');
        command('setVolume', [ audioRef.current.volume ]);
    }

    useEffect(() =>
    {
        const frame = frameRef.current;

        if(!frame) return;

        if(!videoId)
        {
            const key = `${ url }|${ audio.muted }|${ tv.state }`;

            if(loadedKey.current === key) return;

            loadedKey.current = key;
            frame.src = twitchSource(url, playing, audio.muted, positionSeconds(tv)) ?? 'about:blank';

            return;
        }

        const key = `${ tv.track }|${ url }`;

        if(loadedKey.current !== key)
        {
            loadedKey.current = key;
            frame.src = youtubeSource(videoId, playing, positionSeconds(tv));

            return;
        }

        command('seekTo', [ positionSeconds(tv), true ]);
        command(playing ? 'playVideo' : 'pauseVideo');
    }, [ tv, videoId, url, playing, audio.muted ]);

    useEffect(() =>
    {
        if(videoId) applyAudio();
    }, [ audio.muted, audio.volume, videoId ]);

    useEffect(() =>
    {
        const onMessage = (event: MessageEvent) =>
        {
            if(!frameRef.current || (event.source !== frameRef.current.contentWindow) || (typeof event.data !== 'string')) return;

            try
            {
                const data = JSON.parse(event.data);
                const ended = ((data.event === 'onStateChange') && (data.info === 0)) || ((data.event === 'infoDelivery') && (data.info?.playerState === 0));

                if(ended && (tvRef.current.state === VIDEO_TV_PLAYING)) control(tvRef.current.itemId, 'ended', tvRef.current.track);
            }
            catch
            {
                return;
            }
        }

        window.addEventListener('message', onMessage);

        return () => window.removeEventListener('message', onMessage);
    }, []);

    useEffect(() =>
    {
        const update = () =>
        {
            const element = elementRef.current;
            const session = GetRoomSession();

            if(!element || !session) return;

            if(fullscreen)
            {
                Object.assign(element.style, { display: 'block', left: '0px', top: '0px', width: '100%', height: '100%', transform: 'none', borderRadius: '0px', zIndex: '490' });

                return;
            }

            let category = RoomObjectCategory.FLOOR;
            let roomObject = GetRoomEngine().getRoomObject(session.roomId, tv.itemId, category);

            if(!roomObject)
            {
                category = RoomObjectCategory.WALL;
                roomObject = GetRoomEngine().getRoomObject(session.roomId, tv.itemId, category);
            }

            const location = roomObject ? GetRoomEngine().getRoomObjectScreenLocation(session.roomId, tv.itemId, category, 1) : null;
            const screen = roomObject ? GetVideoTvScreen(roomObject.type, Math.round(roomObject.getDirection().x / 45) % 8) : null;

            if(!location || !screen)
            {
                element.style.display = 'none';

                return;
            }

            const scale = ((GetRoomEngine().getRoomInstanceGeometry(session.roomId, 1)?.scale ?? 64) / 64) * (GetRoomEngine().getRoomInstanceRenderingCanvas(session.roomId, 1)?.scale ?? 1);
            const width = Math.round(screen.width * scale);

            Object.assign(element.style, {
                display: 'block',
                left: `${ Math.round(location.x + (screen.x * scale)) }px`,
                top: `${ Math.round(location.y + (screen.y * scale)) }px`,
                width: `${ width }px`,
                height: `${ Math.round(screen.height * scale) }px`,
                transform: screen.slant ? `skewY(${ screen.slant * SLANT_DEGREES }deg)` : 'none',
                borderRadius: (width < 120) ? '2px' : '3px',
                zIndex: '3'
            });
        }

        update();
        GetTicker().add(update);
        window.addEventListener('pointermove', update);
        window.addEventListener('wheel', update);

        return () =>
        {
            GetTicker().remove(update);
            window.removeEventListener('pointermove', update);
            window.removeEventListener('wheel', update);
        };
    }, [ tv.itemId, fullscreen ]);

    return (
        <>
            <div ref={ elementRef } className="video-tv-screen" style={ { position: 'fixed', display: 'none', pointerEvents: 'none', overflow: 'hidden', background: '#111', transformOrigin: '0 0' } }>
                <iframe ref={ frameRef } title={ `video-tv-${ tv.itemId }` } allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="origin-when-cross-origin" onLoad={ () =>
                {
                    frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: tv.itemId }), '*');
                    applyAudio();

                    if(tvRef.current.state === VIDEO_TV_PAUSED) command('pauseVideo');
                } } style={ { position: 'absolute', top: 0, left: '-1.01%', width: '102.02%', height: '100%', border: 0, background: '#111', display: 'block', pointerEvents: 'none', opacity: 0.999 } } />
                { !fullscreen &&
                    <>
                        <button type="button" title="Fullscreen" aria-label="Fullscreen" style={ { ...BUTTON_STYLE, top: 4 } } onClick={ () => setFullscreenId(tv.itemId) }><FaExpand size={ 11 } /></button>
                        <button type="button" title={ audio.muted ? 'Unmute' : 'Mute' } aria-label={ audio.muted ? 'Unmute' : 'Mute' } style={ { ...BUTTON_STYLE, bottom: 4 } } onClick={ () => toggleMute(tv.itemId) }>{ audio.muted ? <FaVolumeMute size={ 12 } /> : <FaVolumeUp size={ 12 } /> }</button>
                    </> }
            </div>
            { fullscreen && <VideoTvFullscreenView itemId={ tv.itemId } muted={ audio.muted } onToggleMute={ () => toggleMute(tv.itemId) } onClose={ () => setFullscreenId(-1) } /> }
        </>
    );
}

export const VideoTvOverlayView: FC<{}> = props =>
{
    const { tvs, fullscreenId, audioOf } = useVideoTv();
    const shown = Array.from(tvs.values()).filter(tv => tv.urls.length && ((tv.state === VIDEO_TV_PLAYING) || (tv.state === VIDEO_TV_PAUSED)));

    if(!shown.length) return null;

    return (
        <div className="room-video-tv-overlays">
            { shown.map(tv => <VideoTvScreenView key={ tv.itemId } tv={ tv } audio={ audioOf(tv.itemId) } fullscreen={ fullscreenId === tv.itemId } />) }
        </div>
    );
}
