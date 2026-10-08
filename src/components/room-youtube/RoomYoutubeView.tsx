import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from 'react';
import { AddEventLinkTracker, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { IRoomYoutubeState, RegisterRoomYoutubeMessages, RoomYoutubeControlComposer, RoomYoutubeStateEvent } from '../../api/youtube/RoomYoutubeProtocol';
import { useMessageEvent } from '../../hooks';

const SKIP_SECONDS = 10;
const VOLUME_KEY = 'hcms:youtube-volume';

const positionOf = (state: IRoomYoutubeState) => state.paused ? state.position : state.position + Math.floor((Date.now() - state.receivedAt) / 1000);

const readVolume = () =>
{
    try
    {
        const stored = parseInt(window.localStorage.getItem(VOLUME_KEY) ?? '', 10);

        return isNaN(stored) ? 100 : Math.max(0, Math.min(100, stored));
    }
    catch(e) { return 100; }
}

export const RoomYoutubeView: FC<{}> = props =>
{
    RegisterRoomYoutubeMessages();

    const [ state, setState ] = useState<IRoomYoutubeState>(null);
    const [ source, setSource ] = useState('');
    const [ title, setTitle ] = useState('');
    const [ stoppedVideo, setStoppedVideo ] = useState('');
    const [ boxOpen, setBoxOpen ] = useState(false);
    const [ tvOpen, setTvOpen ] = useState(false);
    const [ volume, setVolume ] = useState(readVolume);
    const [ tvPosition, setTvPosition ] = useState(null as { x: number, y: number });
    const frameRef = useRef<HTMLIFrameElement>(null);
    const loadedVideo = useRef('');
    const lastToggle = useRef(0);

    const command = (func: string, args: unknown[] = []) =>
    {
        frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
    }

    useMessageEvent<RoomYoutubeStateEvent>(RoomYoutubeStateEvent, event =>
    {
        const next = event.getParser().state;

        if(!next.videoId)
        {
            loadedVideo.current = '';
            setSource('');
            setTitle('');
            setState(null);

            return;
        }

        setState(next);

        if(next.videoId !== loadedVideo.current)
        {
            loadedVideo.current = next.videoId;
            setStoppedVideo('');
            setTitle('');
            setBoxOpen(true);
            setSource(`https://www.youtube-nocookie.com/embed/${ next.videoId }?autoplay=${ next.paused ? 0 : 1 }&start=${ next.position }&enablejsapi=1&playsinline=1&rel=0&modestbranding=1`);

            return;
        }

        command('seekTo', [ next.position, true ]);
        command(next.paused ? 'pauseVideo' : 'playVideo');
    });

    useEffect(() =>
    {
        const tracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                if(url.split('/')[1] !== 'toggle') return;

                const now = Date.now();

                if(now - lastToggle.current < 300) return;

                lastToggle.current = now;
                setBoxOpen(value => !value);
            },
            eventUrlPrefix: 'room-youtube/'
        };

        AddEventLinkTracker(tracker);

        return () => RemoveLinkEventTracker(tracker);
    }, []);

    useEffect(() =>
    {
        const onMessage = (event: MessageEvent) =>
        {
            if(!frameRef.current || (event.source !== frameRef.current.contentWindow) || (typeof event.data !== 'string')) return;

            try
            {
                const data = JSON.parse(event.data);
                const videoTitle = data?.info?.videoData?.title;

                if(videoTitle) setTitle(videoTitle);
            }
            catch(e) {}
        };

        window.addEventListener('message', onMessage);

        return () => window.removeEventListener('message', onMessage);
    }, []);

    useEffect(() =>
    {
        command('setVolume', [ volume ]);

        try { window.localStorage.setItem(VOLUME_KEY, String(volume)); }
        catch(e) {}
    }, [ volume ]);

    const playing = !!(state && source && (stoppedVideo !== state.videoId));

    const onFrameLoad = () =>
    {
        frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
        command('setVolume', [ volume ]);
        if(state?.paused) command('pauseVideo');
    }

    const control = (action: 'pause' | 'resume' | 'seek' | 'stop', seconds: number) => SendMessageComposer(new RoomYoutubeControlComposer(action, seconds));

    const stop = () =>
    {
        if(!state) return;

        if(state.roomWide && state.canControl)
        {
            control('stop', 0);

            return;
        }

        setStoppedVideo(state.videoId);
        setTvOpen(false);
    }

    const tvAt = tvPosition ?? { x: Math.max(0, window.innerWidth - 230 - 432), y: 65 };

    const startDrag = (event: ReactMouseEvent) =>
    {
        const startX = event.clientX - tvAt.x;
        const startY = event.clientY - tvAt.y;

        const move = (moveEvent: MouseEvent) => setTvPosition({ x: Math.max(0, moveEvent.clientX - startX), y: Math.max(0, moveEvent.clientY - startY) });
        const up = () =>
        {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
    }

    const musicBox = boxOpen && (
        <div id="music-box" className="active">
            <div id="jukebox">
                <div id="jukebox-songs">
                    <div id="jukebox-current">{ playing ? (title || 'Loading...') : 'No song selected' }</div>
                    <div id="jukebox-next">
                        { playing
                            ? (state.roomWide ? <><b>Played by:</b> { state.by }</> : 'Playing just for you')
                            : <>Use <span className="value">:play</span> to play</> }
                    </div>
                </div>
                <div id="jukebox-controls">
                    <button type="button" id="jukebox-play" className={ playing ? '' : 'disabled' } aria-label="Stop" onClick={ stop } />
                    <input type="range" min="0" max="100" value={ volume } id="jukebox-volume" onChange={ event => setVolume(parseInt(event.target.value, 10)) } />
                </div>
            </div>
            <div className="jb-divider" />
            <button type="button" id="jukebox-tv-toggle" className={ tvOpen ? 'active' : '' } aria-label="TV" onClick={ () => setTvOpen(value => !value) } />
        </div>);

    return (
        <>
            { musicBox }
            { (playing || tvOpen) &&
                <div id="jukebox-player-wrapper" className={ tvOpen ? 'is-open' : 'is-hidden' } style={ tvOpen ? { left: tvAt.x, top: tvAt.y } : null }>
                    <div id="jukebox-drag-bar" onMouseDown={ startDrag }>
                        <button type="button" className="jukebox-close" aria-label="Hide" onMouseDown={ event => event.stopPropagation() } onClick={ () => setTvOpen(false) } />
                    </div>
                    <div id="jukebox-tv-overlay" />
                    { playing
                        ? <iframe ref={ frameRef } id="jukebox-player" src={ source } title="YouTube video player" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen onLoad={ onFrameLoad } />
                        : <div id="jukebox-player" className="jukebox-empty">No song selected</div> }
                    { playing && state.canControl &&
                        <div className="jukebox-tv-controls">
                            <button type="button" onClick={ () => control(state.paused ? 'resume' : 'pause', positionOf(state)) }>{ state.paused ? 'Play' : 'Pause' }</button>
                            <button type="button" onClick={ () => control('seek', Math.max(0, positionOf(state) - SKIP_SECONDS)) }>-{ SKIP_SECONDS }s</button>
                            <button type="button" onClick={ () => control('seek', positionOf(state) + SKIP_SECONDS) }>+{ SKIP_SECONDS }s</button>
                        </div> }
                </div> }
        </>
    );
}
