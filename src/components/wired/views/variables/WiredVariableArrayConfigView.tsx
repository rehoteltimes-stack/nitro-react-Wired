import { VariableDefinition } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { WiredButton, WiredCheckbox, WiredControlSection, WiredControlText, WiredDivider, WiredRadio, WiredTextInput } from '../WiredControls';

const VALUE_SHAPE_ARRAY = 1;
const ARRAY_FORMAT_RECORD = 1;
const ARRAY_MODE_SLOTS = 1;
const MAX_FIELDS = 8;
const RESERVED_FIELD_NAMES = new Set([ 'found', 'index', 'length', 'occupied' ]);

export interface WiredArrayEditorField
{
    id: number;
    name: string;
    order: number;
}

const normalizeFieldName = (input: string): string =>
{
    let result = '';
    for(const character of input.toLowerCase())
    {
        if(/[a-z0-9_]/.test(character)) result += character;
        else if(/\s/.test(character)) result += '_';
    }
    return result;
}

export const useWiredVariableArrayConfig = (variable: VariableDefinition) =>
{
    const [ enabled, setEnabled ] = useState(false);
    const [ format, setFormat ] = useState(0);
    const [ mode, setMode ] = useState(0);
    const [ maxEntries, setMaxEntries ] = useState(64);
    const [ nextFieldId, setNextFieldId ] = useState(2);
    const [ fields, setFields ] = useState<WiredArrayEditorField[]>([]);

    useEffect(() =>
    {
        if(!variable) return;

        setEnabled(variable.valueShape === VALUE_SHAPE_ARRAY);
        setFormat(variable.arrayFormat ?? 0);
        setMode(variable.arrayMode ?? 0);
        setMaxEntries(variable.maxEntries > 0 ? variable.maxEntries : 64);
        setNextFieldId(variable.nextFieldId > 1 ? variable.nextFieldId : 2);
        setFields((variable.arrayFormat === ARRAY_FORMAT_RECORD ? variable.fields ?? [] : [])
            .slice()
            .sort((first, second) => first.order - second.order)
            .map((field, order) => ({ id: field.id, name: field.name, order })));
    }, [ variable ]);

    const serverMaximum = Math.max(1, variable?.serverMaxEntries ?? 2048);
    const serverPopulatedCellMaximum = Math.max(1, variable?.serverMaxPopulatedCells ?? 4096);
    const populatedEntryMaximum = Math.max(1, Math.min(
        serverMaximum,
        Math.floor(serverPopulatedCellMaximum / (format === ARRAY_FORMAT_RECORD ? Math.max(1, fields.length) : 1))));
    const errors = useMemo(() =>
    {
        if(!enabled) return [] as string[];

        const validationErrors: string[] = [];
        if(!Number.isInteger(maxEntries) || maxEntries < 1 || maxEntries > serverMaximum)
        {
            validationErrors.push(`Maximum entries must be between 1 and ${ serverMaximum }.`);
        }

        if(format === ARRAY_FORMAT_RECORD)
        {
            if(fields.length < 1 || fields.length > MAX_FIELDS)
            {
                validationErrors.push(`Record arrays require 1-${ MAX_FIELDS } fields.`);
            }

            const names = new Set<string>();
            fields.forEach(field =>
            {
                if(!/^[a-z0-9_]{1,40}$/.test(field.name))
                {
                    validationErrors.push('Field names must be 1-40 characters and use letters, numbers, or underscores.');
                }
                else if(RESERVED_FIELD_NAMES.has(field.name))
                {
                    validationErrors.push(`'${ field.name }' is reserved and cannot be used as a field name.`);
                }
                else if(names.has(field.name))
                {
                    validationErrors.push('Field names must be unique within this array.');
                }
                names.add(field.name);
            });
        }

        return Array.from(new Set(validationErrors));
    }, [ enabled, fields, format, maxEntries, serverMaximum ]);

    const changeEnabled = (value: boolean) =>
    {
        if(value && format === ARRAY_FORMAT_RECORD && fields.length === 0)
        {
            setFields([ { id: nextFieldId, name: '', order: 0 } ]);
            setNextFieldId(current => current + 1);
        }
        setEnabled(value);
    }

    const changeFormat = (value: number) =>
    {
        if(value === ARRAY_FORMAT_RECORD && fields.length === 0)
        {
            setFields([ { id: nextFieldId, name: '', order: 0 } ]);
            setNextFieldId(current => current + 1);
        }
        setFormat(value);
    }

    const addField = () =>
    {
        if(fields.length >= MAX_FIELDS) return;
        setFields(current => [ ...current, { id: nextFieldId, name: '', order: current.length } ]);
        setNextFieldId(current => current + 1);
    }

    const renameField = (id: number, name: string) =>
    {
        setFields(current => current.map(field => field.id === id
            ? { ...field, name: normalizeFieldName(name) }
            : field));
    }

    const removeField = (id: number) =>
    {
        setFields(current => current.filter(field => field.id !== id).map((field, order) => ({ ...field, order })));
    }

    const hasDestructiveChange = () =>
    {
        if(!variable) return false;
        const wasEnabled = variable.valueShape === VALUE_SHAPE_ARRAY;
        if(wasEnabled !== enabled) return true;
        if(!enabled) return false;
        if(variable.arrayFormat !== format || variable.arrayMode !== mode || maxEntries < variable.maxEntries) return true;

        const currentIds = new Set(fields.map(field => field.id));
        return (variable.fields ?? []).some(field => !currentIds.has(field.id));
    }

    const buildSaveValue = (variableName: string): string | null =>
    {
        if(errors.length > 0) return null;

        const wasEnabled = variable?.valueShape === VALUE_SHAPE_ARRAY;
        if(!enabled && !wasEnabled) return variableName;

        return JSON.stringify({
            name: variableName,
            valueShape: enabled ? 'array' : 'single',
            arrayFormat: format === ARRAY_FORMAT_RECORD ? 'record' : 'simple',
            arrayMode: mode === ARRAY_MODE_SLOTS ? 'slots' : 'list',
            maxEntries,
            nextFieldId,
            fields: format === ARRAY_FORMAT_RECORD ? fields.map((field, order) => ({ ...field, order })) : [],
            schemaVersion: enabled ? 1 : 0,
            confirmDestructive: hasDestructiveChange()
        });
    }

    return {
        enabled,
        format,
        mode,
        maxEntries,
        fields,
        errors,
        serverMaximum,
        serverPopulatedCellMaximum,
        populatedEntryMaximum,
        changeEnabled,
        changeFormat,
        setMode,
        setMaxEntries,
        addField,
        renameField,
        removeField,
        buildSaveValue,
        isValid: () => errors.length === 0
    };
}

export const WiredVariableArrayConfigView: FC<{ editor: ReturnType<typeof useWiredVariableArrayConfig> }> = ({ editor }) =>
{
    return (
        <>
            <WiredDivider />
            <WiredControlSection title="Array value shape">
                <WiredCheckbox
                    checked={ editor.enabled }
                    onChange={ editor.changeEnabled }
                    label="Enable Array" />
            </WiredControlSection>
            { editor.enabled && <>
                <WiredDivider />
                <WiredControlSection title="Array format">
                    <WiredRadio name="arrayFormat" checked={ editor.format === 0 } onChange={ () => editor.changeFormat(0) } label="Simple Array" />
                    <WiredRadio name="arrayFormat" checked={ editor.format === ARRAY_FORMAT_RECORD } onChange={ () => editor.changeFormat(ARRAY_FORMAT_RECORD) } label="Record Array" />
                </WiredControlSection>
                <WiredDivider />
                <WiredControlSection title="Array mode">
                    <WiredRadio name="arrayMode" checked={ editor.mode === 0 } onChange={ () => editor.setMode(0) } label="List" />
                    <WiredRadio name="arrayMode" checked={ editor.mode === ARRAY_MODE_SLOTS } onChange={ () => editor.setMode(ARRAY_MODE_SLOTS) } label="Slots" />
                </WiredControlSection>
                <WiredDivider />
                <WiredControlSection title="Maximum entries">
                    <WiredTextInput
                        type="number"
                        min={ 1 }
                        max={ editor.serverMaximum }
                        value={ editor.maxEntries }
                        onChange={ event => editor.setMaxEntries(Number(event.target.value)) } />
                    <WiredControlText>
                        { `Each owner can populate up to ${ editor.populatedEntryMaximum.toLocaleString() } entries with this field count (${ editor.serverPopulatedCellMaximum.toLocaleString() } populated cells).${ editor.mode === ARRAY_MODE_SLOTS ? ' Slots may still address every configured index.' : '' }` }
                    </WiredControlText>
                </WiredControlSection>
                { editor.format === ARRAY_FORMAT_RECORD && <>
                    <WiredDivider />
                    <WiredControlSection title={ `Record fields (${ editor.fields.length } / ${ MAX_FIELDS })` }>
                        { editor.fields.map(field =>
                            <div key={ field.id } style={ { display: 'flex', gap: 4, marginBottom: 4 } }>
                                <WiredTextInput
                                    type="text"
                                    value={ field.name }
                                    maxLength={ 40 }
                                    onChange={ event => editor.renameField(field.id, event.target.value) } />
                                <WiredButton disabled={ editor.fields.length <= 1 } onClick={ () => editor.removeField(field.id) }>Remove</WiredButton>
                            </div>) }
                        <WiredButton disabled={ editor.fields.length >= MAX_FIELDS } onClick={ editor.addField }>Add field</WiredButton>
                    </WiredControlSection>
                </> }
                { editor.errors.length > 0 && <>
                    <WiredDivider />
                    <WiredControlSection title="Validation">
                        { editor.errors.map(error => <div key={ error } style={ { color: '#b00020' } }><WiredControlText>{ error }</WiredControlText></div>) }
                    </WiredControlSection>
                </> }
            </> }
        </>
    );
}
