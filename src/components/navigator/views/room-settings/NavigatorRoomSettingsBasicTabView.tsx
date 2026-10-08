import { RoomDeleteComposer, RoomSettingsSaveErrorEvent, RoomSettingsSaveErrorParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { CreateLinkEvent, GetMaxVisitorsList, IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { Column, CustomSelect, Flex, Text } from '../../../../common';
import { useMessageEvent, useNavigator, useNotification } from '../../../../hooks';

const ROOM_NAME_MIN_LENGTH = 3;
const ROOM_NAME_MAX_LENGTH = 60;
const DESC_MAX_LENGTH = 255;
const TAGS_MAX_LENGTH = 15;

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean | string[]) => void;
    onClose: () => void;
}

export const NavigatorRoomSettingsBasicTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null, handleChange = null, onClose = null } = props;
    const [ roomName, setRoomName ] = useState<string>('');
    const [ roomDescription, setRoomDescription ] = useState<string>('');
    const [ roomTag1, setRoomTag1 ] = useState<string>('');
    const [ roomTag2, setRoomTag2 ] = useState<string>('');
    const [ tagIndex, setTagIndex ] = useState(0);
    const [ typeError, setTypeError ] = useState<string>('');
    const { showConfirm = null } = useNotification();
    const { categories = null } = useNavigator();

    useMessageEvent<RoomSettingsSaveErrorEvent>(RoomSettingsSaveErrorEvent, event =>
    {
        const parser = event.getParser();

        if (!parser) return;

        switch (parser.code)
        {
            case RoomSettingsSaveErrorParser.ERROR_INVALID_TAG:
                setTypeError('navigator.roomsettings.unacceptablewords');
            case RoomSettingsSaveErrorParser.ERROR_NON_USER_CHOOSABLE_TAG:
                setTypeError('navigator.roomsettings.nonuserchoosabletag');
                break;
            default:
                setTypeError('');
                break;
        }
    });

    const deleteRoom = () =>
    {
        showConfirm(LocalizeText('navigator.roomsettings.deleteroom.confirm.message', [ 'room_name' ], [ roomData.roomName ] ), () =>
        {
            SendMessageComposer(new RoomDeleteComposer(roomData.roomId));

            if(onClose) onClose();

            CreateLinkEvent('navigator/search/myworld_view');
        },
        null, null, null, LocalizeText('navigator.roomsettings.deleteroom.confirm.title'));
    }

    const saveRoomName = () =>
    {
        if((roomName === roomData.roomName) || (roomName.length < ROOM_NAME_MIN_LENGTH) || (roomName.length > ROOM_NAME_MAX_LENGTH)) return;

        handleChange('name', roomName);
    }

    const saveRoomDescription = () =>
    {
        if((roomDescription === roomData.roomDescription) || (roomDescription.length > DESC_MAX_LENGTH)) return;

        handleChange('description', roomDescription);
    }

    const saveTags = (index: number) =>
    {
        if(index === 0 && (roomTag1 === roomData.tags[0]) || (roomTag1.length > TAGS_MAX_LENGTH)) return;

        if(index === 1 && (roomTag2 === roomData.tags[1]) || (roomTag2.length > TAGS_MAX_LENGTH)) return;

        if(roomTag1 === '' && roomTag2 !== '') setRoomTag2('');

        setTypeError('');
        setTagIndex(index);
        handleChange('tags', (roomTag1 === '' && roomTag2 !== '') ? [ roomTag2 ] : [ roomTag1, roomTag2 ]);
    }

    useEffect(() =>
    {
        setRoomName(roomData.roomName);
        setRoomDescription(roomData.roomDescription);
        setRoomTag1((roomData.tags.length > 0 && roomData.tags[0]) ? roomData.tags[0] : '');
        setRoomTag2((roomData.tags.length > 0 && roomData.tags[1]) ? roomData.tags[1] : '');
    }, [ roomData ]);

    // Structure of HabboCity's room settings "Basic" tab (live DOM): every field is a Column with its label ABOVE it (muted, bold, uppercase),
    // max visitors and trade settings share one row, the two tags share one row, and the selects are the shared custom select - never a
    // native <select>, whose option list is drawn in black by the browser.
    const label = (text: string) => <Text variant="muted" bold noWrap textTransform="uppercase" className="col-3">{ text }</Text>;

    return (
        <>
            <Column gap={ 1 }>
                { label(LocalizeText('navigator.roomname')) }
                <Column fullWidth>
                    <input className="form-control form-control-sm" value={ roomName } maxLength={ ROOM_NAME_MAX_LENGTH } onChange={ event => setRoomName(event.target.value) } onBlur={ saveRoomName } />
                    { (roomName.length < ROOM_NAME_MIN_LENGTH) &&
                        <Text bold small variant="danger">
                            { LocalizeText('navigator.roomsettings.roomnameismandatory') }
                        </Text> }
                </Column>
            </Column>
            <Column gap={ 1 }>
                { label(LocalizeText('navigator.roomsettings.desc')) }
                <textarea className="form-control form-control-sm" value={ roomDescription } maxLength={ DESC_MAX_LENGTH } onChange={ event => setRoomDescription(event.target.value) } onBlur={ saveRoomDescription } />
            </Column>
            <Column gap={ 1 }>
                { label(LocalizeText('navigator.category')) }
                <CustomSelect value={ roomData.categoryId } onChange={ value => handleChange('category', value) } items={ (categories || []).map(category => ({ value: category.id, text: LocalizeText(category.name) })) } />
            </Column>
            <Flex gap={ 1 }>
                <Column fullWidth fullHeight gap={ 1 }>
                    { label(LocalizeText('navigator.maxvisitors')) }
                    <CustomSelect value={ roomData.userCount } onChange={ value => handleChange('max_visitors', value) } items={ (GetMaxVisitorsList || []).map(value => ({ value, text: String(value) })) } />
                </Column>
                <Column fullWidth fullHeight gap={ 1 }>
                    { label(LocalizeText('navigator.tradesettings')) }
                    <CustomSelect
                        value={ roomData.tradeState }
                        onChange={ value => handleChange('trade_state', value) }
                        items={ [
                            { value: 0, text: LocalizeText('navigator.roomsettings.trade_not_allowed') },
                            { value: 1, text: LocalizeText('navigator.roomsettings.trade_not_with_Controller') },
                            { value: 2, text: LocalizeText('navigator.roomsettings.trade_allowed') }
                        ] } />
                </Column>
            </Flex>
            <Column gap={ 1 }>
                { label(LocalizeText('navigator.tags')) }
                <Flex gap={ 1 }>
                    <Column fullWidth>
                        <input className="form-control form-control-sm" value={ roomTag1 } onChange={ event => setRoomTag1(event.target.value) } onBlur={ () => saveTags(0) } />
                        { (roomTag1.length > TAGS_MAX_LENGTH) &&
                            <Text bold small variant="danger">
                                { LocalizeText('navigator.roomsettings.toomanycharacters') }
                            </Text> }
                        { (tagIndex === 0 && typeError != '') &&
                            <Text bold small variant="danger">
                                { LocalizeText(typeError) }
                            </Text> }
                    </Column>
                    <Column fullWidth>
                        <input className="form-control form-control-sm" value={ roomTag2 } onChange={ event => setRoomTag2(event.target.value) } onBlur={ () => saveTags(1) } />
                        { (roomTag2.length > TAGS_MAX_LENGTH) &&
                            <Text bold small variant="danger">
                                { LocalizeText('navigator.roomsettings.toomanycharacters') }
                            </Text> }
                        { (tagIndex === 1 && typeError != '') &&
                            <Text bold small variant="danger">
                                { LocalizeText(typeError) }
                            </Text> }
                    </Column>
                </Flex>
            </Column>
            <Flex alignItems="center" gap={ 2 }>
                <input className="form-check-input" type="checkbox" checked={ roomData.allowWalkthrough } onChange={ event => handleChange('allow_walkthrough', event.target.checked) } />
                <Text noWrap textTransform="uppercase">{ LocalizeText('navigator.roomsettings.allow_walk_through') }</Text>
            </Flex>
            <Text variant="danger" underline bold pointer className="d-flex justify-content-center align-items-center gap-1" onClick={ deleteRoom }>
                <FaTimes className="fa-icon" />
                { LocalizeText('navigator.roomsettings.delete') }
            </Text>
        </>
    );
};
