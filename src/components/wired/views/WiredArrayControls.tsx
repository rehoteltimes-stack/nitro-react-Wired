import { FC, useEffect } from 'react';
import { Flex } from '../../../common';
import {
    normalizeWiredSource,
    WIRED_REFERENCE_FROM_VARIABLE,
    WIRED_REFERENCE_SET_VALUE,
    WIRED_VARIABLE_GLOBAL,
    WiredControlText,
    WiredParam,
    WiredSelect,
    WiredSubVariableLists,
    WiredValueOrVariable,
    WiredVariableLists,
    wiredVariableSourceOptions
} from './WiredControls';

export const WIRED_VALUE_SHAPE_ARRAY = 1;
export const WIRED_ARRAY_FORMAT_SIMPLE = 0;
export const WIRED_ARRAY_FORMAT_RECORD = 1;
export const WIRED_ARRAY_MODE_LIST = 0;
export const WIRED_ARRAY_MODE_SLOTS = 1;
export const WIRED_ARRAY_EXISTS = 0;
export const WIRED_ARRAY_ENTRY_EXISTS = 1;

export interface WiredArrayFieldMetadata
{
    id: number;
    name: string;
    order: number;
}

export interface WiredVariableDefinitionMetadata
{
    variableType: number;
    name: string;
    valueShape: number;
    arrayFormat: number;
    arrayMode: number;
    maxEntries: number;
    schemaVersion?: number;
    referenced?: boolean;
    writable?: boolean;
    fields: WiredArrayFieldMetadata[];
}

export interface WiredArrayAddressData
{
    indexMode: number;
    indexValue: number;
    indexVariableType: number;
    indexVariable: string;
    indexVariableSource: number;
    fieldId: number;
}

export const createWiredArrayAddress = (): WiredArrayAddressData => ({
    indexMode: WIRED_REFERENCE_SET_VALUE,
    indexValue: 0,
    indexVariableType: WIRED_VARIABLE_GLOBAL,
    indexVariable: '',
    indexVariableSource: WIRED_VARIABLE_GLOBAL,
    fieldId: 1
});

export const wiredVariableDefinition = (
    definitions: WiredVariableDefinitionMetadata[] = [],
    variableType: number,
    name: string) => definitions.find(definition =>
    definition.variableType === variableType && definition.name === name);

export const wiredArrayDefinition = (
    definitions: WiredVariableDefinitionMetadata[] = [],
    variableType: number,
    name: string) =>
{
    const definition = wiredVariableDefinition(definitions, variableType, name);

    return definition?.valueShape === WIRED_VALUE_SHAPE_ARRAY ? definition : undefined;
}

export const normalizeWiredArrayAddress = (
    value: Partial<WiredArrayAddressData> = {},
    definition?: WiredVariableDefinitionMetadata,
    includeClickedAvatarSource = false): WiredArrayAddressData =>
{
    const fallback = createWiredArrayAddress();
    const fields = definition?.fields ?? [];
    const fieldId = fields.some(field => field.id === value.fieldId)
        ? value.fieldId
        : (fields[0]?.id ?? fallback.fieldId);
    const indexVariableType = Number.isInteger(value.indexVariableType)
        ? value.indexVariableType
        : fallback.indexVariableType;
    const sourceOptions = wiredVariableSourceOptions(indexVariableType, includeClickedAvatarSource);

    return {
        indexMode: value.indexMode === WIRED_REFERENCE_FROM_VARIABLE
            ? WIRED_REFERENCE_FROM_VARIABLE
            : WIRED_REFERENCE_SET_VALUE,
        indexValue: Number.isInteger(value.indexValue) ? value.indexValue : fallback.indexValue,
        indexVariableType,
        indexVariable: typeof value.indexVariable === 'string' ? value.indexVariable : '',
        indexVariableSource: normalizeWiredSource(
            Number.isInteger(value.indexVariableSource) ? value.indexVariableSource : sourceOptions[0],
            sourceOptions),
        fieldId
    };
}

export const wiredArrayAddressIsValid = (
    address: WiredArrayAddressData,
    definition?: WiredVariableDefinitionMetadata,
    requireField = true) =>
{
    if(!definition || definition.valueShape !== WIRED_VALUE_SHAPE_ARRAY) return true;
    if(address.indexMode !== WIRED_REFERENCE_SET_VALUE && address.indexMode !== WIRED_REFERENCE_FROM_VARIABLE) return false;
    if(address.indexMode === WIRED_REFERENCE_SET_VALUE &&
        (!Number.isInteger(address.indexValue) || address.indexValue < 0 || address.indexValue >= definition.maxEntries)) return false;
    if(address.indexMode === WIRED_REFERENCE_FROM_VARIABLE && !address.indexVariable) return false;

    return !requireField || definition.fields.some(field => field.id === address.fieldId);
}

export const wiredScalarVariableLists = (
    variables: WiredVariableLists,
    definitions: WiredVariableDefinitionMetadata[] = []): WiredVariableLists =>
{
    const filter = (names: string[] = [], variableType: number) => names.filter(name =>
    {
        const definition = wiredVariableDefinition(definitions, variableType, name);
        return !definition || definition.valueShape !== WIRED_VALUE_SHAPE_ARRAY;
    });

    return {
        furni: filter(variables.furni, 0),
        global: filter(variables.global, 1),
        user: filter(variables.user, 2),
        context: filter(variables.context, 3)
    };
}

interface WiredArrayAddressEditorProps
{
    radioName: string;
    title?: string;
    definition?: WiredVariableDefinitionMetadata;
    value: WiredArrayAddressData;
    onChange: (value: WiredArrayAddressData) => void;
    variables: WiredVariableLists;
    subVariables?: WiredSubVariableLists;
    includeClickedAvatarSource?: boolean;
    divider?: boolean;
    showField?: boolean;
}

export const WiredArrayAddressEditor: FC<WiredArrayAddressEditorProps> = props =>
{
    const {
        radioName,
        title = 'Index',
        definition,
        value,
        onChange,
        variables,
        subVariables = {},
        includeClickedAvatarSource = false,
        divider = true,
        showField = true
    } = props;

    useEffect(() =>
    {
        if(!definition) return;
        const normalized = normalizeWiredArrayAddress(value, definition, includeClickedAvatarSource);
        if(JSON.stringify(normalized) !== JSON.stringify(value)) onChange(normalized);
    }, [ definition, value, onChange, includeClickedAvatarSource ]);

    if(!definition) return null;

    const maximum = Math.max(0, definition.maxEntries - 1);
    const isRecord = definition.arrayFormat === WIRED_ARRAY_FORMAT_RECORD;

    return (
        <WiredParam title={ title } divider={ divider }>
            <WiredValueOrVariable
                radioName={ radioName }
                mode={ value.indexMode }
                onModeChange={ indexMode => onChange({ ...value, indexMode }) }
                value={ String(value.indexValue) }
                onValueChange={ indexValue => onChange({ ...value, indexValue: Number(indexValue || 0) }) }
                min={ 0 }
                max={ maximum }
                variableType={ value.indexVariableType }
                atomicVariableTypeChange
                onVariableTypeChange={ indexVariableType => onChange({
                    ...value,
                    indexVariableType,
                    indexVariable: '',
                    indexVariableSource: wiredVariableSourceOptions(indexVariableType, includeClickedAvatarSource)[0]
                }) }
                variableName={ value.indexVariable }
                onVariableNameChange={ indexVariable => onChange({ ...value, indexVariable }) }
                variables={ variables }
                subVariables={ subVariables }
                variableSource={ value.indexVariableSource }
                onVariableSourceChange={ indexVariableSource => onChange({ ...value, indexVariableSource }) }
                includeClickedAvatarSource={ includeClickedAvatarSource } />
            { showField && isRecord &&
                <Flex alignItems="center" gap={ 1 }>
                    <WiredControlText>Field</WiredControlText>
                    <WiredSelect
                        value={ value.fieldId }
                        onChange={ event => onChange({ ...value, fieldId: Number(event.target.value) }) }
                        options={ definition.fields.map(field => ({ value: field.id, label: field.name })) } />
                </Flex> }
        </WiredParam>
    );
}
