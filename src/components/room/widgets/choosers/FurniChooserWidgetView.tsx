import { FurnitureFloorUpdateComposer, ILinkEventTracker, RoomObjectCategory, RoomObjectOperationType, RoomObjectVariable } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowUp, FaCrosshairs, FaExchangeAlt, FaList, FaTrashAlt } from 'react-icons/fa';
import { AddEventLinkTracker, BuildModeHeightMode, chooserSelectionVisualizer, GetRoomEngine, GetSessionDataManager, LocalizeText, ProcessRoomObjectOperation, RemoveLinkEventTracker, RoomObjectItem, SendMessageComposer } from '../../../../api';
import { Base, Button, ButtonGroup, Column, CustomSelect, Flex, InfiniteScroll, NitroCardContentView, NitroCardHeaderView, NitroCardView, NumberInput, Text } from '../../../../common';
import { useBuildMode, useFurniChooserWidget, useNotification, useObjectDeselectedEvent, useObjectSelectedEvent, useRoom } from '../../../../hooks';

// The furni chooser of the reference client (component `CP` in its minified bundle) including its "build mode"
// state: while open, the card widens into two columns - forced state / rotation / height controls, a move pad
// for the selected furni - next to the furni list. Read directly from the bundle; nothing here is invented.
//
// Deliberately NOT built (real reference controls that need a patched renderer, which this project does not
// have): "Freeze my avatar" and the transparency/alpha-threshold slider (hit-map tolerance), plus the branded
// image offset variant of the move pad. Wall furni cannot be moved with the pad either (needs the legacy wall
// string builder); Use / Rotate / Pick up work for both.
//
// UNVERIFIED: the exact icon glyphs (the reference's icons are minified vendor imports and build mode could not
// be opened on the reference: its session has no room rights). Same react-icons/fa family, best-fit glyphs.
const MIN_WIDTH = { primary: 445, secondary: 240 };

const SEARCH_MODES = [
    { value: '0', text: 'By furni name' },
    { value: '1', text: 'By furni owner' },
    { value: '2', text: 'By radius around me' },
    { value: '3', text: 'By furni id' }
];

const HEIGHT_MODES = [
    { value: BuildModeHeightMode.ABSOLUTE, text: 'Absolute height' },
    { value: BuildModeHeightMode.FROM_HIGHEST, text: 'From the highest point' },
    { value: BuildModeHeightMode.FROM_LOWEST, text: 'From the lowest point' },
    { value: BuildModeHeightMode.FROM_FURNI, text: 'From the furni height' }
];

const PAD = [ [ 7, 0, 1 ], [ 6, null, 2 ], [ 5, 4, 3 ] ];

interface ListInput
{
    active: boolean;
    data: string;
}

// comma separated list -> numbers, out-of-range entries become -1 (same as the reference's `pn`)
const parseList = (value: string, min = 0, max = 2147483647): number[] => value.split(',').map(part =>
{
    const parsed = parseInt(part, 10);

    return ((isNaN(parsed) || (parsed < min) || (parsed > max)) ? -1 : parsed);
});

const ChooserList: FC<{ items: RoomObjectItem[]; selectItem: (item: RoomObjectItem) => void; showIds: boolean }> = props =>
{
    const { items = [], selectItem = null, showIds = false } = props;
    const [ selected, setSelected ] = useState<RoomObjectItem>(null);

    useEffect(() =>
    {
        if(selected) selectItem(selected);
    }, [ selected, selectItem ]);

    // same as the reference: any mouse down clears the selection, the row's own click then re-applies it
    useEffect(() =>
    {
        const clear = () => setSelected(null);

        document.addEventListener('mousedown', clear);

        return () => document.removeEventListener('mousedown', clear);
    }, []);

    return (
        <Column overflow="hidden">
            <InfiniteScroll rows={ items } rowRender={ item =>
                <Flex alignItems="center" className={ 'rounded p-1' + ((selected === item) ? ' bg-muted' : '') } pointer onClick={ () => setSelected((selected !== item) ? item : null) }>
                    <Text truncate>{ item.name } { showIds && (' - ' + item.id) }</Text>
                </Flex> } />
        </Column>
    );
}

export const FurniChooserWidgetView: FC<{}> = props =>
{
    const { items = null, onClose = null, selectItem = null, populateChooser = null } = useFurniChooserWidget();
    const { active, setActive, furniState, setFurniState, furniDirection, setFurniDirection, furniZ, setFurniZ, setZOptions, setSetZOptions, buildModeOnClick, setBuildModeOnClick, buildModeOnMove, setBuildModeOnMove, reset } = useBuildMode();
    const { roomSession = null } = useRoom();
    const { showSingleBubble = null } = useNotification();
    const [ searchValue, setSearchValue ] = useState('');
    const [ searchType, setSearchType ] = useState('0');
    const [ inverse, setInverse ] = useState(false);
    const [ filtered, setFiltered ] = useState<RoomObjectItem[]>(items);
    const [ wide, setWide ] = useState(true);
    const [ stateInput, setStateInput ] = useState<ListInput>({ active: false, data: '1,2,3' });
    const [ rotationInput, setRotationInput ] = useState<ListInput>({ active: false, data: '1,2,3' });
    const [ heightStep, setHeightStep ] = useState({ active: false, data: 0.1 });
    const [ selected, setSelected ] = useState<{ id: number, category: number, name: string, iconUrl: string, x: number, y: number, rotation: number }>(null);
    const searchRef = useRef(searchValue);
    const isModerator = GetSessionDataManager().isModerator;

    const applySearch = (value: string, type: string) =>
    {
        if(items === null)
        {
            setFiltered([]);

            return;
        }

        if(value === '')
        {
            setFiltered(items);

            return;
        }

        const engine = GetRoomEngine();
        let result: RoomObjectItem[];

        switch(type)
        {
            case '0':
                result = items.filter(item => (item.name?.toLocaleLowerCase().includes(value.toLocaleLowerCase()) !== inverse));
                break;
            case '1':
                result = items.filter(item => (item.ownerName?.toLocaleLowerCase().includes(value.toLocaleLowerCase()) !== inverse));
                break;
            case '2':
            {
                const own = roomSession && engine.getRoomObject(roomSession.roomId, roomSession.ownRoomIndex, RoomObjectCategory.UNIT);
                const radius = parseInt(value, 10);

                if(!own || isNaN(radius) || (radius < 0))
                {
                    result = [];
                    break;
                }

                const ownLocation = own.getLocation();

                result = items.filter(item =>
                {
                    const object = engine.getRoomObject(roomSession.roomId, item.id, item.category);

                    if(!object) return false;

                    const location = object.getLocation();

                    return (((Math.abs(location.x - ownLocation.x) <= radius) && (Math.abs(location.y - ownLocation.y) <= radius)) !== inverse);
                });
                break;
            }
            default:
                result = items.filter(item => (item.id.toString().includes(value) !== inverse));
                break;
        }

        setFiltered(result.sort((a, b) => a.name?.toLocaleLowerCase().localeCompare(b.name?.toLocaleLowerCase())));
    }

    useEffect(() =>
    {
        searchRef.current = searchValue;
    }, [ searchValue ]);

    useEffect(() => applySearch(searchValue, searchType), [ items, inverse ]);

    // radius search follows the avatar, so it is re-evaluated continuously (same 100 ms poll as the reference)
    useEffect(() =>
    {
        if(!items || (searchType !== '2')) return;

        const interval = setInterval(() => applySearch(searchRef.current, searchType), 100);

        return () => clearInterval(interval);
    }, [ items, searchType, inverse ]);

    useEffect(() =>
    {
        const element = document.getElementById('nitro-furni-buildmode-widget');

        if(!element) return;

        const observer = new ResizeObserver(entries =>
        {
            for(const entry of entries) setWide(entry.contentRect.width >= MIN_WIDTH.primary);
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, [ active, items ]);

    useEffect(() =>
    {
        return () => chooserSelectionVisualizer.clearAll();
    }, []);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                // build-mode/toggle[/reset] | build-mode/setz|forceact|forcerot/<value|stop>
                switch(parts[1])
                {
                    case 'toggle':
                        if(parts[2] === 'reset')
                        {
                            resetAll();

                            return;
                        }

                        setActive(value => !value);
                        populateChooser();

                        return;
                    case 'setz':
                        setHeightStep(value => ({ active: false, data: value.data }));

                        if(parts[2] === 'stop')
                        {
                            setSetZOptions(0);
                            setFurniZ(null);

                            return;
                        }

                        setSetZOptions(BuildModeHeightMode.ABSOLUTE);
                        setFurniZ(parseFloat(parts[2]));
                        setBuildModeOnMove(true);

                        return;
                    case 'forceact':
                        setStateInput(value => ({ active: false, data: value.data }));
                        setFurniState((parts[2] === 'stop') ? [] : [ parseInt(parts[2], 10) ]);

                        if(parts[2] !== 'stop') setBuildModeOnMove(true);

                        return;
                    case 'forcerot':
                        setRotationInput(value => ({ active: false, data: value.data }));
                        setFurniDirection((parts[2] === 'stop') ? [] : [ parseInt(parts[2], 10) ]);

                        if(parts[2] !== 'stop') setBuildModeOnMove(true);

                        return;
                }
            },
            eventUrlPrefix: 'build-mode/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ populateChooser ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => populateChooser(),
            eventUrlPrefix: 'furni-chooser/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ populateChooser ]);

    const resetAll = () =>
    {
        setSearchValue('');
        setInverse(false);
        setSearchType('0');
        setStateInput({ active: false, data: '1,2,3' });
        setRotationInput({ active: false, data: '1,2,3' });
        setHeightStep({ active: false, data: 0.1 });
        setSelected(null);
        reset();
    }

    const describeObject = (id: number, category: number) =>
    {
        if(!roomSession) return;

        const engine = GetRoomEngine();
        const object = engine.getRoomObject(roomSession.roomId, id, category);

        if(!object || ((category !== RoomObjectCategory.FLOOR) && (category !== RoomObjectCategory.WALL))) return;

        const typeId = object.model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);
        const data = (category === RoomObjectCategory.FLOOR) ? GetSessionDataManager().getFloorItemData(typeId) : GetSessionDataManager().getWallItemData(typeId);
        const location = object.getLocation();

        setSelected({
            id,
            category,
            name: (data?.name?.length ? data.name : object.type),
            iconUrl: (category === RoomObjectCategory.FLOOR) ? engine.getFurnitureFloorIconUrl(typeId) : engine.getFurnitureWallIconUrl(typeId),
            x: location.x,
            y: location.y,
            rotation: (object.getDirection().x / 45)
        });
    }

    useObjectSelectedEvent(event => describeObject(event.id, event.category));
    useObjectDeselectedEvent(event => setSelected(null));

    // Move pad: the reference sends a custom move packet carrying forced state/extras; here the stock move
    // packet is used and the plugin applies the forced state / height server side (see hcms-buildermode-plugin).
    const movePad = (direction: number | null) =>
    {
        if(!selected || !roomSession || (selected.category !== RoomObjectCategory.FLOOR)) return;

        const engine = GetRoomEngine();
        const object = engine.getRoomObject(roomSession.roomId, selected.id, selected.category);
        const own = engine.getRoomObject(roomSession.roomId, roomSession.ownRoomIndex, RoomObjectCategory.UNIT);

        if(!object || !own) return;

        const deltaX = ([ 6, 7, 0 ].includes(direction) ? -1 : ([ 2, 3, 4 ].includes(direction) ? 1 : 0));
        const deltaY = ([ 0, 1, 2 ].includes(direction) ? -1 : ([ 4, 5, 6 ].includes(direction) ? 1 : 0));
        const ownLocation = own.getLocation();
        const location = object.getLocation();
        const forced = furniDirection.filter(value => (value >= 0));
        let rotation = (object.getDirection().x / 45);

        // "apply on move": a random one of the configured rotations, like the reference
        if(buildModeOnMove && forced.length) rotation = forced[Math.floor(Math.random() * forced.length)];

        SendMessageComposer(new FurnitureFloorUpdateComposer(selected.id, ((direction === null) ? ownLocation.x : (location.x + deltaX)), ((direction === null) ? ownLocation.y : (location.y + deltaY)), rotation));
    }

    const closeChooser = () =>
    {
        chooserSelectionVisualizer.clearAll();
        onClose();
        setActive(false);
    }

    const searchBlock = useMemo(() => (
        <Column shrink gap={ 1 }>
            <CustomSelect value={ searchType } onChange={ value => { setSearchType(value); applySearch(searchValue, value); } } items={ SEARCH_MODES.filter(mode => (isModerator || (mode.value !== '3'))) } noInvalid />
            <Flex gap={ 1 }>
                <Button variant={ inverse ? 'danger' : 'primary' } active={ inverse } onMouseDown={ () => setInverse(value => !value) } title="Invert search">
                    <FaExchangeAlt />
                </Button>
                <input type="text" className="form-control form-control-sm" placeholder={ LocalizeText('generic.search') } value={ searchValue } onChange={ event => { setSearchValue(event.target.value); applySearch(event.target.value, searchType); } } />
            </Flex>
        </Column>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [ searchType, searchValue, inverse, items, isModerator ]);

    if(!items) return null;

    const selectAndShow = (item: RoomObjectItem) =>
    {
        selectItem(item);

        chooserSelectionVisualizer.clearAll();
        chooserSelectionVisualizer.show(item.id, item.category);
    }

    const heightMode = (setZOptions || BuildModeHeightMode.ABSOLUTE);
    const stateDisplay = (stateInput.active ? furniState.length : 0);

    return (
        <NitroCardView resize={ active ? 'horizontal' : 'both' } id="nitro-furni-buildmode-widget" overflow="hidden" className={ `nitro-chooser-widget buildmode-${ active ? 'open' : 'closed' }` } theme="primary-slim" style={ active ? { minWidth: `${ wide ? MIN_WIDTH.primary : MIN_WIDTH.secondary }px` } : undefined }>
            <NitroCardHeaderView headerText={ (active ? 'Build mode' : LocalizeText('widget.chooser.furni.title')) + (wide ? (' - ' + (filtered?.length ?? 0)) : '') } buttonList={ active ? [ { iconElement: <FaTrashAlt />, onClick: resetAll } ] : [] } onCloseClick={ closeChooser } />
            <NitroCardContentView gap={ 2 }>
                { !active && searchBlock }
                <Flex gap={ 1 }>
                    { active &&
                        <Column gap={ 2 } className={ 'furni-chooser-section ' + (wide ? 'active' : 'unactive') }>
                            <Flex gap={ 2 } alignSelf="start" alignItems="center" className="furni-chooser-title">
                                { selected && selected.iconUrl &&
                                    <>
                                        <div className="furni-chooser-image" style={ { backgroundImage: `url(${ selected.iconUrl })` } } />
                                        <Text bold wrap>{ (selected.name.length > 45) ? (selected.name.slice(0, 45) + '...') : selected.name }</Text>
                                    </> }
                                { !(selected && selected.iconUrl) &&
                                    <>
                                        <div className="furni-chooser-image empty" />
                                        <Text bold>Select a furni to edit...</Text>
                                    </> }
                            </Flex>
                            <div className="horizontal-separator" />
                            <Flex gap={ 1 } justifyContent="between">
                                <Column gap={ 1 }>
                                    { PAD.map((row, rowIndex) =>
                                        <Flex key={ rowIndex } gap={ 1 }>
                                            { row.map((direction, index) =>
                                                <Button key={ index } size="sm" onMouseDown={ () => movePad(direction) } disabled={ !selected || (selected.category !== RoomObjectCategory.FLOOR) }>
                                                    { (direction !== null) && <FaArrowUp style={ { transform: `rotate(${ direction * 45 }deg)` } } /> }
                                                    { (direction === null) && <FaCrosshairs /> }
                                                </Button>) }
                                        </Flex>) }
                                </Column>
                                <Column gap={ 1 } alignSelf="center" className="furni-chooser-action-buttons">
                                    <Button size="sm" disabled={ !selected } onMouseDown={ () => GetRoomEngine().useRoomObject(selected.id, selected.category) }><Text small variant="white">Use</Text></Button>
                                    <Button size="sm" disabled={ !selected } onMouseDown={ () => ProcessRoomObjectOperation(selected.id, selected.category, RoomObjectOperationType.OBJECT_ROTATE_POSITIVE) }><Text small variant="white">Rotate</Text></Button>
                                    <Button size="sm" disabled={ !selected } onMouseDown={ () => ProcessRoomObjectOperation(selected.id, selected.category, RoomObjectOperationType.OBJECT_PICKUP) }><Text small variant="white">Pick up</Text></Button>
                                </Column>
                            </Flex>
                            <div className="horizontal-separator" />
                            <Flex justifyContent="between" alignItems="center" gap={ 1 }>
                                <Text small className="furni-chooser-set-option">State{ stateInput.active ? 's' : '' }:</Text>
                                <Flex className="furni-chooser-number-input" gap={ 1 } alignItems="center">
                                    { stateInput.active &&
                                        <input type="text" placeholder="..." className="furni-chooser-set-input form-control form-control-sm" value={ stateInput.data } onChange={ event => { setStateInput(value => ({ active: value.active, data: event.target.value })); setFurniState(parseList(event.target.value)); } } /> }
                                    { !stateInput.active &&
                                        <NumberInput className="furni-chooser-set-input" min={ 0 } max={ 2147483647 } step={ 1 } value={ (furniState.length > 0) ? furniState[0] : null } onEvent={ value => setFurniState([ value ]) } /> }
                                    <ButtonGroup vertical>
                                        <Button size="xsm" variant="danger" onMouseDown={ () => { setFurniState([]); setStateInput(value => ({ active: value.active, data: '' })); } }><FaTrashAlt /></Button>
                                        <Button size="xsm" variant="primary" active={ stateInput.active } onMouseDown={ () =>
                                        {
                                            setStateInput(value => ({ active: !value.active, data: value.data }));

                                            if(stateInput.active) setFurniState(value => ((value.length > 0) && (value[0] !== -1)) ? [ value[0] ] : []);
                                            else setFurniState(parseList(stateInput.data, 0, 7));
                                        } }><FaList /></Button>
                                    </ButtonGroup>
                                </Flex>
                            </Flex>
                            <Flex justifyContent="between" alignItems="center" gap={ 1 }>
                                <Text small className="furni-chooser-set-option">Rotation{ rotationInput.active ? 's' : '' }:</Text>
                                <Flex className="furni-chooser-number-input" gap={ 1 } alignItems="center">
                                    { rotationInput.active &&
                                        <input type="text" placeholder="..." className="furni-chooser-set-input form-control form-control-sm" value={ rotationInput.data } onChange={ event => { setRotationInput(value => ({ active: value.active, data: event.target.value })); setFurniDirection(parseList(event.target.value, 0, 7)); } } /> }
                                    { !rotationInput.active &&
                                        <NumberInput className="furni-chooser-set-input" min={ 0 } max={ 7 } step={ 1 } loop value={ (furniDirection.length > 0) ? furniDirection[0] : null } onEvent={ value => setFurniDirection([ value ]) } /> }
                                    <ButtonGroup vertical>
                                        <Button size="xsm" variant="danger" onMouseDown={ () => { setFurniDirection([]); setRotationInput(value => ({ active: value.active, data: '' })); } }><FaTrashAlt /></Button>
                                        <Button size="xsm" variant="primary" active={ rotationInput.active } onMouseDown={ () =>
                                        {
                                            setRotationInput(value => ({ active: !value.active, data: value.data }));

                                            if(rotationInput.active) setFurniDirection(value => ((value.length > 0) && (value[0] !== -1)) ? [ value[0] ] : []);
                                            else setFurniDirection(parseList(rotationInput.data, 0, 7));
                                        } }><FaList /></Button>
                                    </ButtonGroup>
                                </Flex>
                            </Flex>
                            <Flex justifyContent="between" alignItems="center" gap={ 1 }>
                                <Text small className="furni-chooser-set-option">{ heightStep.active ? 'Step' : 'Height' }:</Text>
                                <Flex className="furni-chooser-number-input" gap={ 1 } alignItems="center">
                                    { heightStep.active &&
                                        <NumberInput className="furni-chooser-set-input" min={ 0 } max={ 1000 } step={ 0.1 } value={ heightStep.data } defaultValueIfNull={ 0.1 } ignorePrecision onEvent={ value => setHeightStep(current => ({ active: current.active, data: value })) } /> }
                                    { !heightStep.active &&
                                        <NumberInput className="furni-chooser-set-input" min={ -1e308 } max={ 1e308 } step={ heightStep.data } value={ furniZ } defaultValueIfNull={ 0 } ignorePrecision onEvent={ setFurniZ } /> }
                                    <ButtonGroup vertical>
                                        <Button size="xsm" variant="danger" onMouseDown={ () => { setFurniZ(null); setHeightStep(current => ({ active: current.active, data: 0.1 })); } }><FaTrashAlt /></Button>
                                        <Button size="xsm" variant="primary" active={ heightStep.active } onMouseDown={ () => setHeightStep(current => ({ active: !current.active, data: current.data })) }><FaList /></Button>
                                    </ButtonGroup>
                                </Flex>
                            </Flex>
                            <CustomSelect value={ heightMode } onChange={ value => { setSetZOptions(value); if(furniZ === null) setFurniZ(0); } } items={ HEIGHT_MODES } noInvalid />
                            <Flex justifyContent="between" alignItems="center">
                                <Text noWrap>Apply on move:</Text>
                                <input className="form-check-input" type="checkbox" checked={ buildModeOnMove } onChange={ event => setBuildModeOnMove(event.target.checked) } />
                            </Flex>
                            <Flex justifyContent="between" alignItems="center">
                                <Text noWrap>Apply on double click:</Text>
                                <input className="form-check-input" type="checkbox" checked={ buildModeOnClick } onChange={ event => setBuildModeOnClick(event.target.checked) } />
                            </Flex>
                        </Column> }
                    { active && wide && <div className="vertical-separator" /> }
                    { ((active && wide) || !active) &&
                        <Column gap={ 1 } className={ 'furni-chooser-section ' + (active ? 'active' : 'unactive') }>
                            { active && wide && searchBlock }
                            <ChooserList items={ filtered || items } selectItem={ selectAndShow } showIds={ isModerator } />
                        </Column> }
                </Flex>
            </NitroCardContentView>
        </NitroCardView>
    );
}
