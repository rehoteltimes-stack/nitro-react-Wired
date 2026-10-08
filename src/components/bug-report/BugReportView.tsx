import { RoomEngineObjectEvent, RoomObjectCategory, RoomObjectType, RoomObjectVariable, TextureUtils } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { FaCrosshairs, FaTimes } from 'react-icons/fa';
import { AddEventLinkTracker, AvatarInfoUtilities, GetConfiguration, GetRoomEngine, GetRoomSession, GetSessionDataManager, RemoveLinkEventTracker } from '../../api';
import { Button, Column, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useCatalog, useInventoryFurni, useRoomEngineEvent } from '../../hooks';

interface IBugTarget
{
    kind: string;
    name?: string;
    classname?: string;
    itemId?: number;
    roomIndex?: number;
    x?: number;
    y?: number;
    z?: number;
    direction?: number;
    window?: string;
    element?: string;
    text?: string;
    snapshot?: Record<string, Record<string, unknown>>;
}

const CATEGORIES = [
    { key: 'visual', label: 'Looks wrong' },
    { key: 'room', label: 'Room or furni' },
    { key: 'catalog', label: 'Catalog' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'games', label: 'Games' },
    { key: 'other', label: 'Something else' }
];

const MAX_ERRORS = 10;
const MAX_SCREENSHOT_LENGTH = 4000000;
const CANVAS_PICK_DELAY = 400;
const WINDOW_PICK_DELAY = 300;
const PASS_THROUGH_WINDOWS = '.nitro-catalog, .nitro-inventory';
const ACTION_ELEMENTS = 'button, .btn, input, textarea, select';

const describeElement = (element: HTMLElement) =>
{
    const parts: string[] = [];
    let current = element;

    while(current && (parts.length < 4) && (current !== document.body))
    {
        const classes = Array.from(current.classList).slice(0, 3).join('.');

        parts.unshift(current.tagName.toLowerCase() + (classes ? '.' + classes : ''));
        current = current.parentElement;
    }

    return parts.join(' > ');
}

const openWindows = () => Array.from(document.querySelectorAll('.nitro-card-header-text'))
    .map(element => element.textContent?.trim())
    .filter(title => !!title)
    .slice(0, 10);

const describeTarget = (target: IBugTarget) =>
{
    if(!target) return null;

    if(target.kind === 'window') return `Window: ${ target.window || 'unknown' }${ target.text ? ` (${ target.text })` : '' }`;

    if(target.kind === 'room') return 'The room itself';

    return `${ target.kind === 'furni' ? 'Furni' : 'Avatar' }: ${ target.name || target.classname || 'unknown' }`;
}

export const BugReportView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ category, setCategory ] = useState('other');
    const [ what, setWhat ] = useState('');
    const [ expected, setExpected ] = useState('');
    const [ otherHotel, setOtherHotel ] = useState('');
    const [ target, setTarget ] = useState<IBugTarget>(null);
    const [ picking, setPicking ] = useState(false);
    const [ withScreenshot, setWithScreenshot ] = useState(true);
    const [ busy, setBusy ] = useState(false);
    const [ result, setResult ] = useState<{ ok: boolean, message: string }>(null);
    const errors = useRef<string[]>([]);
    const canvasPick = useRef<number>(0);
    const { isVisible: catalogVisible = false, currentPage = null, currentOffer = null, activeNodes = [], searchResult = null } = useCatalog();
    const { selectedItem: inventoryItem = null } = useInventoryFurni();

    const buildSnapshot = () =>
    {
        const snapshot: Record<string, Record<string, unknown>> = {};

        if(catalogVisible && currentPage)
        {
            snapshot.catalog = {
                pageId: currentPage.pageId,
                page: activeNodes.map(node => node.localization).join(' > '),
                layout: currentPage.layoutCode,
                offers: currentPage.offers?.length ?? 0
            };

            if(currentOffer)
            {
                snapshot.catalog.offerId = currentOffer.offerId;
                snapshot.catalog.offer = currentOffer.localizationName;
                snapshot.catalog.classname = currentOffer.product?.furnitureData?.className;
                snapshot.catalog.price = `${ currentOffer.priceInCredits } credits + ${ currentOffer.priceInActivityPoints } (type ${ currentOffer.activityPointType })`;
            }

            if(searchResult) snapshot.catalog.search = searchResult.searchValue;
        }

        if(inventoryItem && document.querySelector('.nitro-inventory'))
        {
            snapshot.inventory = {
                itemId: inventoryItem.getLastItem()?.id,
                name: inventoryItem.name,
                type: inventoryItem.type,
                count: inventoryItem.getTotalCount()
            };
        }

        return snapshot;
    }

    const snapshotRef = useRef(buildSnapshot);

    snapshotRef.current = buildSnapshot;

    const reset = useCallback(() =>
    {
        setCategory('other');
        setWhat('');
        setExpected('');
        setOtherHotel('');
        setTarget(null);
        setResult(null);
    }, []);

    const finishPick = useCallback((picked: IBugTarget) =>
    {
        window.clearTimeout(canvasPick.current);
        canvasPick.current = 0;
        setTarget(picked);
        setPicking(false);
    }, []);

    useEffect(() =>
    {
        const linkTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts[1] === 'hide')
                {
                    setIsVisible(false);

                    return;
                }

                if(parts[1] === 'idea') setCategory('idea');
                else if(parts[1] === 'show') setCategory(value => ((value === 'idea') ? 'other' : value));

                setIsVisible(true);
            },
            eventUrlPrefix: 'bug-report/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        const remember = (text: string) =>
        {
            errors.current = [ ...errors.current, `${ new Date().toISOString() } ${ text }`.slice(0, 300) ].slice(-MAX_ERRORS);
        }

        const onError = (event: ErrorEvent) => remember(`${ event.message } @ ${ event.filename }:${ event.lineno }`);
        const onRejection = (event: PromiseRejectionEvent) => remember(`Unhandled: ${ String(event.reason?.message ?? event.reason) }`);

        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);

        return () =>
        {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
        }
    }, []);

    useEffect(() =>
    {
        if(!picking) return;

        const onPointerDown = (event: PointerEvent) =>
        {
            const element = event.target as HTMLElement;

            if(!element || element.closest('.nitro-bug-report-picker')) return;

            if(element.tagName === 'CANVAS')
            {
                window.clearTimeout(canvasPick.current);
                canvasPick.current = window.setTimeout(() => finishPick({ kind: 'room', roomIndex: GetRoomSession()?.roomId }), CANVAS_PICK_DELAY);

                return;
            }

            const card = element.closest('.nitro-card');
            const picked: IBugTarget = {
                kind: 'window',
                window: card?.querySelector('.nitro-card-header-text')?.textContent?.trim() || element.closest('[class*="nitro-"]')?.className?.toString().split(' ')[0] || 'interface',
                element: describeElement(element),
                text: (element.innerText || element.getAttribute('title') || '').trim().slice(0, 80)
            };

            if(element.closest(PASS_THROUGH_WINDOWS) && !element.closest(ACTION_ELEMENTS))
            {
                window.setTimeout(() => finishPick({ ...picked, snapshot: snapshotRef.current() }), WINDOW_PICK_DELAY);

                return;
            }

            event.preventDefault();
            event.stopPropagation();
            finishPick({ ...picked, snapshot: snapshotRef.current() });
        }

        const onClick = (event: MouseEvent) =>
        {
            const element = event.target as HTMLElement;

            if(!element || (element.tagName === 'CANVAS') || element.closest('.nitro-bug-report-picker')) return;

            if(element.closest(PASS_THROUGH_WINDOWS) && !element.closest(ACTION_ELEMENTS)) return;

            event.preventDefault();
            event.stopPropagation();
        }

        const onKeyDown = (event: KeyboardEvent) => (event.key === 'Escape') && setPicking(false);

        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('click', onClick, true);
        document.addEventListener('keydown', onKeyDown, true);

        return () =>
        {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('click', onClick, true);
            document.removeEventListener('keydown', onKeyDown, true);
        }
    }, [ picking, finishPick ]);

    useRoomEngineEvent<RoomEngineObjectEvent>(RoomEngineObjectEvent.SELECTED, event =>
    {
        if(!picking) return;

        const roomSession = GetRoomSession();

        if(!roomSession) return;

        if((event.category === RoomObjectCategory.FLOOR) || (event.category === RoomObjectCategory.WALL))
        {
            const roomObject = GetRoomEngine().getRoomObject(roomSession.roomId, event.objectId, event.category);

            if(!roomObject) return;

            const typeId = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);
            const furniData = (event.category === RoomObjectCategory.FLOOR) ? GetSessionDataManager().getFloorItemData(typeId) : GetSessionDataManager().getWallItemData(typeId);
            const location = roomObject.getLocation();

            finishPick({
                kind: 'furni',
                name: AvatarInfoUtilities.getFurniInfo(event.objectId, event.category)?.name || furniData?.name,
                classname: furniData?.className || roomObject.type,
                itemId: event.objectId,
                roomIndex: roomSession.roomId,
                x: location.x,
                y: location.y,
                z: Math.round(location.z * 100) / 100,
                direction: roomObject.getDirection()?.x
            });

            return;
        }

        if(event.category === RoomObjectCategory.UNIT)
        {
            const userData = roomSession.userDataManager.getUserDataByIndex(event.objectId);
            const roomObject = GetRoomEngine().getRoomObject(roomSession.roomId, event.objectId, event.category);
            const location = roomObject?.getLocation();
            const kind = (userData?.type === RoomObjectType.PET) ? 'pet' : ((userData?.type === RoomObjectType.USER) ? 'avatar' : 'bot');

            finishPick({
                kind,
                name: userData?.name,
                itemId: userData?.webID,
                roomIndex: roomSession.roomId,
                x: location?.x,
                y: location?.y
            });
        }
    });

    const screenshot = () =>
    {
        const roomSession = GetRoomSession();

        if(!withScreenshot || !roomSession) return '';

        try
        {
            const image = TextureUtils.generateImageUrl(GetRoomEngine().createTextureFromRoom(roomSession.roomId, 1));

            return (image && image.length <= MAX_SCREENSHOT_LENGTH) ? image : '';
        }
        catch
        {
            return '';
        }
    }

    const send = () =>
    {
        setBusy(true);
        setResult(null);

        const context = {
            roomId: GetRoomSession()?.roomId ?? null,
            page: window.location.origin + window.location.pathname,
            browser: navigator.userAgent,
            screen: `${ window.innerWidth }x${ window.innerHeight } @${ window.devicePixelRatio }`,
            theme: document.documentElement.getAttribute('data-theme') || document.body.className,
            windows: openWindows(),
            snapshot: buildSnapshot(),
            errors: errors.current,
            time: new Date().toISOString()
        };

        const body = new URLSearchParams({
            category,
            what: what.trim(),
            expected: expected.trim(),
            other_hotel: otherHotel.trim(),
            target: target ? JSON.stringify(target) : '',
            context: JSON.stringify(context),
            screenshot: screenshot()
        });

        fetch(`${ GetConfiguration<string>('url.prefix', '') || '' }/api/bug-report`, { method: 'POST', credentials: 'include', headers: { 'Accept': 'application/json' }, body })
            .then(response => response.json())
            .then((response: { ok: boolean, message: string }) =>
            {
                setResult(response);

                if(response.ok)
                {
                    setWhat('');
                    setExpected('');
                    setOtherHotel('');
                    setTarget(null);
                }
            })
            .catch(() => setResult({ ok: false, message: 'The server could not be reached. Please try again.' }))
            .finally(() => setBusy(false));
    }

    if(!isVisible) return null;

    const isIdea = (category === 'idea');

    if(picking)
    {
        return (
            <Flex center gap={ 2 } className="nitro-bug-report-picker">
                <FaCrosshairs />
                <Text small bold variant="white">Click the furni, Habbo or window you mean.</Text>
                <Button variant="danger" size="sm" onClick={ () => setPicking(false) }>Cancel</Button>
            </Flex>
        );
    }

    return (
        <NitroCardView uniqueKey="bug-report" className="nitro-bug-report" theme="primary-slim">
            <NitroCardHeaderView headerText={ isIdea ? 'Suggest an idea' : 'Report a bug' } onCloseClick={ () => { setIsVisible(false); reset(); } } />
            <NitroCardContentView gap={ 2 }>
                <div className="bug-report-modes">
                    <button className={ 'bug-report-mode' + (!isIdea ? ' active' : '') } onClick={ () => isIdea && setCategory('other') }>Bug</button>
                    <button className={ 'bug-report-mode' + (isIdea ? ' active' : '') } onClick={ () => setCategory('idea') }>Idea</button>
                </div>
                <Text small>{ isIdea ? 'Got an idea to make the hotel better? Tell us what it is and why players would like it.' : 'Tell us what went wrong. The more detail you give, the faster we can fix it.' }</Text>
                { !isIdea &&
                    <Column gap={ 1 }>
                        <Text small bold>What is it about?</Text>
                        <div className="bug-report-categories">
                            { CATEGORIES.map(item =>
                                <button key={ item.key } className={ 'bug-report-chip' + ((category === item.key) ? ' active' : '') } onClick={ () => setCategory(item.key) }>{ item.label }</button>) }
                        </div>
                    </Column> }
                <Column gap={ 1 }>
                    <Text small bold>{ isIdea ? 'Point at what it is about (optional)' : 'Point at the problem' }</Text>
                    <Flex gap={ 1 } alignItems="center">
                        <Button size="sm" onClick={ () => setPicking(true) }><FaCrosshairs className="me-1" />{ target ? 'Pick again' : 'Pick in the hotel' }</Button>
                        { target &&
                            <Flex alignItems="center" gap={ 1 } className="bug-report-target">
                                <Text small truncate>{ describeTarget(target) }</Text>
                                <FaTimes className="cursor-pointer" onClick={ () => setTarget(null) } />
                            </Flex> }
                    </Flex>
                </Column>
                <Column gap={ 1 }>
                    <Text small bold>{ isIdea ? 'Your idea' : 'What is wrong?' }</Text>
                    <textarea className="bug-report-input" rows={ 3 } maxLength={ 2000 } placeholder={ isIdea ? 'What should we add or change?' : 'What happened? What did you do just before?' } value={ what } onChange={ event => setWhat(event.target.value) } />
                </Column>
                <Column gap={ 1 }>
                    <Text small bold>{ isIdea ? 'Why would it be good?' : 'How should it work?' }</Text>
                    <textarea className="bug-report-input" rows={ 2 } maxLength={ 2000 } placeholder={ isIdea ? 'How would players use it?' : 'What did you expect to happen?' } value={ expected } onChange={ event => setExpected(event.target.value) } />
                </Column>
                <Column gap={ 1 }>
                    <Text small bold>{ isIdea ? 'Seen it on another hotel?' : 'Does it work on another hotel?' }</Text>
                    <input className="bug-report-input" type="text" maxLength={ 120 } placeholder="For example Habbo.com or another retro" value={ otherHotel } onChange={ event => setOtherHotel(event.target.value) } />
                </Column>
                { !!GetRoomSession() &&
                    <label className="bug-report-check">
                        <input type="checkbox" checked={ withScreenshot } onChange={ event => setWithScreenshot(event.target.checked) } />
                        <Text small>Add a picture of the room</Text>
                    </label> }
                { result && <div className={ 'bug-report-result' + (result.ok ? ' is-ok' : '') }>{ result.message }</div> }
                <Button variant="success" fullWidth disabled={ busy || (what.trim().length < 10) } onClick={ send }>{ busy ? 'Sending...' : (isIdea ? 'Send idea' : 'Send report') }</Button>
            </NitroCardContentView>
        </NitroCardView>
    );
}
