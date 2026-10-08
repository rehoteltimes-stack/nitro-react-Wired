import { FC } from 'react';
import { IRoomData, RoomPermissionFlag } from '../../../../api';
import { Column, Flex, NumberInput, ScrollContainer, Text } from '../../../../common';

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean | string[]) => void;
}

const COMMANDS: [ string, RoomPermissionFlag, string ][] = [
    [ 'can_enable', 'canEnable', 'Allow the :enable command' ],
    [ 'can_handitem', 'canHanditem', 'Allow the :handitem command' ],
    [ 'can_fastwalk', 'canFastwalk', 'Allow the :cars command' ],
    [ 'can_moonwalk', 'canMoonwalk', 'Allow the :moonwalk command' ],
    [ 'pushmode', 'pushmode', 'Allow the :push, :pull, :spull, etc. commands' ],
    [ 'can_transform', 'canTransform', 'Allow the :transform and :transf commands' ]
];

const ACTIONS: [ string, RoomPermissionFlag, string ][] = [
    [ 'can_sit', 'canSit', 'Allow the sit action' ],
    [ 'can_lay', 'canLay', 'Allow the lay action' ],
    [ 'can_giveitem', 'canGiveitem', 'Allow giving items' ],
    [ 'can_danse', 'canDanse', 'Allow the dance action' ],
    [ 'can_sign', 'canSign', 'Allow the sign action' ],
    [ 'can_greet', 'canGreet', 'Allow the greet action' ],
    [ 'can_laugh', 'canLaugh', 'Allow the laugh action' ],
    [ 'can_kiss', 'canKiss', 'Allow the kiss action' ],
    [ 'can_afk', 'canAfk', 'Allow the away action' ],
    [ 'can_jump', 'canJump', 'Allow the jump action' ],
    [ 'can_thumb_up', 'canThumbUp', 'Allow the "_b" (thumbs up) gesture' ]
];

const WALK_OPTIONS = [ 'Classic', 'Block diagonal between two furniture', 'Block diagonal' ];

export const NavigatorRoomSettingsPermissionsTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null, handleChange = null } = props;
    const permissions = roomData.permissions;

    const checkbox = (field: string, flag: RoomPermissionFlag, text: string) => (
        <Flex key={ field } gap={ 2 } alignItems="center">
            <input className="form-check-input" type="checkbox" checked={ !!permissions[flag] } onChange={ event => handleChange(field, event.target.checked) } />
            <Text noWrap>{ text }</Text>
        </Flex>
    );

    return (
        <Column fullWidth className="room-settings-permissions-tab">
            <ScrollContainer>
                <Column gap={ 3 }>
                    <Column gap={ 1 }>
                        <Text bold textTransform="uppercase" variant="muted">Commands</Text>
                        { COMMANDS.map(([ field, flag, text ]) => checkbox(field, flag, text)) }
                    </Column>
                    <Column gap={ 1 }>
                        <Text bold textTransform="uppercase" variant="muted">Actions</Text>
                        { ACTIONS.map(([ field, flag, text ]) => checkbox(field, flag, text)) }
                    </Column>
                    <Column gap={ 2 }>
                        <Text bold textTransform="uppercase" variant="muted">Walk options:</Text>
                        <Column gap={ 1 }>
                            <Column gap={ 1 }>
                                { WALK_OPTIONS.map((text, index) => (
                                    <Flex key={ index } alignItems="center" gap={ 1 }>
                                        <input className="form-check-input" type="radio" name="walkOptions" id={ 'walkOptions' + index } checked={ permissions.diagonalMode === index } onChange={ () => handleChange('diagonal_mode', index) } />
                                        <Text>{ text }</Text>
                                    </Flex>
                                )) }
                            </Column>
                        </Column>
                    </Column>
                    <Column gap={ 1 }>
                        <Text bold textTransform="uppercase" variant="muted">Other</Text>
                        { checkbox('can_change_look', 'canChangeLook', 'Allow changing clothes') }
                        { checkbox('show_bubble', 'showBubble', 'Show the chat bubble') }
                        <Flex gap={ 2 } alignItems="center">
                            <Text noWrap>Roller speed:</Text>
                            <NumberInput min={ 1 } max={ 500 } step={ 1 } value={ permissions.setSpeed } onEvent={ value => handleChange('set_speed', value ?? 5) } />
                        </Flex>
                    </Column>
                </Column>
            </ScrollContainer>
        </Column>
    );
};
