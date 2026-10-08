import { FC, useEffect, useRef, useState } from 'react';
import { FaPause, FaPlay, FaStepBackward, FaStepForward, FaStop, FaVolumeDown, FaVolumeUp } from 'react-icons/fa';
import { VIDEO_TV_PAUSED, VIDEO_TV_PLAYING, VideoTvYoutubeId } from '../../api/videotv/VideoTvProtocol';
import { Button, Column, Text } from '../../common';
import { useVideoTv } from '../../hooks';

const MAX_URLS = 50;
const TITLES_KEY = 'hcms.videotv.titles';
const TITLES = new Map<string, string>();
const PENDING = new Map<string, Promise<string>>();

const loadTitles = () =>
{
    if(TITLES.size) return;

    try
    {
        const stored = JSON.parse(window.localStorage.getItem(TITLES_KEY) || '{}');

        for(const [ id, title ] of Object.entries(stored)) if(typeof title === 'string') TITLES.set(id, title);
    }
    catch
    {
        return;
    }
}

const storeTitles = () =>
{
    try
    {
        window.localStorage.setItem(TITLES_KEY, JSON.stringify(Object.fromEntries(Array.from(TITLES.entries()).slice(-400))));
    }
    catch
    {
        return;
    }
}

const fetchTitle = (videoId: string) =>
{
    loadTitles();

    if(TITLES.has(videoId)) return Promise.resolve(TITLES.get(videoId));

    if(!PENDING.has(videoId))
    {
        const watch = encodeURIComponent(`https://www.youtube.com/watch?v=${ videoId }`);

        PENDING.set(videoId, fetch(`https://www.youtube.com/oembed?url=${ watch }&format=json`, { credentials: 'omit' })
            .then(response => (response.ok ? response.json() : null))
            .then(data =>
            {
                PENDING.delete(videoId);

                if(!data?.title) return null;

                TITLES.set(videoId, data.title);
                storeTitles();

                return data.title as string;
            })
            .catch(() =>
            {
                PENDING.delete(videoId);

                return null;
            }));
    }

    return PENDING.get(videoId);
}

const label = (url: string) =>
{
    const text = url.trim();
    const videoId = VideoTvYoutubeId(text);

    if(videoId) return TITLES.get(videoId) ?? `YouTube · ${ videoId }`;

    try
    {
        const parsed = new URL(/^https?:\/\//i.test(text) ? text : `https://${ text }`);

        if(parsed.hostname.toLowerCase().includes('twitch.tv'))
        {
            const clip = parsed.hostname.startsWith('clips.') ? parsed.pathname.split('/').filter(Boolean)[0] : parsed.pathname.match(/\/clip\/([A-Za-z0-9_-]+)/i)?.[1];

            if(clip) return `Twitch Clip · ${ clip }`;

            const video = parsed.pathname.match(/\/videos\/(\d+)/i)?.[1];

            if(video) return `Twitch VOD · ${ video }`;

            const channel = parsed.pathname.split('/').filter(Boolean)[0];

            return channel ? `Twitch · ${ channel }` : 'Twitch Stream';
        }

        return parsed.hostname.replace(/^www\./, '');
    }
    catch
    {
        return text;
    }
}

const VideoTvUrlChip: FC<{ value: string, isActive: boolean, onChange: (value: string) => void }> = props =>
{
    const { value, isActive, onChange } = props;
    const [ editing, setEditing ] = useState(!value.trim());
    const [ title, setTitle ] = useState(() => label(value));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() =>
    {
        const text = value.trim();

        if(!text)
        {
            setEditing(true);

            return;
        }

        setTitle(label(text));

        const videoId = VideoTvYoutubeId(text);
        let alive = true;

        if(videoId) fetchTitle(videoId).then(found => alive && found && setTitle(found));

        return () =>
        {
            alive = false;
        };
    }, [ value ]);

    if(!editing && value.trim()) return (
        <button type="button" className={ 'video-tv-remote__url-chip' + (isActive ? ' is-active' : '') } title={ value.trim() } onClick={ () =>
        {
            setEditing(true);
            window.setTimeout(() => inputRef.current?.select(), 0);
        } }>
            <span className="video-tv-remote__url-chip-label">{ title }</span>
        </button>);

    return <input ref={ inputRef } type="text" spellCheck={ false } className={ isActive ? 'is-active' : undefined } placeholder="YouTube or Twitch URL" value={ value } onChange={ event => onChange(event.target.value) } onBlur={ () => value.trim() && setEditing(false) } onKeyDown={ event =>
    {
        if(event.key !== 'Enter') return;

        event.preventDefault();
        (event.target as HTMLInputElement).blur();
    } } />;
}

export const VideoTvRemoteView: FC<{ itemId: number }> = props =>
{
    const { itemId } = props;
    const { tvs, saveUrls, control, volumeUp, volumeDown } = useVideoTv();
    const tv = tvs.get(itemId) ?? null;
    const nextKey = useRef(1);
    const [ rows, setRows ] = useState<{ key: number, value: string }[]>([]);
    const savedUrls = tv ? tv.urls.join('\n') : '';

    useEffect(() =>
    {
        const urls = savedUrls ? savedUrls.split('\n') : [];

        setRows([ ...urls, ...((urls.length < MAX_URLS) ? [ '' ] : []) ].map(value => ({ key: nextKey.current++, value })));
    }, [ savedUrls ]);

    if(!tv || !tv.canControl) return null;

    const drafted = rows.map(row => row.value.trim()).filter(Boolean).join('\n');
    const hasVideo = !!tv.urls.length;
    const disabled = !hasVideo && !drafted;
    const playing = (tv.state === VIDEO_TV_PLAYING);
    const status = !hasVideo ? 'No video' : playing ? 'Playing' : (tv.state === VIDEO_TV_PAUSED) ? 'Paused' : 'Stopped';

    const save = () =>
    {
        if(drafted !== savedUrls) saveUrls(itemId, drafted);
    }

    const send = (action: 'play' | 'pause' | 'stop' | 'next' | 'prev' | 'select', index: number = 0) =>
    {
        save();
        control(itemId, action, index);
    }

    const setRow = (index: number, value: string) => setRows(previous => previous.map((row, position) => (position === index) ? { ...row, value } : row));

    const addRow = () => setRows(previous => (previous.length >= MAX_URLS) ? previous : [ ...previous, { key: nextKey.current++, value: '' } ]);

    const removeRow = (index: number) => setRows(previous => (previous.length <= 1) ? [ { key: nextKey.current++, value: '' } ] : previous.filter((row, position) => position !== index));

    return (
        <Column gap={ 1 } className="video-tv-remote">
            <hr className="m-0" />
            <Text variant="white" small>Video TV</Text>
            <div className="video-tv-remote__panel">
                <div className="video-tv-remote__status">
                    <span className="video-tv-remote__status-text">{ status }</span>
                    <span className={ 'video-tv-remote__led' + (playing ? ' is-on' : '') } />
                </div>
                <div className="video-tv-remote__row">
                    <button type="button" className="video-tv-remote__btn" disabled={ disabled } title="Previous" onClick={ () => send('prev') }><FaStepBackward size={ 11 } /></button>
                    <button type="button" className="video-tv-remote__btn is-primary" disabled={ disabled } title={ playing ? 'Pause' : 'Play' } onClick={ () => send(playing ? 'pause' : 'play') }>{ playing ? <FaPause size={ 11 } /> : <FaPlay size={ 11 } /> }</button>
                    <button type="button" className="video-tv-remote__btn" disabled={ disabled } title="Next" onClick={ () => send('next') }><FaStepForward size={ 11 } /></button>
                </div>
                <div className="video-tv-remote__row">
                    <button type="button" className="video-tv-remote__btn" disabled={ disabled } title="Stop" onClick={ () => send('stop') }><FaStop size={ 10 } /><span>Stop</span></button>
                    <button type="button" className="video-tv-remote__btn" title="Volume down" onClick={ () => volumeDown(itemId) }><FaVolumeDown size={ 12 } /></button>
                    <button type="button" className="video-tv-remote__btn" title="Volume up" onClick={ () => volumeUp(itemId) }><FaVolumeUp size={ 12 } /></button>
                </div>
            </div>
            <div className="video-tv-remote__urls">
                { rows.map((row, index) =>
                {
                    const isLast = (index === rows.length - 1) && (rows.length < MAX_URLS);
                    const saved = tv.urls.indexOf(row.value.trim());
                    const isActive = (saved >= 0) && (saved === tv.track) && (tv.state !== 0);

                    return (
                        <div key={ row.key } className="video-tv-remote__url-row">
                            <VideoTvUrlChip value={ row.value } isActive={ isActive } onChange={ value => setRow(index, value) } />
                            <button type="button" className={ 'video-tv-remote__url-action is-play' + (isActive ? ' is-active' : '') } disabled={ !row.value.trim() } title="Play this track" onClick={ event =>
                            {
                                event.preventDefault();
                                send('select', (saved >= 0) ? saved : drafted.split('\n').indexOf(row.value.trim()));
                            } }><FaPlay size={ 9 } /></button>
                            <button type="button" className="video-tv-remote__url-action" disabled={ !isLast && (rows.length <= 1) && !row.value.trim() } title={ isLast ? 'Add URL' : 'Remove URL' } onClick={ event =>
                            {
                                event.preventDefault();

                                if(isLast) addRow();
                                else removeRow(index);
                            } }>{ isLast ? '+' : '−' }</button>
                        </div>
                    );
                }) }
            </div>
            <Button variant="secondary" className="video-tv-remote__save px-2" fullWidth onClick={ save }>
                <Text bold variant="white">Save</Text>
            </Button>
        </Column>
    );
}
