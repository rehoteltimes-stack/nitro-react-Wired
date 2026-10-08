import { RoomControllerLevel, RoomSettingsComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { AreEmojiCodesEnabled, SetEmojiCodesEnabled } from '../../api/chat/ChatEmojis';
import { IsArrowWalkEnabled, SetArrowWalkEnabled } from '../../api/room/ArrowWalkSettings';
import { IPlayerSetting, PlayerSettingToggleComposer, PlayerSettingsEvent, PlayerSettingsRequestComposer, RegisterPlayerSettingsMessages } from '../../api/settings/PlayerSettingsProtocol';
import { useShopSettings } from '../../api/shop/ShopSettings';
import { Button, Column, Flex, ScrollContainer, Text } from '../../common';
import { useMessageEvent, useRoom } from '../../hooks';

// Settings > Options (own feature): every personal on/off command as a switch, so nobody has to type it. Same layout as
// the General tab (ScrollContainer > groups of checkbox rows). The server list only holds what this player may use; the
// Presence ones (:noaura, :noornaments, :nospawn, :noentryspawn) are the shop's settings.

interface IOptionRow { key: string, label: string, description: string, command: string, on: boolean, onChange: () => void }

const GROUPS: { key: string, title: string }[] = [ { key: 'chat', title: 'Chat' }, { key: 'room', title: 'Room' }, { key: 'looks', title: 'Looks' } ];

const OptionRow: FC<{ row: IOptionRow }> = ({ row }) =>
    <Flex alignItems="center" gap={ 2 } shrink>
        <input className="form-check-input flex-shrink-0 m-0" type="checkbox" checked={ row.on } onChange={ row.onChange } />
        <Column gap={ 0 }>
            <Text>{ row.label }</Text>
            <Text small variant="muted">{ row.description }{ row.command ? ` Same as ${ row.command }.` : '' }</Text>
        </Column>
    </Flex>;

export const UserSettingsOptionsView: FC<{}> = props =>
{
    RegisterPlayerSettingsMessages();

    const [ serverSettings, setServerSettings ] = useState<IPlayerSetting[]>([]);
    const { settings: presence, set: setPresence } = useShopSettings();
    const { roomSession = null } = useRoom();
    const [ emojiCodes, setEmojiCodes ] = useState(AreEmojiCodesEnabled());
    const [ arrowWalk, setArrowWalk ] = useState(IsArrowWalkEnabled());

    useMessageEvent<PlayerSettingsEvent>(PlayerSettingsEvent, event => setServerSettings(event.getParser().settings));

    // braces: SendMessageComposer returns a boolean, and anything an effect returns is called as its clean-up
    useEffect(() => { SendMessageComposer(new PlayerSettingsRequestComposer()); }, []);

    const rows: Record<string, IOptionRow[]> = { chat: [], room: [], looks: [] };

    for(const setting of serverSettings)
    {
        (rows[setting.group] || (rows[setting.group] = [])).push({ ...setting, onChange: () => SendMessageComposer(new PlayerSettingToggleComposer(setting.key)) });
    }

    // Presence (hcms-shop): "hide" settings, so "on" = not hidden
    const presenceRow = (key: string, label: string, description: string, command: string): IOptionRow =>
        ({ key, label, description, command, on: !presence[key], onChange: () => setPresence(key, !presence[key]) });

    rows.chat.push({ key: 'emoji_codes', label: 'Emoji codes', description: 'Codes like :skull: turn into emoji in your messages.', command: ':noemoji', on: emojiCodes, onChange: () => { SetEmojiCodesEnabled(!emojiCodes); setEmojiCodes(!emojiCodes); } });
    rows.room.push({ key: 'arrow_walk', label: 'Walk with the arrow keys', description: 'The arrow keys move your Habbo one tile at a time while you are not typing.', command: '', on: arrowWalk, onChange: () => { SetArrowWalkEnabled(!arrowWalk); setArrowWalk(!arrowWalk); } });
    rows.room.push(presenceRow('hide_spawns', 'Other Habbos\' spawns', 'You see the animation when someone enters.', ':nospawn'));
    rows.looks.push(presenceRow('hide_auras', 'Other Habbos\' auras', 'You see the auras others wear.', ':noaura'));
    rows.looks.push(presenceRow('hide_ornaments', 'Other Habbos\' ornaments', 'You see the ornaments behind names.', ':noornaments'));
    rows.looks.push(presenceRow('no_entry_spawn', 'My spawn when I enter', 'Your own spawn plays when you enter a room (:spawn still plays it).', ':noentryspawn'));

    const canManageRoom = !!roomSession && (roomSession.isRoomOwner || (roomSession.controllerLevel >= RoomControllerLevel.GUEST));

    return (
        <ScrollContainer>
            <Column gap={ 3 }>
                { GROUPS.map(group =>
                    !!rows[group.key].length &&
                    <Column key={ group.key } gap={ 1 }>
                        <Text bold>{ group.title }</Text>
                        { rows[group.key].map(row => <OptionRow key={ row.key } row={ row } />) }
                    </Column>) }
                <Column gap={ 1 }>
                    <Text bold>This room</Text>
                    <Text small variant="muted">What visitors may do here (:sit, :lay, push, :enable, dance...) is set in the room's settings, Permissions tab.</Text>
                    <Flex gap={ 1 } className="user-settings-button-group">
                        <Button disabled={ !canManageRoom } onClick={ () => canManageRoom && SendMessageComposer(new RoomSettingsComposer(roomSession.roomId)) }>Open room settings</Button>
                    </Flex>
                    { !canManageRoom && <Text small variant="muted">Go into a room you own or have rights in.</Text> }
                </Column>
            </Column>
        </ScrollContainer>
    );
}
