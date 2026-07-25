import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import {
    parseWiredData,
    WiredCheckbox,
    WiredControlText,
    WiredDisabled,
    WiredParam,
    WiredSelect,
    WiredVariableLists,
    WiredVariablePicker,
    wiredVariableIsSelectable,
    wiredVariablesForType,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER
} from '../WiredControls';
import {
    wiredVariableDefinition,
    WIRED_VALUE_SHAPE_ARRAY,
    WiredVariableDefinitionMetadata
} from '../WiredArrayControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const OPTION_CREATED = 1;
const OPTION_VALUE_CHANGED = 1 << 1;
const OPTION_INCREASED = 1 << 2;
const OPTION_DECREASED = 1 << 3;
const OPTION_UNCHANGED = 1 << 4;
const OPTION_DELETED = 1 << 5;
const DEFAULT_OPTIONS = OPTION_CREATED | OPTION_VALUE_CHANGED | OPTION_DELETED;
const METADATA_VERSION = 9;
const CHECKBOX_METADATA_VERSION = 8;

export const ARRAY_CHANGE_ANY = 0;
export const ARRAY_CHANGE_APPENDED = 1;
export const ARRAY_CHANGE_INSERTED = 2;
export const ARRAY_CHANGE_REMOVED = 3;
export const ARRAY_CHANGE_SLOT_CLEARED = 4;
export const ARRAY_CHANGE_REPLACED = 5;
export const ARRAY_CHANGE_MOVED = 6;
export const ARRAY_CHANGE_FIELD = 7;
export const ARRAY_CHANGE_LENGTH = 8;
export const ARRAY_CHANGE_CLEARED = 9;
export const ARRAY_CHANGE_CREATED = 10;
export const ARRAY_CHANGE_SWAPPED = 11;
export const ARRAY_CHANGE_SHUFFLED = 12;
export const ARRAY_FIELD_ANY = 0;

const ARRAY_OPTION_CREATED = 1;
const ARRAY_OPTION_CHANGED = 1 << 1;
const ARRAY_OPTION_APPENDED = 1 << 2;
const ARRAY_OPTION_INSERTED = 1 << 3;
const ARRAY_OPTION_REMOVED = 1 << 4;
const ARRAY_OPTION_INDEX_CLEARED = 1 << 5;
const ARRAY_OPTION_REPLACED = 1 << 6;
const ARRAY_OPTION_MOVED = 1 << 7;
const ARRAY_OPTION_SWAPPED = 1 << 8;
const ARRAY_OPTION_FIELD_CHANGED = 1 << 9;
const ARRAY_OPTION_LENGTH_CHANGED = 1 << 10;
const ARRAY_OPTION_CLEARED = 1 << 11;
const ARRAY_OPTION_SHUFFLED = 1 << 12;
const ARRAY_OPTION_ALL = (1 << 13) - 1;
const DEFAULT_ARRAY_OPTIONS = ARRAY_OPTION_CREATED | ARRAY_OPTION_CHANGED;
const VALID_VARIABLE_TYPES = [
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER,
    WIRED_VARIABLE_CONTEXT
];

interface VariableChangedData
{
    variableName?: string;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    subVariables?: Record<string, string[]>;
    variableDefinitions?: WiredVariableDefinitionMetadata[];
    variableType?: number;
    options?: number;
    arrayChangeFilter?: number;
    arrayOptions?: number;
    arrayFieldId?: number;
    metadataVersion?: number;
}

const normalizeVariableType = (value: number) =>
    VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;
export const normalizeArrayChangeFilter = (value: number) =>
    value >= ARRAY_CHANGE_ANY && value <= ARRAY_CHANGE_SHUFFLED ? value : ARRAY_CHANGE_ANY;
const arrayOptionsFromLegacyFilter = (filter: number) =>
{
    switch(normalizeArrayChangeFilter(filter))
    {
        case ARRAY_CHANGE_APPENDED: return ARRAY_OPTION_CHANGED | ARRAY_OPTION_APPENDED;
        case ARRAY_CHANGE_INSERTED: return ARRAY_OPTION_CHANGED | ARRAY_OPTION_INSERTED;
        case ARRAY_CHANGE_REMOVED: return ARRAY_OPTION_CHANGED | ARRAY_OPTION_REMOVED;
        case ARRAY_CHANGE_SLOT_CLEARED: return ARRAY_OPTION_CHANGED | ARRAY_OPTION_INDEX_CLEARED;
        case ARRAY_CHANGE_REPLACED: return ARRAY_OPTION_CHANGED | ARRAY_OPTION_REPLACED;
        case ARRAY_CHANGE_MOVED:
            return ARRAY_OPTION_CHANGED | ARRAY_OPTION_MOVED | ARRAY_OPTION_SWAPPED;
        case ARRAY_CHANGE_FIELD: return ARRAY_OPTION_CHANGED | ARRAY_OPTION_FIELD_CHANGED;
        case ARRAY_CHANGE_LENGTH: return ARRAY_OPTION_CHANGED | ARRAY_OPTION_LENGTH_CHANGED;
        case ARRAY_CHANGE_CLEARED: return ARRAY_OPTION_CHANGED | ARRAY_OPTION_CLEARED;
        case ARRAY_CHANGE_CREATED: return ARRAY_OPTION_CREATED;
        case ARRAY_CHANGE_SWAPPED: return ARRAY_OPTION_CHANGED | ARRAY_OPTION_SWAPPED;
        case ARRAY_CHANGE_SHUFFLED: return ARRAY_OPTION_CHANGED | ARRAY_OPTION_SHUFFLED;
        default: return ARRAY_OPTION_CHANGED;
    }
};
const normalizeArrayOptions = (value: number) =>
{
    const normalized = Number.isInteger(value) ? (value & ARRAY_OPTION_ALL) : 0;

    return normalized || DEFAULT_ARRAY_OPTIONS;
};
const hasOption = (options: number, option: number) => (options & option) !== 0;
const addUnique = (values: string[], value: string) =>
{
    if(value && !values.includes(value)) values.push(value);
};

export const WiredTriggerVariableChangedView: FC<{}> = () =>
{
    const [ variableType, setVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ variableName, setVariableName ] = useState('');
    const [ options, setOptions ] = useState(DEFAULT_OPTIONS);
    const [ arrayOptions, setArrayOptions ] = useState(DEFAULT_ARRAY_OPTIONS);
    const [ arrayFieldId, setArrayFieldId ] = useState(ARRAY_FIELD_ANY);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired() as any;

    const data = useMemo(
        () => parseWiredData<VariableChangedData>(trigger?.stringData ?? ''),
        [ trigger ]);
    const variableDefinitions = useMemo(() => data.variableDefinitions ?? [], [ data ]);
    const variables = useMemo<WiredVariableLists>(() =>
    {
        const result: Required<WiredVariableLists> = {
            global: [ ...(data.globalVariables ?? []) ],
            furni: [ ...(data.furniVariables ?? []) ],
            user: [ ...(data.userVariables ?? []) ],
            context: []
        };

        variableDefinitions
            .filter(definition => definition.valueShape === WIRED_VALUE_SHAPE_ARRAY)
            .forEach(definition =>
            {
                if(definition.variableType === WIRED_VARIABLE_FURNI) addUnique(result.furni, definition.name);
                else if(definition.variableType === WIRED_VARIABLE_USER) addUnique(result.user, definition.name);
                else if(definition.variableType === WIRED_VARIABLE_CONTEXT) addUnique(result.context, definition.name);
                else addUnique(result.global, definition.name);
            });
        Object.values(result).forEach(names => names.sort((first, second) =>
        {
            const firstInternal = first.startsWith('@');
            const secondInternal = second.startsWith('@');

            if(firstInternal !== secondInternal) return firstInternal ? 1 : -1;
            return first.localeCompare(second);
        }));
        return result;
    }, [ data, variableDefinitions ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const selectedDefinition = wiredVariableDefinition(
        variableDefinitions, variableType, variableName);
    const selectedArray = selectedDefinition?.valueShape === WIRED_VALUE_SHAPE_ARRAY
        ? selectedDefinition
        : undefined;
    const hasContextArrays = (variables.context ?? []).length > 0;

    const setOption = (option: number, checked: boolean) =>
    {
        setOptions(current => checked ? (current | option) : (current & ~option));
    };

    const setArrayOption = (option: number, checked: boolean) =>
    {
        setArrayOptions(current => checked ? (current | option) : (current & ~option));
        if(option === ARRAY_OPTION_FIELD_CHANGED && !checked) setArrayFieldId(ARRAY_FIELD_ANY);
    };

    const changeVariableType = (type: number) =>
    {
        setVariableType(normalizeVariableType(type));
        setVariableName('');
        setArrayOptions(DEFAULT_ARRAY_OPTIONS);
        setArrayFieldId(ARRAY_FIELD_ANY);
    };

    const changeVariableName = (name: string) =>
    {
        setVariableName(name);
        setArrayOptions(DEFAULT_ARRAY_OPTIONS);
        setArrayFieldId(ARRAY_FIELD_ANY);
    };

    const save = () =>
    {
        setStringParam(JSON.stringify({
            variableName,
            metadataVersion: METADATA_VERSION,
            arrayOptions,
            arrayFieldId
        }));
        setIntParams([ variableType, options, arrayOptions, arrayFieldId ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedVariableType = normalizeVariableType(
            intData[0] ?? data.variableType ?? WIRED_VARIABLE_GLOBAL);
        const savedVariables = wiredVariablesForType(savedVariableType, variables);
        const savedVariableName = data.variableName ?? '';
        const selectableName = wiredVariableIsSelectable(
            savedVariableName, savedVariables, subVariables)
            ? savedVariableName
            : '';
        const savedDefinition = wiredVariableDefinition(
            variableDefinitions, savedVariableType, selectableName);
        const validContextSelection = savedVariableType !== WIRED_VARIABLE_CONTEXT
            || savedDefinition?.valueShape === WIRED_VALUE_SHAPE_ARRAY;
        const savedArrayOptions = data.metadataVersion >= CHECKBOX_METADATA_VERSION
            ? normalizeArrayOptions(intData[2] ?? data.arrayOptions ?? DEFAULT_ARRAY_OPTIONS)
            : arrayOptionsFromLegacyFilter(
                intData[2] ?? data.arrayChangeFilter ?? ARRAY_CHANGE_ANY);
        const rawFieldId = intData[3] ?? data.arrayFieldId ?? ARRAY_FIELD_ANY;

        setVariableType(savedVariableType);
        setVariableName(validContextSelection ? selectableName : '');
        setOptions(intData[1] ?? data.options ?? DEFAULT_OPTIONS);
        setArrayOptions(savedArrayOptions);
        setArrayFieldId(Number.isInteger(rawFieldId) && rawFieldId >= 0
            ? rawFieldId
            : ARRAY_FIELD_ANY);
    }, [ trigger, data, variables, subVariables, variableDefinitions ]);

    const valueChanged = hasOption(options, OPTION_VALUE_CHANGED);
    const arrayChanged = hasOption(arrayOptions, ARRAY_OPTION_CHANGED);
    const arrayFieldChanged = hasOption(arrayOptions, ARRAY_OPTION_FIELD_CHANGED);
    const knownField = (selectedArray?.fields ?? []).some(field => field.id === arrayFieldId);
    const fieldOptions = [
        { value: ARRAY_FIELD_ANY, label: 'Any field' },
        ...(selectedArray?.fields ?? []).map(field => ({ value: field.id, label: field.name })),
        ...(arrayFieldId > ARRAY_FIELD_ANY && !knownField
            ? [ { value: arrayFieldId, label: `Unknown field (${ arrayFieldId })` } ]
            : [])
    ];

    return (
        <WiredTriggerBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            <WiredParam>
                <WiredVariablePicker
                    titleKey="wiredfurni.params.variables.variable_selection"
                    variableType={ variableType }
                    onVariableTypeChange={ changeVariableType }
                    variableName={ variableName }
                    onVariableNameChange={ changeVariableName }
                    variables={ variables }
                    subVariables={ subVariables }
                    hiddenTypes={ hasContextArrays ? [] : [ WIRED_VARIABLE_CONTEXT ] } />
            </WiredParam>
            { selectedArray ? <WiredParam titleKey="wiredfurni.params.variables.trigger_options" divider={ false }>
                <WiredCheckbox
                    checked={ hasOption(arrayOptions, ARRAY_OPTION_CREATED) }
                    onChange={ checked => setArrayOption(ARRAY_OPTION_CREATED, checked) }
                    label="Created" />
                <WiredCheckbox
                    checked={ arrayChanged }
                    onChange={ checked => setArrayOption(ARRAY_OPTION_CHANGED, checked) }
                    label="Array changed" />
                <WiredDisabled disabled={ !arrayChanged } className="nw-indent-1">
                    <WiredCheckbox
                        checked={ hasOption(arrayOptions, ARRAY_OPTION_APPENDED) }
                        onChange={ checked => setArrayOption(ARRAY_OPTION_APPENDED, checked) }
                        label="Appended" />
                    <WiredCheckbox
                        checked={ hasOption(arrayOptions, ARRAY_OPTION_INSERTED) }
                        onChange={ checked => setArrayOption(ARRAY_OPTION_INSERTED, checked) }
                        label="Inserted" />
                    <WiredCheckbox
                        checked={ hasOption(arrayOptions, ARRAY_OPTION_REMOVED) }
                        onChange={ checked => setArrayOption(ARRAY_OPTION_REMOVED, checked) }
                        label="Removed" />
                    <WiredCheckbox
                        checked={ hasOption(arrayOptions, ARRAY_OPTION_INDEX_CLEARED) }
                        onChange={ checked => setArrayOption(ARRAY_OPTION_INDEX_CLEARED, checked) }
                        label="Index cleared" />
                    <WiredCheckbox
                        checked={ hasOption(arrayOptions, ARRAY_OPTION_REPLACED) }
                        onChange={ checked => setArrayOption(ARRAY_OPTION_REPLACED, checked) }
                        label="Replaced" />
                    <WiredCheckbox
                        checked={ hasOption(arrayOptions, ARRAY_OPTION_MOVED) }
                        onChange={ checked => setArrayOption(ARRAY_OPTION_MOVED, checked) }
                        label="Moved" />
                    <WiredCheckbox
                        checked={ hasOption(arrayOptions, ARRAY_OPTION_SWAPPED) }
                        onChange={ checked => setArrayOption(ARRAY_OPTION_SWAPPED, checked) }
                        label="Swapped" />
                    <WiredCheckbox
                        checked={ hasOption(arrayOptions, ARRAY_OPTION_SHUFFLED) }
                        onChange={ checked => setArrayOption(ARRAY_OPTION_SHUFFLED, checked) }
                        label="Shuffled" />
                    <WiredCheckbox
                        checked={ arrayFieldChanged }
                        onChange={ checked => setArrayOption(ARRAY_OPTION_FIELD_CHANGED, checked) }
                        label="Field changed" />
                    { arrayFieldChanged &&
                        <Flex alignItems="center" gap={ 1 }>
                            <WiredControlText>Field</WiredControlText>
                            <WiredSelect
                                value={ arrayFieldId }
                                onChange={ event => setArrayFieldId(Number(event.target.value)) }
                                options={ fieldOptions } />
                        </Flex> }
                    <WiredCheckbox
                        checked={ hasOption(arrayOptions, ARRAY_OPTION_LENGTH_CHANGED) }
                        onChange={ checked => setArrayOption(ARRAY_OPTION_LENGTH_CHANGED, checked) }
                        label="Length changed" />
                    <WiredCheckbox
                        checked={ hasOption(arrayOptions, ARRAY_OPTION_CLEARED) }
                        onChange={ checked => setArrayOption(ARRAY_OPTION_CLEARED, checked) }
                        label="Array cleared" />
                </WiredDisabled>
            </WiredParam>
                : <WiredParam titleKey="wiredfurni.params.variables.trigger_options" divider={ false }>
                    <WiredCheckbox
                        checked={ hasOption(options, OPTION_CREATED) }
                        onChange={ checked => setOption(OPTION_CREATED, checked) }
                        label={ LocalizeText('wiredfurni.params.variables.trigger_options.0') } />
                    <WiredCheckbox
                        checked={ valueChanged }
                        onChange={ checked => setOption(OPTION_VALUE_CHANGED, checked) }
                        label={ LocalizeText('wiredfurni.params.variables.trigger_options.1') } />
                    <WiredDisabled disabled={ !valueChanged } className="nw-indent-1">
                        <WiredCheckbox
                            checked={ hasOption(options, OPTION_INCREASED) }
                            onChange={ checked => setOption(OPTION_INCREASED, checked) }
                            label={ LocalizeText('wiredfurni.params.variables.trigger_options.1.0') } />
                        <WiredCheckbox
                            checked={ hasOption(options, OPTION_DECREASED) }
                            onChange={ checked => setOption(OPTION_DECREASED, checked) }
                            label={ LocalizeText('wiredfurni.params.variables.trigger_options.1.1') } />
                        <WiredCheckbox
                            checked={ hasOption(options, OPTION_UNCHANGED) }
                            onChange={ checked => setOption(OPTION_UNCHANGED, checked) }
                            label={ LocalizeText('wiredfurni.params.variables.trigger_options.1.2') } />
                    </WiredDisabled>
                    <WiredCheckbox
                        checked={ hasOption(options, OPTION_DELETED) }
                        onChange={ checked => setOption(OPTION_DELETED, checked) }
                        label={ LocalizeText('wiredfurni.params.variables.trigger_options.2') } />
                </WiredParam> }
        </WiredTriggerBaseView>
    );
}
