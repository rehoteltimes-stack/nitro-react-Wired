import { RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GrFormNextLink } from 'react-icons/gr';
import { AddEventLinkTracker, RemoveLinkEventTracker, SendMessageComposer } from '../../../../api';
import { BotWalkComposer, RegisterBotWalkMessages } from '../../../../api/room/BotWalkProtocol';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../../common';
import { useRoomSessionManagerEvent } from '../../../../hooks';

const STEPS = [
    { title: 'Walk up-left', deltaX: -1, deltaY: 0, rotation: 225 },
    { title: 'Walk up-right', deltaX: 0, deltaY: -1, rotation: 315 },
    { title: 'Walk down-left', deltaX: 0, deltaY: 1, rotation: 135 },
    { title: 'Walk down-right', deltaX: 1, deltaY: 0, rotation: 45 }
];

export const BotWalkView: FC<{}> = props =>
{
    const [ bot, setBot ] = useState<{ roomIndex: number, name: string }>(null);

    useEffect(() =>
    {
        const linkTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if((parts.length < 4) || (parts[1] !== 'open')) return;

                const roomIndex = parseInt(parts[2]);

                if(isNaN(roomIndex)) return;

                RegisterBotWalkMessages();
                setBot({ roomIndex, name: decodeURIComponent(parts.slice(3).join('/')) });
            },
            eventUrlPrefix: 'bot-walk/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useRoomSessionManagerEvent<RoomSessionEvent>([ RoomSessionEvent.CREATED, RoomSessionEvent.ENDED ], () => setBot(null));

    if(!bot) return null;

    return (
        <NitroCardView uniqueKey="bot-walk" className="nitro-bot-walk" theme="primary-slim" style={ { width: 170 } }>
            <NitroCardHeaderView headerText={ `Walk - ${ bot.name }` } onCloseClick={ () => setBot(null) } />
            <NitroCardContentView gap={ 2 } alignItems="center">
                <div className="bot-walk-pad">
                    { STEPS.map(step =>
                        <button key={ step.title } className="bot-walk-btn" title={ step.title } onClick={ () => SendMessageComposer(new BotWalkComposer(bot.roomIndex, step.deltaX, step.deltaY)) }>
                            <GrFormNextLink size="1.4em" style={ { transform: `rotate(${ step.rotation }deg)` } } />
                        </button>) }
                </div>
                <Text small center className="bot-walk-info">Each click walks the bot one tile.</Text>
            </NitroCardContentView>
        </NitroCardView>
    );
}
