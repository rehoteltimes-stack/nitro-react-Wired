import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { WiredVariableDefinitionMetadata, WIRED_ARRAY_FORMAT_RECORD } from '../WiredArrayControls';
import { parseWiredData, WiredParam, WiredSelect, WiredTextarea } from '../WiredControls';

const MAX_LINES = 30;
const MAX_CHARACTERS = 1000;
const PLACEHOLDER_KEY = 'wiredfurni.params.variables.connect_text.caption';
const FALLBACK_PLACEHOLDER = '0=text0\n1=text1\n2=...';

interface TextConnectorData
{
    text?: string;
    fieldId?: number;
    variableDefinition?: WiredVariableDefinitionMetadata;
}

const sanitizeText = (value: string) =>
{
    const normalized = (value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').slice(0, MAX_CHARACTERS);
    const lines = normalized.split('\n');

    if(lines.length <= MAX_LINES) return normalized;

    return lines.slice(0, MAX_LINES).join('\n');
}

const getText = (value: string) =>
{
    const data = parseWiredData<TextConnectorData>(value || '');

    return data.text ?? value ?? '';
}

export const WiredExtraTextConnectorView: FC<{}> = props =>
{
    const [ text, setText ] = useState('');
    const [ fieldId, setFieldId ] = useState(0);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired() as any;
    const placeholder = useMemo(() =>
    {
        const localized = LocalizeText(PLACEHOLDER_KEY);

        return (localized && localized !== PLACEHOLDER_KEY) ? localized.replace(/\\n/g, '\n') : FALLBACK_PLACEHOLDER;
    }, []);

    useEffect(() =>
    {
        if(!trigger) return;

        const data = parseWiredData<TextConnectorData>(trigger.stringData || '');
        const definition = data.variableDefinition;
        const fallbackFieldId = definition?.fields?.[0]?.id ?? 0;

        setText(sanitizeText(data.text ?? getText(trigger.stringData || '')));
        setFieldId(definition?.fields?.some(field => field.id === data.fieldId) ? (data.fieldId ?? fallbackFieldId) : fallbackFieldId);
    }, [ trigger ]);

    const save = () =>
    {
        setIntParams([]);
        setStringParam(JSON.stringify({ text: sanitizeText(text), fieldId }));
    };

    const data = useMemo(() => parseWiredData<TextConnectorData>(trigger?.stringData || ''), [ trigger ]);
    const definition = data.variableDefinition;
    const showField = definition?.valueShape === 1 && definition.arrayFormat === WIRED_ARRAY_FORMAT_RECORD;

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            { showField &&
                <WiredParam title="Field">
                    <WiredSelect
                        value={ fieldId }
                        onChange={ event => setFieldId(Number(event.target.value)) }
                        options={ (definition?.fields ?? []).map(field => ({ value: field.id, label: field.name })) } />
                </WiredParam> }
            <WiredParam titleKey="wiredfurni.params.variables.connect_text.title" divider={ false }>
                <div className="nw-textarea-placeholder-wrap">
                    <WiredTextarea
                        className="nw-selector-names-input"
                        maxLength={ MAX_CHARACTERS }
                        value={ text }
                        onChange={ event => setText(sanitizeText(event.target.value)) } />
                    { !text &&
                        <div className="nw-textarea-placeholder">
                            { placeholder.split('\n').map((line, index) =>
                                <span key={ index }>{ line }{ index < placeholder.split('\n').length - 1 && <br /> }</span>) }
                        </div> }
                </div>
            </WiredParam>
        </WiredBaseView>
    );
}
