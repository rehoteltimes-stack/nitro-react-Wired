import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useNavigator } from '../../../../hooks';

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean) => void;
}

export const NavigatorRoomSettingsAccessTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null, handleChange = null } = props;
    const [ password, setPassword ] = useState<string>('');
    const [ confirmPassword, setConfirmPassword ] = useState('');
    const [ isTryingPassword, setIsTryingPassword ] = useState(false);
    const { navigatorData = null } = useNavigator();

    const saveRoomPassword = () =>
    {
        if(!isTryingPassword || ((password.length <= 0) || (confirmPassword.length <= 0) || (password !== confirmPassword))) return;

        handleChange('password', password);
    }

    useEffect(() =>
    {
        setPassword('');
        setConfirmPassword('');
        setIsTryingPassword(false);
    }, [ roomData ]);

    const doorMode = (state: number, text: string) => (
        <Flex alignItems="center" gap={ 2 }>
            <input className="form-check-input" type="radio" name="lockState" checked={ (roomData.lockState === state) && !isTryingPassword } onChange={ () => handleChange('lock_state', state) } />
            <Text noWrap textTransform="uppercase">{ LocalizeText(text) }</Text>
        </Flex>
    );

    return (
        <>
            <Column gap={ 1 }>
                <Text bold textTransform="uppercase" variant="muted">{ LocalizeText('navigator.roomsettings.roomaccess.caption') }</Text>
                <Text variant="muted">{ LocalizeText('navigator.roomsettings.roomaccess.info') }</Text>
            </Column>
            <Column>
                <Column gap={ 1 }>
                    { doorMode(RoomDataParser.OPEN_STATE, 'navigator.roomsettings.doormode.open') }
                    { doorMode(RoomDataParser.DOORBELL_STATE, 'navigator.roomsettings.doormode.doorbell') }
                    { navigatorData && !navigatorData.enteredGuestRoom?.groupBadgeCode && doorMode(RoomDataParser.INVISIBLE_STATE, 'navigator.roomsettings.doormode.invisible') }
                    <Flex alignItems="center" gap={ 2 } fullWidth>
                        <input className="form-check-input" type="radio" name="lockState" checked={ (roomData.lockState === RoomDataParser.PASSWORD_STATE) || isTryingPassword } onChange={ event => setIsTryingPassword(event.target.checked) } />
                        <Text textTransform="uppercase">{ LocalizeText('navigator.roomsettings.doormode.password') }</Text>
                    </Flex>
                    { (isTryingPassword || (roomData.lockState === RoomDataParser.PASSWORD_STATE)) &&
                        <>
                            <Flex gap={ 1 }>
                                <input type="password" className="form-control form-control-sm" value={ password } onChange={ event => setPassword(event.target.value) } placeholder={ LocalizeText('navigator.roomsettings.password') } onFocus={ () => setIsTryingPassword(true) } />
                                <input type="password" className="form-control form-control-sm" value={ confirmPassword } onChange={ event => setConfirmPassword(event.target.value) } onBlur={ saveRoomPassword } placeholder={ LocalizeText('navigator.roomsettings.passwordconfirm') } />
                            </Flex>
                            { isTryingPassword && (password.length <= 0) &&
                                <Text bold small variant="danger">{ LocalizeText('navigator.roomsettings.passwordismandatory') }</Text> }
                            { isTryingPassword && (password.length > 0) && (password !== confirmPassword) &&
                                <Text bold small variant="danger">{ LocalizeText('navigator.roomsettings.invalidconfirm') }</Text> }
                        </> }
                </Column>
                <Column gap={ 1 }>
                    <Text bold textTransform="uppercase" variant="muted">{ LocalizeText('navigator.roomsettings.pets') }</Text>
                    <Flex alignItems="center" gap={ 2 }>
                        <input className="form-check-input" type="checkbox" checked={ roomData.allowPets } onChange={ event => handleChange('allow_pets', event.target.checked) } />
                        <Text noWrap textTransform="uppercase">{ LocalizeText('navigator.roomsettings.allowpets') }</Text>
                    </Flex>
                    <Flex alignItems="center" gap={ 2 }>
                        <input className="form-check-input" type="checkbox" checked={ roomData.allowPetsEat } onChange={ event => handleChange('allow_pets_eat', event.target.checked) } />
                        <Text noWrap textTransform="uppercase">{ LocalizeText('navigator.roomsettings.allowfoodconsume') }</Text>
                    </Flex>
                </Column>
            </Column>
        </>
    );
};
