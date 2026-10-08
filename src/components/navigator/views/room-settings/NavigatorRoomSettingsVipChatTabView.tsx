import { RoomChatSettings } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText } from '../../../../api';
import { Column, CustomSelect, Flex, NumberInput, Text } from '../../../../common';

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean) => void;
}

const item = (value: number, key: string) => ({ value, text: LocalizeText(key) });

export const NavigatorRoomSettingsVipChatTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null, handleChange = null } = props;
    const [ chatDistance, setChatDistance ] = useState<number>(0);

    useEffect(() =>
    {
        setChatDistance(roomData.chatSettings.distance);
    }, [ roomData.chatSettings ]);

    const thickness = (prefix: string) => [ item(0, prefix + '.normal'), item(1, prefix + '.thick'), item(-1, prefix + '.thin'), item(-2, prefix + '.thinnest') ];

    return (
        <Column gap={ 3 }>
            <Column gap={ 1 }>
                <Text bold textTransform="uppercase" variant="muted">{ LocalizeText('navigator.roomsettings.vip_settings') }</Text>
                <Flex gap={ 1 } fullWidth>
                    <CustomSelect value={ roomData.wallThickness } onChange={ value => handleChange('wall_thickness', value) } items={ thickness('navigator.roomsettings.wall_thickness') } noInvalid />
                    <CustomSelect value={ roomData.floorThickness } onChange={ value => handleChange('floor_thickness', value) } items={ thickness('navigator.roomsettings.floor_thickness') } noInvalid />
                </Flex>
                <Flex alignItems="center" gap={ 2 }>
                    <input className="form-check-input" type="checkbox" checked={ roomData.hideWalls } onChange={ event => handleChange('hide_walls', event.target.checked) } />
                    <Text textTransform="uppercase">{ LocalizeText('navigator.roomsettings.hide_walls') }</Text>
                </Flex>
            </Column>
            <Column gap={ 1 }>
                <Text bold textTransform="uppercase" variant="muted">{ LocalizeText('navigator.roomsettings.chat_settings') }</Text>
                <Text variant="muted">{ LocalizeText('navigator.roomsettings.chat_settings.info') }</Text>
                <Flex gap={ 1 } fullWidth>
                    <CustomSelect value={ roomData.chatSettings.mode } onChange={ value => handleChange('bubble_mode', value) } noInvalid
                        items={ [ item(RoomChatSettings.CHAT_MODE_FREE_FLOW, 'navigator.roomsettings.chat.mode.free.flow'), item(RoomChatSettings.CHAT_MODE_LINE_BY_LINE, 'navigator.roomsettings.chat.mode.line.by.line') ] } />
                    <CustomSelect value={ roomData.chatSettings.weight } onChange={ value => handleChange('chat_weight', value) } noInvalid
                        items={ [ item(RoomChatSettings.CHAT_BUBBLE_WIDTH_NORMAL, 'navigator.roomsettings.chat.bubbles.width.normal'), item(RoomChatSettings.CHAT_BUBBLE_WIDTH_THIN, 'navigator.roomsettings.chat.bubbles.width.thin'), item(RoomChatSettings.CHAT_BUBBLE_WIDTH_WIDE, 'navigator.roomsettings.chat.bubbles.width.wide') ] } />
                </Flex>
                <Flex gap={ 1 } fullWidth>
                    <CustomSelect value={ roomData.chatSettings.speed } onChange={ value => handleChange('bubble_speed', value) } noInvalid
                        items={ [ item(RoomChatSettings.CHAT_SCROLL_SPEED_FAST, 'navigator.roomsettings.chat.speed.fast'), item(RoomChatSettings.CHAT_SCROLL_SPEED_NORMAL, 'navigator.roomsettings.chat.speed.normal'), item(RoomChatSettings.CHAT_SCROLL_SPEED_SLOW, 'navigator.roomsettings.chat.speed.slow') ] } />
                    <CustomSelect value={ roomData.chatSettings.protection } onChange={ value => handleChange('flood_protection', value) } noInvalid
                        items={ [ item(RoomChatSettings.FLOOD_FILTER_LOOSE, 'navigator.roomsettings.chat.flood.loose'), item(RoomChatSettings.FLOOD_FILTER_NORMAL, 'navigator.roomsettings.chat.flood.normal'), item(RoomChatSettings.FLOOD_FILTER_STRICT, 'navigator.roomsettings.chat.flood.strict') ] } />
                </Flex>
                <Flex alignItems="center" gap={ 2 }>
                    <NumberInput min={ 0 } value={ chatDistance } onEvent={ value => setChatDistance(value) } onBlur={ () => handleChange('chat_distance', chatDistance) } style={ { maxWidth: 120 } } />
                    <Text textTransform="uppercase">{ LocalizeText('navigator.roomsettings.chat_settings.hearing.distance') }</Text>
                </Flex>
            </Column>
        </Column>
    );
}
