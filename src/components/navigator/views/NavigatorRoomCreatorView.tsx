import { CreateFlatMessageComposer, HabboClubLevelEnum } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetClubMemberLevel, GetConfiguration, IRoomModel, LocalizeText, SendMessageComposer } from '../../../api';
import { Column, CustomSelect, Flex, HoloButton, LayoutCurrencyIcon, PeekCarousel, Text } from '../../../common';
import { useNavigator } from '../../../hooks';

export const NavigatorRoomCreatorView: FC<{}> = props =>
{
    const [ maxVisitorsList, setMaxVisitorsList ] = useState<number[]>(null);
    const [ name, setName ] = useState<string>(null);
    const [ description, setDescription ] = useState<string>(null);
    const [ category, setCategory ] = useState<number>(null);
    const [ visitorsCount, setVisitorsCount ] = useState<number>(null);
    const [ tradesSetting, setTradesSetting ] = useState<number>(0);
    const [ roomModels, setRoomModels ] = useState<IRoomModel[]>([]);
    const [ selectedModel, setSelectedModel ] = useState<IRoomModel>(null);
    const { categories = null } = useNavigator();

    const hcDisabled = GetConfiguration<boolean>('hc.disabled', false);

    const getRoomModelImage = (name: string) => GetConfiguration<string>('images.url') + `/navigator/models/model_${ name }.png`;

    const createRoom = () => SendMessageComposer(new CreateFlatMessageComposer(name, (description || ''), ('model_' + selectedModel?.name), Number(category), Number(visitorsCount), tradesSetting));

    useEffect(() =>
    {
        if(!maxVisitorsList)
        {
            const list = [];

            for(let i = 10; i <= 100; i = i + 10) list.push(i);

            setMaxVisitorsList(list);
            setVisitorsCount(list[list.length - 1]);
        }
    }, [ maxVisitorsList ]);

    useEffect(() =>
    {
        if(categories && categories.length) setCategory(categories[0].id);
    }, [ categories ]);

    useEffect(() =>
    {
        const models = GetConfiguration<IRoomModel[]>('navigator.room.models');

        if(models && models.length)
        {
            setRoomModels(models);
            setSelectedModel(models[0]);
        }
    }, []);

    const isValidName = (name && (name.length >= 3));

    return (
        <Column className="holo-room-creator" justifyContent="between" fullHeight>
            <div className="holo-room-creator-carousel-container room-creator-model-background">
                <PeekCarousel
                    className="holo-room-creator-carousel"
                    elements={ roomModels.map(model => (
                        <Column key={ model.name } gap={ 0 } className="holo-room-creator-carousel-item">
                            <Flex fullHeight center overflow="hidden">
                                <img alt="" src={ getRoomModelImage(model.name) } />
                            </Flex>
                            { !hcDisabled && (model.clubLevel > HabboClubLevelEnum.NO_CLUB) &&
                                <LayoutCurrencyIcon position="absolute" className="top-1 end-1" type="hc" /> }
                        </Column>
                    )) }
                    onNavigate={ event => setSelectedModel(roomModels[event.index]) }
                    legend={ `${ selectedModel?.tileSize } ${ LocalizeText('navigator.createroom.tilesize') }` }
                />
            </div>
            <Column grow size={ 6 } gap={ 2 } fullWidth>
                <Text textTransform="uppercase">{ LocalizeText('navigator.createroom.roomnameinfo') }</Text>
                <input type="text" className="form-control form-control-sm" maxLength={ 60 } onChange={ event => setName(event.target.value) } placeholder={ LocalizeText('navigator.createroom.roomnameinfo') } />
                <Text textTransform="uppercase">{ LocalizeText('navigator.createroom.roomdescinfo') }</Text>
                <textarea className="flex-grow-1 form-control form-control-sm w-100" maxLength={ 255 } onChange={ event => setDescription(event.target.value) } placeholder={ LocalizeText('navigator.createroom.roomdescinfo') } />
                <Text textTransform="uppercase">{ LocalizeText('navigator.tradesettings') }</Text>
                <CustomSelect
                    value={ tradesSetting }
                    onChange={ setTradesSetting }
                    noInvalid
                    items={ [
                        { value: 0, text: LocalizeText('navigator.roomsettings.trade_not_allowed') },
                        { value: 1, text: LocalizeText('navigator.roomsettings.trade_not_with_Controller') },
                        { value: 2, text: LocalizeText('navigator.roomsettings.trade_allowed') }
                    ] }
                />
                <Flex shrink gap={ 2 }>
                    <Column gap={ 1 } fullWidth>
                        <Text textTransform="uppercase">{ LocalizeText('navigator.maxvisitors') }</Text>
                        <CustomSelect value={ visitorsCount } onChange={ setVisitorsCount } noInvalid items={ (maxVisitorsList ?? []).map(value => ({ value, text: value.toString() })) } />
                    </Column>
                    <Column gap={ 1 } fullWidth>
                        <Text textTransform="uppercase">{ LocalizeText('navigator.category') }</Text>
                        <CustomSelect value={ category } onChange={ setCategory } noInvalid items={ (categories ?? []).map(entry => ({ value: entry.id, text: LocalizeText(entry.name) })) } />
                    </Column>
                </Flex>
            </Column>
            <HoloButton fullWidth onClick={ isValidName ? createRoom : undefined } disabled={ !isValidName } text={ LocalizeText('navigator.createroom.create') } iconClass="icon-navigator-create-room" variant={ isValidName ? 'success' : 'danger' } />
        </Column>
    );
}
