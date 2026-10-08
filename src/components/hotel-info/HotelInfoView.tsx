import { FC, ReactNode, useState } from 'react';
import { HotelInfoEvent, HotelPluginsEvent, IHotelInfo, IHotelPlugins, RegisterHotelInfoMessages } from '../../api/info/HotelInfoProtocol';
import { DraggableWindowPosition, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useMessageEvent } from '../../hooks';

const uptimeText = (seconds: number) =>
{
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${ days > 0 ? `${ days }d ` : '' }${ hours }h ${ minutes }m`;
}

const Row: FC<{ label: string, value: string | number }> = ({ label, value }) =>
    <div className="case"><div className="l">{ label }</div><div className="r">{ value }</div></div>;

const HotelCard: FC<{ cardKey: number, uniqueKey: string, name: string, subtitle: string, title: string, onClose: () => void, children: ReactNode }> = ({ cardKey, uniqueKey, name, subtitle, title, onClose, children }) =>
    <NitroCardView key={ cardKey } uniqueKey={ uniqueKey } className="nitro-hotel-card" theme="primary-slim" windowPosition={ DraggableWindowPosition.TOP_CENTER } style={ { width: 380 } }>
        <NitroCardHeaderView classNames={ [ 'hotel-card-header' ] } headerText={ <span className="hotel-card-banner"><span className="info-icon" /><span className="name"><b>{ name }</b><span>{ subtitle }</span></span></span> } onCloseClick={ onClose } />
        <NitroCardContentView gap={ 0 }>
            <div className="hotel-card-body">
                <h4>{ title }</h4>
                <hr />
                { children }
            </div>
        </NitroCardContentView>
    </NitroCardView>;

export const HotelInfoView: FC<{}> = props =>
{
    RegisterHotelInfoMessages();

    const [ info, setInfo ] = useState<IHotelInfo>(null);
    const [ openedAt, setOpenedAt ] = useState(0);
    const [ plugins, setPlugins ] = useState<IHotelPlugins>(null);
    const [ pluginsAt, setPluginsAt ] = useState(0);

    useMessageEvent<HotelInfoEvent>(HotelInfoEvent, event =>
    {
        setInfo(event.getParser().info);
        setOpenedAt(Date.now());
    });

    useMessageEvent<HotelPluginsEvent>(HotelPluginsEvent, event =>
    {
        setPlugins(event.getParser().list);
        setPluginsAt(Date.now());
    });

    return (
        <>
            { info &&
                <HotelCard cardKey={ openedAt } uniqueKey="hotel-info" name={ info.name } subtitle={ `Version ${ info.version }` } title={ `${ info.name } Information` } onClose={ () => setInfo(null) }>
                    <Row label="Engine" value={ info.engine } />
                    <Row label="Licensed to" value={ info.licensee } />
                    <Row label="Copyright" value={ `© ${ info.copyright }` } />
                    <hr />
                    <Row label="Active since" value={ uptimeText(info.uptime) } />
                    <Row label="Users online" value={ info.online } />
                    <Row label="Active rooms" value={ info.rooms } />
                    <Row label="Total users" value={ info.total } />
                    <Row label="Registered today" value={ info.today } />
                </HotelCard> }
            { plugins &&
                <HotelCard cardKey={ pluginsAt } uniqueKey="hotel-plugins" name={ plugins.name } subtitle={ `${ plugins.plugins.length } plugins loaded` } title={ `${ plugins.name } Plugins` } onClose={ () => setPlugins(null) }>
                    <div className="hotel-card-list">
                        { plugins.plugins.map((plugin, index) => <Row key={ index } label={ plugin.name } value={ `by ${ plugin.author }` } />) }
                    </div>
                </HotelCard> }
        </>
    );
}
