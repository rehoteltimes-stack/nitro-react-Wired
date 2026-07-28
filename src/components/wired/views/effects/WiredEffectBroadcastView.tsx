import { FC, useEffect, useMemo, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredMessageEditor } from '../message-editor/WiredMessageEditor';
import { limitWiredMessage, normalizeWiredMessageWidth, WIRED_MESSAGE_ALIGN_LEFT, WIRED_MESSAGE_WIDTH_DEFAULT } from '../message-editor/WiredMessageFormatting';
import { parseWiredData, WiredCheckbox, WiredDisabled, WiredParam, WiredTextInput } from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';

interface BroadcastData
{
    message?: string;
    channel?: string;
    event?: string;
    valueInput?: string;
    valueEnabled?: boolean;
    bubbleWidth?: number;
    textAlignment?: number;
}

const sanitizeRouteName = (input: string) =>
{
    let result = '';

    for(const character of input.toLowerCase())
    {
        if(/[a-z0-9_]/.test(character)) result += character;
        else if(/\s/.test(character)) result += '_';
    }

    return result.slice(0, 40);
};

const sanitizeBroadcastValue = (input: string, currentValue: string) =>
{
    const value = input.replace(/\s/g, '').toLowerCase();

    if(/^-?[0-9]*$/.test(value)) return value;
    if(value === '$' || /^\$\([a-z0-9_]{0,40}\)?$/.test(value)) return value;

    return currentValue;
};

const isValidBroadcastValue = (value: string) =>
    /^-?[0-9]+$/.test(value) || /^\$\([a-z0-9_]{1,40}\)$/.test(value);

const isValidRouteName = (value: string) =>
    /^[a-z0-9_]{1,40}$/.test(value) && /[a-z0-9]/.test(value);

export const WiredEffectBroadcastView: FC<{}> = () =>
{
    const [ message, setMessage ] = useState('');
    const [ channel, setChannel ] = useState('');
    const [ eventName, setEventName ] = useState('');
    const [ valueEnabled, setValueEnabled ] = useState(false);
    const [ valueInput, setValueInput ] = useState('');
    const [ bubbleWidth, setBubbleWidth ] = useState(WIRED_MESSAGE_WIDTH_DEFAULT);
    const [ textAlignment, setTextAlignment ] = useState(WIRED_MESSAGE_ALIGN_LEFT);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const data = useMemo(() => parseWiredData<BroadcastData>(trigger?.stringData ?? ''), [ trigger ]);

    const save = () =>
    {
        setStringParam(JSON.stringify({
            message,
            channel,
            event: eventName,
            valueInput,
            valueEnabled,
            bubbleWidth,
            textAlignment
        }));
        setIntParams([ valueEnabled ? 1 : 0 ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        setMessage(data.message ?? '');
        setChannel(data.channel ?? '');
        setEventName(data.event ?? '');
        setValueEnabled(((trigger.intData?.[0] ?? (data.valueEnabled ? 1 : 0)) === 1));
        setValueInput(data.valueInput ?? '');
        setBubbleWidth(normalizeWiredMessageWidth(data.bubbleWidth ?? WIRED_MESSAGE_WIDTH_DEFAULT));
        setTextAlignment(data.textAlignment ?? WIRED_MESSAGE_ALIGN_LEFT);
    }, [ trigger, data ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            validate={ () => isValidRouteName(channel) && isValidRouteName(eventName) && (!valueEnabled || isValidBroadcastValue(valueInput)) }>
            <Column gap={ 1 }>
                <WiredParam title="Message">
                    <WiredMessageEditor
                        value={ message }
                        bubbleWidth={ bubbleWidth }
                        onBubbleWidthChange={ setBubbleWidth }
                        textAlignment={ textAlignment }
                        onTextAlignmentChange={ setTextAlignment }
                        onChange={ value => setMessage(limitWiredMessage(value)) } />
                </WiredParam>

                <WiredParam title="Channel">
                    <WiredTextInput
                        type="text"
                        value={ channel }
                        maxLength={ 40 }
                        onChange={ event => setChannel(sanitizeRouteName(event.target.value)) } />
                </WiredParam>

                <WiredParam title="Event">
                    <WiredTextInput
                        type="text"
                        value={ eventName }
                        maxLength={ 40 }
                        onChange={ event => setEventName(sanitizeRouteName(event.target.value)) } />
                </WiredParam>

                <WiredParam title="Value" divider={ false }>
                    <Flex className="nw-inline-input-row" alignItems="center" gap={ 1 }>
                        <WiredCheckbox
                            checked={ valueEnabled }
                            onChange={ setValueEnabled } />
                        <WiredDisabled disabled={ !valueEnabled }>
                            <WiredTextInput
                                type="text"
                                value={ valueInput }
                                placeholder="Int or placeholder values"
                                onChange={ event => setValueInput(sanitizeBroadcastValue(event.target.value, valueInput)) } />
                        </WiredDisabled>
                    </Flex>
                </WiredParam>
            </Column>
        </WiredEffectBaseView>
    );
}
