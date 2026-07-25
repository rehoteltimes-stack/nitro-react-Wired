import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import {
    createWiredArrayAddress,
    normalizeWiredArrayAddress,
    wiredArrayAddressIsValid,
    wiredArrayDefinition,
    WIRED_ARRAY_MODE_LIST,
    WIRED_VALUE_SHAPE_ARRAY,
    WiredArrayAddressData,
    WiredArrayAddressEditor,
    wiredScalarVariableLists,
    WiredVariableDefinitionMetadata
} from '../WiredArrayControls';
import {
    normalizeWiredSource,
    parseWiredData,
    wiredClickedAvatarSourceAvailableForTrigger,
    wiredSignedLongIsValid,
    wiredVariableIsSelectable,
    wiredVariablesForType,
    wiredVariableSourceOptions,
    WIRED_REFERENCE_FROM_VARIABLE,
    WIRED_REFERENCE_SET_VALUE,
    WIRED_SOURCE_SELECTED,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER,
    WiredButton,
    WiredParam,
    WiredSelect,
    WiredValueOrVariable,
    WiredVariableLists,
    WiredVariablePicker
} from '../WiredControls';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import { WiredEffectBaseView } from './WiredEffectBaseView';

const OP_APPEND = 0;
const OP_INSERT = 1;
const OP_SET_ENTRY = 2;
const OP_REMOVE = 3;
const OP_REMOVE_FIRST = 4;
const OP_REMOVE_LAST = 5;
const OP_SWAP = 6;
const OP_MOVE = 7;
const OP_CLEAR = 8;
const OP_CLEAR_SLOT = 9;
const OP_SHUFFLE = 10;

const LIST_OPERATIONS = [
    OP_APPEND,
    OP_INSERT,
    OP_SET_ENTRY,
    OP_REMOVE,
    OP_REMOVE_FIRST,
    OP_REMOVE_LAST,
    OP_SWAP,
    OP_MOVE,
    OP_CLEAR,
    OP_SHUFFLE
];
const SLOTS_OPERATIONS = [ OP_SET_ENTRY, OP_CLEAR_SLOT, OP_SWAP, OP_CLEAR ];
const ENTRY_VALUE_OPERATIONS = [ OP_APPEND, OP_INSERT, OP_SET_ENTRY ];
const FIRST_INDEX_OPERATIONS = [ OP_INSERT, OP_SET_ENTRY, OP_REMOVE, OP_CLEAR_SLOT, OP_SWAP, OP_MOVE ];
const SECOND_INDEX_OPERATIONS = [ OP_SWAP, OP_MOVE ];
const VALID_VARIABLE_TYPES = [
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER,
    WIRED_VARIABLE_CONTEXT
];

const OPERATION_LABELS: Record<number, string> = {
    [OP_APPEND]: 'Append',
    [OP_INSERT]: 'Insert',
    [OP_SET_ENTRY]: 'Replace',
    [OP_REMOVE]: 'Remove',
    [OP_REMOVE_FIRST]: 'Remove First',
    [OP_REMOVE_LAST]: 'Remove Last',
    [OP_SWAP]: 'Swap',
    [OP_MOVE]: 'Move',
    [OP_CLEAR]: 'Clear',
    [OP_CLEAR_SLOT]: 'Remove',
    [OP_SHUFFLE]: 'Shuffle'
};

interface WiredArrayFieldInputData
{
    mode: number;
    value: string;
    variableType: number;
    variable: string;
    variableSource: number;
}

interface ModifyArrayData
{
    variableName?: string;
    variableType?: number;
    operation?: number;
    ownerSource?: number;
    firstIndex?: Partial<WiredArrayAddressData>;
    secondIndex?: Partial<WiredArrayAddressData>;
    fieldInputs?: Record<number, Partial<WiredArrayFieldInputData>>;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    subVariables?: Record<string, string[]>;
    variableDefinitions?: WiredVariableDefinitionMetadata[];
}

const normalizeVariableType = (value: number) =>
    VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;

const createFieldInput = (): WiredArrayFieldInputData => ({
    mode: WIRED_REFERENCE_SET_VALUE,
    value: '0',
    variableType: WIRED_VARIABLE_GLOBAL,
    variable: '',
    variableSource: WIRED_VARIABLE_GLOBAL
});

const sourceLabelPrefix = (variableType: number) => variableType === WIRED_VARIABLE_FURNI
    ? 'wiredfurni.params.sources.furni'
    : (variableType === WIRED_VARIABLE_USER
        ? 'wiredfurni.params.sources.users'
        : 'wiredfurni.params.sources');

export const WiredEffectModifyArrayView: FC<{}> = props =>
{
    const [ variableType, setVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ variableName, setVariableName ] = useState('');
    const [ operation, setOperation ] = useState(OP_APPEND);
    const [ ownerSource, setOwnerSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ firstIndex, setFirstIndex ] = useState<WiredArrayAddressData>(createWiredArrayAddress);
    const [ secondIndex, setSecondIndex ] = useState<WiredArrayAddressData>(createWiredArrayAddress);
    const [ fieldInputs, setFieldInputs ] = useState<Record<number, WiredArrayFieldInputData>>({});
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<ModifyArrayData>(trigger?.stringData ?? ''), [ trigger ]);
    const variableDefinitions = useMemo(() => data.variableDefinitions ?? [], [ data ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const includeClickedAvatarSource = wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const getSourceOptions = useCallback((type: number) =>
        wiredVariableSourceOptions(type, includeClickedAvatarSource),
    [ includeClickedAvatarSource ]);

    const scalarVariables = useMemo<WiredVariableLists>(() => wiredScalarVariableLists({
        global: data.globalVariables ?? [],
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? [],
        context: data.contextVariables ?? []
    }, variableDefinitions), [ data, variableDefinitions ]);
    const arrayVariables = useMemo<WiredVariableLists>(() =>
    {
        const result: Required<WiredVariableLists> = {
            global: [],
            furni: [],
            user: [],
            context: []
        };

        variableDefinitions
            .filter(definition =>
                definition.valueShape === WIRED_VALUE_SHAPE_ARRAY &&
                definition.writable !== false)
            .forEach(definition =>
            {
                if(definition.variableType === WIRED_VARIABLE_FURNI) result.furni.push(definition.name);
                else if(definition.variableType === WIRED_VARIABLE_USER) result.user.push(definition.name);
                else if(definition.variableType === WIRED_VARIABLE_CONTEXT) result.context.push(definition.name);
                else result.global.push(definition.name);
            });

        Object.values(result).forEach(names => names.sort());
        return result;
    }, [ variableDefinitions ]);

    const arrayDefinition = wiredArrayDefinition(variableDefinitions, variableType, variableName);
    const operationOptions = arrayDefinition?.arrayMode === WIRED_ARRAY_MODE_LIST
        ? LIST_OPERATIONS
        : SLOTS_OPERATIONS;
    const needsEntryValues = ENTRY_VALUE_OPERATIONS.includes(operation);
    const needsFirstIndex = FIRST_INDEX_OPERATIONS.includes(operation);
    const needsSecondIndex = SECOND_INDEX_OPERATIONS.includes(operation);
    const selectedEntryFields = arrayDefinition?.fields.filter(field => !!fieldInputs[field.id]) ?? [];
    const availableEntryFields = arrayDefinition?.fields.filter(field => !fieldInputs[field.id]) ?? [];
    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const selectedSourceLabel = `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`;
    const commonOptionLabels = {
        [WIRED_SOURCE_SELECTED]: selectedSourceLabel,
        [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
        [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
    };
    const usesOwnerSource = variableType === WIRED_VARIABLE_FURNI ||
        variableType === WIRED_VARIABLE_USER;
    const sourceSelectors: WiredSourceSelectorConfig[] = [];

    if(usesOwnerSource)
    {
        sourceSelectors.push({
            value: ownerSource,
            onChange: setOwnerSource,
            options: getSourceOptions(variableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_destination',
            labelPrefix: sourceLabelPrefix(variableType),
            optionLabels: commonOptionLabels
        });
    }

    if(needsFirstIndex && firstIndex.indexMode === WIRED_REFERENCE_FROM_VARIABLE)
    {
        sourceSelectors.push({
            value: firstIndex.indexVariableSource,
            onChange: indexVariableSource => setFirstIndex(value => ({ ...value, indexVariableSource })),
            options: getSourceOptions(firstIndex.indexVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: sourceLabelPrefix(firstIndex.indexVariableType),
            optionLabels: commonOptionLabels,
            titleAccessory: needsSecondIndex ? 'Index 1' : 'Index'
        });
    }

    if(needsSecondIndex && secondIndex.indexMode === WIRED_REFERENCE_FROM_VARIABLE)
    {
        sourceSelectors.push({
            value: secondIndex.indexVariableSource,
            onChange: indexVariableSource => setSecondIndex(value => ({ ...value, indexVariableSource })),
            options: getSourceOptions(secondIndex.indexVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: sourceLabelPrefix(secondIndex.indexVariableType),
            optionLabels: commonOptionLabels,
            titleAccessory: 'Index 2'
        });
    }

    if(needsEntryValues)
    {
        arrayDefinition?.fields.forEach(field =>
        {
            const input = fieldInputs[field.id];

            if(input?.mode !== WIRED_REFERENCE_FROM_VARIABLE) return;

            sourceSelectors.push({
                value: input.variableSource,
                onChange: variableSource => setFieldInputs(current => ({
                    ...current,
                    [field.id]: { ...current[field.id], variableSource }
                })),
                options: getSourceOptions(input.variableType),
                titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
                labelPrefix: sourceLabelPrefix(input.variableType),
                optionLabels: commonOptionLabels,
                titleAccessory: field.name
            });
        });
    }

    const needsFurniSelection = variableType === WIRED_VARIABLE_FURNI ||
        (needsFirstIndex && firstIndex.indexMode === WIRED_REFERENCE_FROM_VARIABLE &&
            firstIndex.indexVariableType === WIRED_VARIABLE_FURNI) ||
        (needsSecondIndex && secondIndex.indexMode === WIRED_REFERENCE_FROM_VARIABLE &&
            secondIndex.indexVariableType === WIRED_VARIABLE_FURNI) ||
        (needsEntryValues && Object.values(fieldInputs).some(input =>
            input.mode === WIRED_REFERENCE_FROM_VARIABLE &&
            input.variableType === WIRED_VARIABLE_FURNI));

    const normalizeInputs = useCallback((
        saved: Record<number, Partial<WiredArrayFieldInputData>> = {},
        definition?: WiredVariableDefinitionMetadata) =>
    {
        const normalized: Record<number, WiredArrayFieldInputData> = {};

        definition?.fields.forEach(field =>
        {
            const raw = saved[field.id];

            if(!raw) return;

            const inputType = normalizeVariableType(raw.variableType ?? WIRED_VARIABLE_GLOBAL);
            const variableOptions = wiredVariablesForType(inputType, scalarVariables);
            const variable = typeof raw.variable === 'string' &&
                wiredVariableIsSelectable(raw.variable, variableOptions, subVariables)
                ? raw.variable
                : '';

            normalized[field.id] = {
                mode: raw.mode === WIRED_REFERENCE_FROM_VARIABLE
                    ? WIRED_REFERENCE_FROM_VARIABLE
                    : WIRED_REFERENCE_SET_VALUE,
                value: String(raw.value ?? 0),
                variableType: inputType,
                variable,
                variableSource: normalizeWiredSource(
                    raw.variableSource ?? getSourceOptions(inputType)[0],
                    getSourceOptions(inputType))
            };
        });

        return normalized;
    }, [ scalarVariables, subVariables, getSourceOptions ]);

    const setNormalizedVariableType = (nextValue: number) =>
    {
        const nextType = normalizeVariableType(nextValue);

        setVariableType(nextType);
        setVariableName('');
        setOperation(nextType === variableType ? operation : OP_APPEND);
        setOwnerSource(getSourceOptions(nextType)[0]);
        setFieldInputs({});
    };

    const setNormalizedVariableName = (nextName: string) =>
    {
        const definition = wiredArrayDefinition(variableDefinitions, variableType, nextName);
        const operations = definition?.arrayMode === WIRED_ARRAY_MODE_LIST
            ? LIST_OPERATIONS
            : SLOTS_OPERATIONS;

        setVariableName(nextName);
        setOperation(operations[0]);
        setFirstIndex(normalizeWiredArrayAddress({}, definition, includeClickedAvatarSource));
        setSecondIndex(normalizeWiredArrayAddress({}, definition, includeClickedAvatarSource));
        setFieldInputs(definition?.fields.length === 1
            ? { [definition.fields[0].id]: createFieldInput() }
            : {});
    };

    const updateFieldInput = (fieldId: number, value: WiredArrayFieldInputData) =>
        setFieldInputs(current => ({ ...current, [fieldId]: value }));

    const addFieldInput = (fieldId: number) =>
    {
        if(!arrayDefinition?.fields.some(field => field.id === fieldId)) return;

        setFieldInputs(current => current[fieldId]
            ? current
            : { ...current, [fieldId]: createFieldInput() });
    };

    const removeFieldInput = (fieldId: number) =>
        setFieldInputs(current =>
        {
            const next = { ...current };

            delete next[fieldId];

            return next;
        });

    const save = () =>
    {
        setStringParam(JSON.stringify({
            variableName,
            firstIndex,
            secondIndex,
            fieldInputs
        }));
        setIntParams([ variableType, operation, ownerSource ]);
    };

    const validate = () =>
    {
        if(!arrayDefinition || !operationOptions.includes(operation)) return false;
        if(needsFirstIndex && !wiredArrayAddressIsValid(firstIndex, arrayDefinition, false)) return false;
        if(needsSecondIndex && !wiredArrayAddressIsValid(secondIndex, arrayDefinition, false)) return false;
        if(!needsEntryValues) return true;

        return Object.entries(fieldInputs).every(([ fieldId, input ]) =>
        {
            if(!arrayDefinition.fields.some(field => field.id === Number(fieldId))) return false;
            if(input.mode === WIRED_REFERENCE_SET_VALUE) return wiredSignedLongIsValid(input.value);
            if(input.mode !== WIRED_REFERENCE_FROM_VARIABLE) return false;

            return wiredVariableIsSelectable(
                input.variable,
                wiredVariablesForType(input.variableType, scalarVariables),
                subVariables);
        });
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedType = normalizeVariableType(
            intData[0] ?? data.variableType ?? WIRED_VARIABLE_GLOBAL);
        const savedName = data.variableName ?? '';
        const savedDefinition = wiredArrayDefinition(
            variableDefinitions, savedType, savedName);
        const savedOperations = savedDefinition?.arrayMode === WIRED_ARRAY_MODE_LIST
            ? LIST_OPERATIONS
            : SLOTS_OPERATIONS;
        const savedOperation = Number(
            intData[1] ?? data.operation ?? savedOperations[0]);

        setVariableType(savedType);
        setVariableName(savedDefinition ? savedName : '');
        setOperation(savedOperations.includes(savedOperation)
            ? savedOperation
            : savedOperations[0]);
        setOwnerSource(normalizeWiredSource(
            intData[2] ?? data.ownerSource ?? getSourceOptions(savedType)[0],
            getSourceOptions(savedType)));
        setFirstIndex(normalizeWiredArrayAddress(
            data.firstIndex, savedDefinition, includeClickedAvatarSource));
        setSecondIndex(normalizeWiredArrayAddress(
            data.secondIndex, savedDefinition, includeClickedAvatarSource));
        const savedInputs = normalizeInputs(data.fieldInputs ?? {}, savedDefinition);

        setFieldInputs(savedDefinition?.fields.length === 1 &&
            !savedInputs[savedDefinition.fields[0].id]
            ? { [savedDefinition.fields[0].id]: createFieldInput() }
            : savedInputs);
    }, [ trigger, data, variableDefinitions, scalarVariables, includeClickedAvatarSource, getSourceOptions, normalizeInputs ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ needsFurniSelection
                ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT
                : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            validate={ validate }
            hideFurniSelector={ needsFurniSelection }
            sourceSelectors={ sourceSelectors }
            alwaysExpandedSources={ sourceSelectors.length > 0 }>
            <WiredParam>
                <WiredVariablePicker
                    title="Array variable"
                    variableType={ variableType }
                    onVariableTypeChange={ setNormalizedVariableType }
                    variableName={ variableName }
                    onVariableNameChange={ setNormalizedVariableName }
                    variables={ arrayVariables } />
            </WiredParam>
            <WiredParam title="Operation">
                <WiredSelect
                    value={ operation }
                    onChange={ event => setOperation(Number(event.target.value)) }
                    options={ operationOptions.map(value => ({
                        value,
                        label: OPERATION_LABELS[value]
                    })) } />
            </WiredParam>
            { needsFirstIndex &&
                <WiredArrayAddressEditor
                    radioName="modifyArrayFirstIndex"
                    title={ operation === OP_MOVE ? 'Source index' : (needsSecondIndex ? 'Index 1' : 'Index') }
                    definition={ arrayDefinition }
                    value={ firstIndex }
                    onChange={ setFirstIndex }
                    variables={ scalarVariables }
                    subVariables={ subVariables }
                    includeClickedAvatarSource={ includeClickedAvatarSource }
                    showField={ false } /> }
            { needsSecondIndex &&
                <WiredArrayAddressEditor
                    radioName="modifyArraySecondIndex"
                    title={ operation === OP_MOVE ? 'Destination index' : 'Index 2' }
                    definition={ arrayDefinition }
                    value={ secondIndex }
                    onChange={ setSecondIndex }
                    variables={ scalarVariables }
                    subVariables={ subVariables }
                    includeClickedAvatarSource={ includeClickedAvatarSource }
                    showField={ false } /> }
            { needsEntryValues && arrayDefinition && arrayDefinition.fields.length > 1 &&
                <WiredParam title="Add field" divider={ selectedEntryFields.length > 0 }>
                    <WiredSelect
                        value=""
                        disabled={ availableEntryFields.length === 0 }
                        onChange={ event => addFieldInput(Number(event.target.value)) }
                        options={ [
                            {
                                value: '',
                                label: availableEntryFields.length > 0
                                    ? 'Select a field'
                                    : 'All fields added',
                                disabled: true
                            },
                            ...availableEntryFields.map(field => ({
                                value: field.id,
                                label: field.name
                            }))
                        ] } />
                </WiredParam> }
            { needsEntryValues && selectedEntryFields.map((field, index) =>
            {
                const input = fieldInputs[field.id] ?? createFieldInput();

                return (
                    <WiredParam
                        key={ field.id }
                        title={ arrayDefinition.fields.length === 1 ? 'Value' : field.name }
                        divider={ index < selectedEntryFields.length - 1 }>
                        <WiredValueOrVariable
                            radioName={ `modifyArrayField${ field.id }` }
                            mode={ input.mode }
                            onModeChange={ mode => updateFieldInput(field.id, { ...input, mode }) }
                            value={ input.value }
                            onValueChange={ value => updateFieldInput(field.id, { ...input, value }) }
                            signedLong
                            variableType={ input.variableType }
                            atomicVariableTypeChange
                            onVariableTypeChange={ nextType => updateFieldInput(field.id, {
                                ...input,
                                variableType: normalizeVariableType(nextType),
                                variable: '',
                                variableSource: getSourceOptions(nextType)[0]
                            }) }
                            variableName={ input.variable }
                            onVariableNameChange={ variable => updateFieldInput(field.id, { ...input, variable }) }
                            variables={ scalarVariables }
                            subVariables={ subVariables }
                            variableSource={ input.variableSource }
                            onVariableSourceChange={ variableSource => updateFieldInput(field.id, { ...input, variableSource }) }
                            includeClickedAvatarSource={ includeClickedAvatarSource } />
                        { arrayDefinition.fields.length > 1 &&
                            <WiredButton
                                style={ { marginTop: 6 } }
                                onClick={ () => removeFieldInput(field.id) }>
                                Remove field
                            </WiredButton> }
                    </WiredParam>
                );
            }) }
        </WiredEffectBaseView>
    );
};
