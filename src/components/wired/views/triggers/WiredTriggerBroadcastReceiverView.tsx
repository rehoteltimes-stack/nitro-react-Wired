import { FC, useEffect, useMemo, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column } from '../../../../common';
import { useWired } from '../../../../hooks';
import { parseWiredData, WiredDisabled, WiredParam, WiredSelect } from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

interface BroadcastChannel
{
    name: string;
    events: string[];
}

interface BroadcastReceiverData
{
    channel?: string;
    event?: string;
    channels?: BroadcastChannel[];
}

const ALL_EVENTS = '*';

export const WiredTriggerBroadcastReceiverView: FC<{}> = () =>
{
    const [ channel, setChannel ] = useState('');
    const [ eventName, setEventName ] = useState('');
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const data = useMemo(() => parseWiredData<BroadcastReceiverData>(trigger?.stringData ?? ''), [ trigger ]);
    const channels = data.channels ?? [];
    const selectedChannel = channels.find(option => option.name === channel);
    const events = selectedChannel?.events ?? [];

    const save = () =>
    {
        setStringParam(JSON.stringify({ channel, event: eventName }));
        setIntParams([]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        setChannel(data.channel ?? '');
        setEventName(data.event ?? '');
    }, [ trigger, data ]);

    return (
        <WiredTriggerBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            validate={ () => !!channel && !!eventName }>
            <Column gap={ 1 }>
                <WiredParam title="Channel">
                    <WiredSelect
                        value={ channel }
                        onChange={ event =>
                        {
                            setChannel(event.target.value);
                            setEventName('');
                        } }
                        options={ [
                            { value: '', label: 'Select a channel', disabled: true },
                            ...channels.map(option => ({ value: option.name, label: option.name }))
                        ] } />
                </WiredParam>

                <WiredParam title="Event" divider={ false }>
                    <WiredDisabled disabled={ !channel }>
                        <WiredSelect
                            value={ eventName }
                            disabled={ !channel }
                            onChange={ event => setEventName(event.target.value) }
                            options={ [
                                { value: '', label: 'Select an event', disabled: true },
                                { value: ALL_EVENTS, label: 'All Events' },
                                ...events.map(event => ({ value: event, label: event }))
                            ] } />
                    </WiredDisabled>
                </WiredParam>
            </Column>
        </WiredTriggerBaseView>
    );
}
