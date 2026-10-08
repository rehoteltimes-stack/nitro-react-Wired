import { RoomObjectVariable, RoomPreviewer, Vector3d } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { GetConfiguration, GetRoomEngine, GetSessionDataManager, IRoomData, ROOM_FLOOR_IDS, ROOM_LANDSCAPE_IDS, ROOM_WALL_IDS, RoomSkinSaveComposer, SendMessageComposer } from '../../../../api';
import { AutoGrid, Button, ButtonGroup, Column, Flex, LayoutGridItem, LayoutRoomPreviewerView, ScrollContainer } from '../../../../common';

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean | string[]) => void;
}

const CATEGORIES = [ 'Floors', 'Walls', 'Landscapes' ];
const IDS = [ ROOM_FLOOR_IDS, ROOM_WALL_IDS, ROOM_LANDSCAPE_IDS ];
const DEFAULTS = [ '111', '201', '1.1' ];
const NONE = 'none';
const WINDOW_ITEMS = [ 'window_double_default', 'classic5_window', 'lodge_c15_window', 'art_c20_window' ];

// Thumbnails of the catalogue (catalog.asset.url): th_floor_<id>, th_wall_<id> and th_landscape_<a>_<b>_001 - the names HabboCity's own grid uses.
const thumbnail = (category: number, id: string): string =>
{
    const base = GetConfiguration<string>('catalog.asset.url');

    if(category === 0) return `${ base }/th_floor_${ id }.png`;
    if(category === 1) return `${ base }/th_wall_${ id }.png`;

    return `${ base }/th_landscape_${ id.replace('.', '_') }_001.png`;
};

const readCurrent = (roomId: number): string[] =>
{
    const instance = (GetRoomEngine() as any).getRoomInstance(roomId);

    if(!instance) return [ ...DEFAULTS ];

    return [
        String(instance.model.getValue(RoomObjectVariable.ROOM_FLOOR_TYPE) ?? DEFAULTS[0]),
        String(instance.model.getValue(RoomObjectVariable.ROOM_WALL_TYPE) ?? DEFAULTS[1]),
        String(instance.model.getValue(RoomObjectVariable.ROOM_LANDSCAPE_TYPE) ?? DEFAULTS[2])
    ];
};

export const NavigatorRoomSettingsSkinTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null } = props;
    const roomId = roomData.roomId;
    const [ category, setCategory ] = useState(0);
    const [ current, setCurrent ] = useState<string[]>(() => readCurrent(roomId));
    const saved = useRef<string[]>(current);
    const [ previewer, setPreviewer ] = useState<RoomPreviewer>(null);
    const scrollRef = useRef<HTMLDivElement>();

    const preview = (values: string[], index: number) =>
    {
        if(!previewer) return;

        previewer.updateObjectRoom(values[0], values[1], values[2]);

        if(index === 0)
        {
            const figure = GetSessionDataManager().figure;

            if(figure) previewer.addAvatarIntoRoom(figure, 0);
        }
        else
        {
            // HabboCity previews a landscape through its default double window; this hotel's furnidata does not list that one, so the first window it does have is used.
            const windowItem = WINDOW_ITEMS.map(name => GetSessionDataManager().getWallItemDataByName(name)).find(item => !!item);

            if(windowItem) previewer.addWallItemIntoRoom(windowItem.id, new Vector3d(90), windowItem.customParams);
        }
    };

    useEffect(() =>
    {
        const roomPreviewer = new RoomPreviewer(GetRoomEngine(), ++RoomPreviewer.PREVIEW_COUNTER);

        setPreviewer(roomPreviewer);

        return () =>
        {
            roomPreviewer.dispose();
            setPreviewer(null);
            GetRoomEngine().updateRoomInstancePlaneType(roomId, saved.current[0], saved.current[1], saved.current[2]);
        };
    }, [ roomId ]);

    useEffect(() =>
    {
        preview(current, category);
    }, [ previewer, category ]);

    useEffect(() =>
    {
        if(scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [ category ]);

    const apply = (index: number, value: string) =>
    {
        const next = [ ...current ];

        next[index] = value;

        setCurrent(next);
        preview(next, category);
        GetRoomEngine().updateRoomInstancePlaneType(roomId, next[0], next[1], next[2]);
    };

    const changed = current.some((value, index) => (value !== saved.current[index]));

    const save = () =>
    {
        SendMessageComposer(new RoomSkinSaveComposer(roomId, current[0], current[1], current[2]));
        saved.current = [ ...current ];
        setCurrent([ ...current ]);
    };

    const reset = () =>
    {
        setCurrent([ ...saved.current ]);
        preview(saved.current, category);
        GetRoomEngine().updateRoomInstancePlaneType(roomId, saved.current[0], saved.current[1], saved.current[2]);
    };

    const ids = IDS[category];
    const selected = current[category];
    const ordered = [ ...ids.filter(id => (id === DEFAULTS[category])), ...ids.filter(id => (id !== DEFAULTS[category])) ];

    return (
        <Column className="room-settings-skin-tab">
            <Flex gap={ 2 } className="flex-fill">
                <Column>
                    <ButtonGroup>
                        { CATEGORIES.map((name, index) => <Button key={ name } active={ (category === index) } onClick={ () => setCategory(index) }>{ name }</Button>) }
                    </ButtonGroup>
                    <ScrollContainer innerRef={ scrollRef } fullHeight>
                        <AutoGrid columnCount={ 4 }>
                            { ordered.map(id => (
                                <LayoutGridItem key={ id } itemActive={ (selected === id) } itemImage={ thumbnail(category, id) } onClick={ () => apply(category, id) } />
                            )) }
                            <LayoutGridItem itemActive={ (selected === NONE) || (selected === '0.0') } onClick={ () => apply(category, NONE) } title="None">
                                <i className={ 'icon ' + [ 'icon-empty-floor', 'icon-empty-wallpaper', 'icon-empty-landscape' ][category] } />
                            </LayoutGridItem>
                        </AutoGrid>
                    </ScrollContainer>
                </Column>
                <LayoutRoomPreviewerView roomPreviewer={ previewer } height={ 193 } />
            </Flex>
            <Flex gap={ 2 } shrink className="flex-fill">
                <Button disabled={ !changed } onClick={ save }>Save</Button>
                <Button variant="danger" disabled={ !changed } onClick={ reset }>Reset</Button>
            </Flex>
        </Column>
    );
};
