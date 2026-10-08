import { FC, useState } from 'react';
import { GetConfiguration, TryVisitRoom } from '../../api';
import { HotelAlertCardEvent, IHotelAlertCard, RegisterHotelAlertCardMessages } from '../../api/alerts/HotelAlertCardProtocol';
import { DraggableWindow, LayoutAvatarImageView } from '../../common';
import { useMessageEvent } from '../../hooks';

const BANNER = 'nux/hotel_alert_banner.png';

export const HotelAlertCardView: FC<{}> = props =>
{
    RegisterHotelAlertCardMessages();

    const [ cards, setCards ] = useState<IHotelAlertCard[]>([]);

    useMessageEvent<HotelAlertCardEvent>(HotelAlertCardEvent, event =>
    {
        const card = event.getParser().card;

        if(card) setCards(previous => [ ...previous, card ]);
    });

    const card = cards[0];

    if(!card) return null;

    const close = () => setCards(previous => previous.filter(item => item.id !== card.id));

    const enter = () =>
    {
        if(card.roomId > 0) TryVisitRoom(card.roomId);

        close();
    }

    return (
        <DraggableWindow uniqueKey="hotel-alert-card" handleSelector=".hotel-alert-card-header">
            <div className="hotel-alert-card">
                <div className="hotel-alert-card-header">
                    <span>Message from { card.sender }</span>
                    <div className="hotel-alert-card-close" onClick={ close } />
                </div>
                <div className="hotel-alert-card-banner" style={ { backgroundImage: `url(${ GetConfiguration<string>('image.library.url', '') }${ BANNER })` } }>
                    <LayoutAvatarImageView classNames={ [ 'hotel-alert-card-avatar' ] } figure={ card.figure } direction={ 2 } />
                </div>
                <div className="hotel-alert-card-body">
                    <div className="hotel-alert-card-text">{ card.message }</div>
                    <div className="hotel-alert-card-actions">
                        <div className="hotel-alert-card-button" onClick={ enter }>{ (card.roomId > 0) ? 'Enter the room!' : 'OK' }</div>
                    </div>
                </div>
            </div>
        </DraggableWindow>
    );
}
