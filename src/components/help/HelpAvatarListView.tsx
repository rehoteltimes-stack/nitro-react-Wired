import { RoomObjectVariable, RoomPreviewer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { FaReply } from 'react-icons/fa';
import { CreateLinkEvent, GetConfiguration, GetRoomEngine, GetSessionDataManager, LocalizeText } from '../../api';
import { Button, Column, CustomSelect, Flex, InfiniteScroll, LayoutRoomPreviewerView, Marquee, NitroCardContentView, NitroCardHeaderView, NitroCardView, NumberInput, SearchBar, Text } from '../../common';
import { useRoom } from '../../hooks';

// HabboCity's ":help enable" and ":help handitem" windows (their "vU" and "_U" components): a search bar, a posture select, a direction
// number input, and a grid of 3 avatar previews per row, each with the name and a button that runs the matching chat command.
// Effects come from the hotel's EffectMap, hand items from the CarryItem action of HabboAvatarActions (both are what the
// client itself loads), so the lists always match the assets the hotel really has.
export type HelpAvatarListKind = 'enable' | 'handitem';

interface HelpEntry
{
    id: number;
    name: string;
}

const ROW_SIZE = 3;
const POSTURES = [ { value: 'std', text: 'Standing' }, { value: 'mv', text: 'Walking' }, { value: 'sit', text: 'Sitting' }, { value: 'lay', text: 'Lying' } ];
const cache: { [kind: string]: HelpEntry[] } = {};

const loadEntries = async (kind: HelpAvatarListKind): Promise<HelpEntry[]> =>
{
    if(cache[kind]) return cache[kind];

    let entries: HelpEntry[] = [];

    if(kind === 'enable')
    {
        const map = await (await fetch(GetConfiguration<string>('avatar.effectmap.url'))).json();

        // Only numeric ids are effects a player can enable; the others (dance.1 ...) are named animations.
        entries = ((map.effects ?? map) as { id: string, lib: string }[])
            .filter(effect => /^\d+$/.test(String(effect.id)))
            .map(effect => ({ id: Number(effect.id), name: effect.lib }));
    }
    else
    {
        const actions = await (await fetch(GetConfiguration<string>('avatar.actions.url'))).json();
        const carry = ((actions.actions ?? actions) as { id: string, params?: { id: string }[] }[]).find(action => action.id === 'CarryItem');

        entries = (carry?.params ?? [])
            .filter(param => /^\d+$/.test(param.id))
            .map(param => ({ id: Number(param.id), name: LocalizeText('handitem' + param.id) }))
            .map(entry => ({ ...entry, name: (entry.name === ('handitem' + entry.id)) ? '' : entry.name }));
    }

    cache[kind] = entries;

    return entries;
}

const HelpAvatarEntryView: FC<{ kind: HelpAvatarListKind, entry: HelpEntry, posture: string, direction: number }> = props =>
{
    const { kind = 'enable', entry = null, posture = 'std', direction = 2 } = props;
    const { roomSession = null } = useRoom();
    const [ previewer ] = useState(() => new RoomPreviewer(GetRoomEngine(), ++RoomPreviewer.PREVIEW_COUNTER));

    useEffect(() =>
    {
        previewer.reset(false);
        previewer.addAvatarIntoRoom(GetSessionDataManager().figure, (kind === 'enable') ? entry.id : 0);
        previewer.updatePreviewModel('', 0);

        if(kind === 'handitem') previewer.updateObjectUserAction(RoomObjectVariable.FIGURE_CARRY_OBJECT, entry.id);

        // The posture and direction are applied after the avatar exists in the preview room.
        const timer = setTimeout(() =>
        {
            previewer.updateUserPosture(posture);
            previewer.updateAvatarDirection(direction, direction);
        }, 0);

        return () => clearTimeout(timer);
    }, [ previewer, kind, entry, posture, direction ]);

    useEffect(() => () => previewer.dispose(), [ previewer ]);

    const command = ':' + kind + ' ' + entry.id;

    return (
        <Column className="nitro-help-avatar-entry">
            <LayoutRoomPreviewerView roomPreviewer={ previewer } height={ 150 }>
                <Marquee className="nitro-help-entry-name" timeout={ 3000 } waitBetween={ 2000 } step={ 150 }>
                    <Text variant="muted" small select="text">{ (kind === 'enable') ? entry.name : entry.name }</Text>
                </Marquee>
                <Button size="sm" grow className="nitro-help-entry-button" onClick={ () => roomSession && roomSession.sendChatMessage(command, 0) }>
                    <Text noWrap textTransform="none">{ command }</Text>
                </Button>
            </LayoutRoomPreviewerView>
        </Column>
    );
}

export const HelpAvatarListView: FC<{ kind: HelpAvatarListKind, onOpenChange: (open: boolean) => void }> = props =>
{
    const { kind = 'enable', onOpenChange = null } = props;
    const [ entries, setEntries ] = useState<HelpEntry[]>([]);
    const [ search, setSearch ] = useState('');
    const [ posture, setPosture ] = useState('std');
    const [ direction, setDirection ] = useState(2);

    useEffect(() =>
    {
        let active = true;

        loadEntries(kind).then(list => { if(active) setEntries(list); }).catch(() => {});

        return () => { active = false; };
    }, [ kind ]);

    const rows = useMemo(() =>
    {
        const term = search.trim().toLowerCase();
        const filtered = term ? entries.filter(entry => entry.name.toLowerCase().includes(term) || String(entry.id) === term) : entries;
        const result: HelpEntry[][] = [];

        for(let index = 0; index < filtered.length; index += ROW_SIZE) result.push(filtered.slice(index, index + ROW_SIZE));

        return result;
    }, [ entries, search ]);

    return (
        <NitroCardView uniqueKey={ 'help-' + kind } className="nitro-help-menu" theme="primary-slim" overflow="hidden" resize="none">
            <NitroCardHeaderView headerText={ (kind === 'enable') ? 'Effect list' : 'Hand item list' } buttonList={ [ { iconElement: <FaReply />, onClick: () => CreateLinkEvent('cmdhelp/help') } ] } onCloseClick={ () => onOpenChange(false) } />
            <NitroCardContentView overflow="hidden" gap={ 2 }>
                <SearchBar iconClass="help-enable-icon" color={ (kind === 'enable') ? '#C76759' : '#D0CF3C' } value={ search } placeholder={ (kind === 'enable') ? 'Search an effect...' : 'Search a hand item...' } onChange={ event => setSearch(event.target.value) } />
                <Flex gap={ 3 }>
                    <Flex gap={ 2 } alignItems="center">
                        <Text>Posture:</Text>
                        <CustomSelect className="nitro-help-entry-control" value={ posture } onChange={ setPosture } items={ POSTURES } />
                    </Flex>
                    <Flex gap={ 2 } alignItems="center">
                        <Text>Direction:</Text>
                        <NumberInput className="nitro-help-entry-control" min={ 0 } max={ 7 } step={ 1 } value={ direction } loop={ true } onEvent={ setDirection } />
                    </Flex>
                </Flex>
                <InfiniteScroll rows={ rows } overscan={ 0 } rowRender={ row =>
                    <Flex gap={ 2 } className="nitro-help-entry-row">
                        { row.map(entry => <HelpAvatarEntryView key={ entry.id } kind={ kind } entry={ entry } posture={ posture } direction={ direction } />) }
                    </Flex> } />
            </NitroCardContentView>
        </NitroCardView>
    );
}
