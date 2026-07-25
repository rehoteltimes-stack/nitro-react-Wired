import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import {
    createWiredArrayAddress,
    normalizeWiredArrayAddress,
    wiredArrayAddressIsValid,
    wiredArrayDefinition,
    wiredScalarVariableLists,
    WIRED_VALUE_SHAPE_ARRAY,
    WiredArrayAddressData,
    WiredArrayAddressEditor,
    WiredVariableDefinitionMetadata
} from '../WiredArrayControls';
import {
    normalizeWiredSource,
    parseWiredData,
    sanitizeWiredSignedLongText,
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
    WiredRadio,
    WiredRadioGroup,
    WiredSelect,
    WiredTextInput,
    WiredValueOrVariable,
    WiredVariableLists,
    WiredVariablePicker
} from '../WiredControls';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import {
    WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL,
    WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY,
    WiredConditionQuantifierSection
} from './WiredConditionUtils';

const MODE_MATCH = 0;
const MODE_STATE = 1;
const SCOPE_ANY_INDEX = 0;
const SCOPE_SPECIFIC_INDEX = 1;
const CRITERIA_ALL = 0;
const CRITERIA_ANY = 1;
const RESULT_ALL = 0;
const RESULT_AT_LEAST_ONE = 1;
const RESULT_NOT_ALL = 2;
const RESULT_NONE = 3;
const RESULT_LESS_THAN = 4;
const RESULT_EXACTLY = 5;
const RESULT_MORE_THAN = 6;
const STATE_EMPTY = 0;
const STATE_FULL = 2;
const STATE_LENGTH = 3;
const STATE_AVAILABLE_INDEXES = 4;
const COMPARISON_EQUAL = 2;
const COMPARISONS = [ 0, 1, 2, 3, 4, 5 ];
const VARIABLE_TYPES = [
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER,
    WIRED_VARIABLE_CONTEXT
];
const COMPARISON_LABELS: Record<number, string> = {
    0: '>',
    1: '≥',
    2: '=',
    3: '≤',
    4: '<',
    5: '≠'
};

interface ReferenceData
{
    mode: number;
    value: string;
    variableType: number;
    variable: string;
    variableSource: number;
}

interface CriterionData
{
    fieldId: number;
    comparison: number;
    reference: ReferenceData;
}

interface CheckArrayData
{
    variableName?: string;
    variableType?: number;
    ownerSource?: number;
    conditionMode?: number;
    searchScope?: number;
    criteriaMode?: number;
    resultMode?: number;
    resultComparison?: number;
    stateCheck?: number;
    stateComparison?: number;
    quantifier?: number;
    index?: Partial<WiredArrayAddressData>;
    criteria?: Partial<CriterionData>[];
    resultReference?: Partial<ReferenceData>;
    stateReference?: Partial<ReferenceData>;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    subVariables?: Record<string, string[]>;
    variableDefinitions?: WiredVariableDefinitionMetadata[];
    metadataVersion?: number;
}

const normalizeVariableType = (value: number) =>
    VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;
const normalizeComparison = (value: number) =>
    COMPARISONS.includes(value) ? value : COMPARISON_EQUAL;
const normalizeMode = (value: number) => value === MODE_STATE ? MODE_STATE : MODE_MATCH;
const normalizeScope = (value: number) =>
    value === SCOPE_SPECIFIC_INDEX ? SCOPE_SPECIFIC_INDEX : SCOPE_ANY_INDEX;
const normalizeCriteriaMode = (value: number) =>
    value === CRITERIA_ANY ? CRITERIA_ANY : CRITERIA_ALL;
const normalizeResultMode = (value: number) =>
    value >= RESULT_ALL && value <= RESULT_MORE_THAN
        ? value : RESULT_AT_LEAST_ONE;
const normalizeQuantifier = (value: number) =>
    value === QUANTIFIER_ANY ? QUANTIFIER_ANY : QUANTIFIER_ALL;
const sourceLabelPrefix = (variableType: number) => variableType === WIRED_VARIABLE_FURNI
    ? 'wiredfurni.params.sources.furni'
    : (variableType === WIRED_VARIABLE_USER
        ? 'wiredfurni.params.sources.users'
        : 'wiredfurni.params.sources');
const STATE_OPTIONS = [
    { value: STATE_EMPTY, label: 'Empty' },
    { value: STATE_FULL, label: 'Full' },
    { value: STATE_LENGTH, label: 'Length' },
    { value: STATE_AVAILABLE_INDEXES, label: 'Available Indexes' }
];
const normalizeStateCheck = (value: number) =>
    STATE_OPTIONS.some(option => option.value === value)
        ? value : STATE_EMPTY;
const stateNeedsReference = (value: number) =>
    value === STATE_LENGTH || value === STATE_AVAILABLE_INDEXES;
const resultNeedsReference = (value: number) =>
    value === RESULT_LESS_THAN ||
    value === RESULT_EXACTLY ||
    value === RESULT_MORE_THAN;
const resultComparisonForMode = (value: number) =>
    value === RESULT_LESS_THAN ? 4 :
        (value === RESULT_MORE_THAN ? 0 : COMPARISON_EQUAL);
const migrateLegacyResultMode = (value: number, comparison: number) =>
{
    if(value === 0) return RESULT_AT_LEAST_ONE;
    if(value === 1) return RESULT_NONE;
    if(value !== 2) return RESULT_AT_LEAST_ONE;
    if(comparison === 0) return RESULT_MORE_THAN;
    if(comparison === 4) return RESULT_LESS_THAN;
    return RESULT_EXACTLY;
};
const migrateLegacyStateCheck = (value: number) =>
{
    if(value === 1 || value === 3 || value === 5) return STATE_LENGTH;
    if(value === 4) return STATE_AVAILABLE_INDEXES;
    return normalizeStateCheck(value);
};
const createReference = (): ReferenceData => ({
    mode: WIRED_REFERENCE_SET_VALUE,
    value: '0',
    variableType: WIRED_VARIABLE_GLOBAL,
    variable: '',
    variableSource: WIRED_VARIABLE_GLOBAL
});
const createCriterion = (fieldId = 1): CriterionData => ({
    fieldId,
    comparison: COMPARISON_EQUAL,
    reference: createReference()
});

const ResultRadio: FC<{
    mode: number;
    currentMode: number;
    onChange: (mode: number) => void;
    label: string;
    children?: ReactNode;
}> = props =>
{
    const { mode, currentMode, onChange, label, children = null } = props;

    return (
        <Flex alignItems="center" gap={ 1 }>
            <WiredRadio
                name="checkArrayResultMode"
                checked={ currentMode === mode }
                onChange={ () => onChange(mode) }
                label={ label } />
            { children }
        </Flex>
    );
};

export const WiredConditionCheckArrayView: FC<{}> = () =>
{
    const [ variableType, setVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ variableName, setVariableName ] = useState('');
    const [ ownerSource, setOwnerSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ conditionMode, setConditionMode ] = useState(MODE_MATCH);
    const [ searchScope, setSearchScope ] = useState(SCOPE_ANY_INDEX);
    const [ criteriaMode, setCriteriaMode ] = useState(CRITERIA_ALL);
    const [ resultMode, setResultMode ] = useState(RESULT_AT_LEAST_ONE);
    const [ resultExpanded, setResultExpanded ] = useState(false);
    const [ stateCheck, setStateCheck ] = useState(STATE_EMPTY);
    const [ stateComparison, setStateComparison ] = useState(COMPARISON_EQUAL);
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);
    const [ index, setIndex ] = useState<WiredArrayAddressData>(createWiredArrayAddress);
    const [ criteria, setCriteria ] = useState<CriterionData[]>([ createCriterion() ]);
    const [ resultReference, setResultReference ] = useState<ReferenceData>(createReference);
    const [ stateReference, setStateReference ] = useState<ReferenceData>(createReference);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() =>
        parseWiredData<CheckArrayData>(trigger?.stringData ?? ''), [ trigger ]);
    const variableDefinitions = useMemo(() =>
        data.variableDefinitions ?? [], [ data ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const includeClickedAvatarSource =
        wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const getSourceOptions = useCallback(
        (type: number) => wiredVariableSourceOptions(
            type, includeClickedAvatarSource),
        [ includeClickedAvatarSource ]);
    const allVariables = useMemo<WiredVariableLists>(() => ({
        global: data.globalVariables ?? [],
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? [],
        context: data.contextVariables ?? []
    }), [ data ]);
    const scalarVariables = useMemo(
        () => wiredScalarVariableLists(allVariables, variableDefinitions),
        [ allVariables, variableDefinitions ]);
    const arrayVariables = useMemo<WiredVariableLists>(() =>
    {
        const result: Required<WiredVariableLists> = {
            global: [],
            furni: [],
            user: [],
            context: []
        };

        variableDefinitions
            .filter(definition => definition.valueShape === WIRED_VALUE_SHAPE_ARRAY)
            .forEach(definition =>
            {
                if(definition.variableType === WIRED_VARIABLE_FURNI)
                    result.furni.push(definition.name);
                else if(definition.variableType === WIRED_VARIABLE_USER)
                    result.user.push(definition.name);
                else if(definition.variableType === WIRED_VARIABLE_CONTEXT)
                    result.context.push(definition.name);
                else result.global.push(definition.name);
            });
        Object.values(result).forEach(names => names.sort());
        return result;
    }, [ variableDefinitions ]);
    const definition = wiredArrayDefinition(
        variableDefinitions, variableType, variableName);
    const normalizeReference = useCallback((
        raw: Partial<ReferenceData> = {}): ReferenceData =>
    {
        const type = normalizeVariableType(
            raw.variableType ?? WIRED_VARIABLE_GLOBAL);
        const options = wiredVariablesForType(type, scalarVariables);
        const variable = typeof raw.variable === 'string' &&
            wiredVariableIsSelectable(raw.variable, options, subVariables)
            ? raw.variable
            : '';

        return {
            mode: raw.mode === WIRED_REFERENCE_FROM_VARIABLE
                ? WIRED_REFERENCE_FROM_VARIABLE
                : WIRED_REFERENCE_SET_VALUE,
            value: String(raw.value ?? 0),
            variableType: type,
            variable,
            variableSource: normalizeWiredSource(
                raw.variableSource ?? getSourceOptions(type)[0],
                getSourceOptions(type))
        };
    }, [ scalarVariables, subVariables, getSourceOptions ]);

    const normalizeCriteria = useCallback((
        raw: Partial<CriterionData>[] = [],
        selectedDefinition?: WiredVariableDefinitionMetadata) =>
    {
        const fallbackField = selectedDefinition?.fields[0]?.id ?? 1;
        if(!raw.length) return [ createCriterion(fallbackField) ];

        return raw.map(value => ({
            // Preserve unknown stable IDs so deleted fields invalidate instead of retargeting.
            fieldId: Number.isSafeInteger(value.fieldId)
                ? value.fieldId as number
                : fallbackField,
            comparison: normalizeComparison(
                value.comparison ?? COMPARISON_EQUAL),
            reference: normalizeReference(value.reference)
        }));
    }, [ normalizeReference ]);

    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const commonOptionLabels = {
        [WIRED_SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`,
        [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
        [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
    };
    const sourceSelectors: WiredSourceSelectorConfig[] = [];

    const addReferenceSource = (
        reference: ReferenceData,
        onChange: (source: number) => void,
        titleAccessory: string) =>
    {
        if(reference.mode !== WIRED_REFERENCE_FROM_VARIABLE) return;
        sourceSelectors.push({
            value: reference.variableSource,
            onChange,
            options: getSourceOptions(reference.variableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: sourceLabelPrefix(reference.variableType),
            optionLabels: commonOptionLabels,
            titleAccessory
        });
    };

    if(variableType === WIRED_VARIABLE_FURNI ||
        variableType === WIRED_VARIABLE_USER)
    {
        sourceSelectors.push({
            value: ownerSource,
            onChange: setOwnerSource,
            options: getSourceOptions(variableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables',
            labelPrefix: sourceLabelPrefix(variableType),
            optionLabels: commonOptionLabels
        });
    }

    if(conditionMode === MODE_MATCH)
    {
        if(searchScope === SCOPE_SPECIFIC_INDEX &&
            index.indexMode === WIRED_REFERENCE_FROM_VARIABLE)
        {
            sourceSelectors.push({
                value: index.indexVariableSource,
                onChange: indexVariableSource => setIndex(current => ({
                    ...current,
                    indexVariableSource
                })),
                options: getSourceOptions(index.indexVariableType),
                titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
                labelPrefix: sourceLabelPrefix(index.indexVariableType),
                optionLabels: commonOptionLabels,
                titleAccessory: 'Index'
            });
        }
        criteria.forEach((criterion, criterionIndex) =>
        {
            const field = definition?.fields.find(
                value => value.id === criterion.fieldId);
            addReferenceSource(
                criterion.reference,
                variableSource => setCriteria(current => current.map(
                    (value, indexValue) => indexValue === criterionIndex
                        ? {
                            ...value,
                            reference: { ...value.reference, variableSource }
                        }
                        : value)),
                field?.name ?? `Condition ${ criterionIndex + 1 }`);
        });
    }
    else if(stateNeedsReference(stateCheck))
    {
        addReferenceSource(
            stateReference,
            variableSource => setStateReference(current => ({
                ...current,
                variableSource
            })),
            'State value');
    }

    const activeReferences = conditionMode === MODE_MATCH
        ? [
            ...criteria.map(criterion => criterion.reference)
        ]
        : (stateNeedsReference(stateCheck) ? [ stateReference ] : []);
    const needsFurniSelection = variableType === WIRED_VARIABLE_FURNI ||
        (conditionMode === MODE_MATCH &&
            searchScope === SCOPE_SPECIFIC_INDEX &&
            index.indexMode === WIRED_REFERENCE_FROM_VARIABLE &&
            index.indexVariableType === WIRED_VARIABLE_FURNI) ||
        activeReferences.some(reference =>
            reference.mode === WIRED_REFERENCE_FROM_VARIABLE &&
            reference.variableType === WIRED_VARIABLE_FURNI);

    const setNormalizedVariableType = (nextValue: number) =>
    {
        const nextType = normalizeVariableType(nextValue);

        setVariableType(nextType);
        setVariableName('');
        setOwnerSource(getSourceOptions(nextType)[0]);
        setIndex(createWiredArrayAddress());
        setCriteria([ createCriterion() ]);
        setStateCheck(STATE_EMPTY);
    };

    const setNormalizedVariableName = (nextName: string) =>
    {
        const nextDefinition = wiredArrayDefinition(
            variableDefinitions, variableType, nextName);
        const firstField = nextDefinition?.fields[0]?.id ?? 1;

        setVariableName(nextDefinition ? nextName : '');
        setIndex(normalizeWiredArrayAddress(
            {}, nextDefinition, includeClickedAvatarSource));
        setCriteria([ createCriterion(firstField) ]);
        setStateCheck(STATE_EMPTY);
    };

    const updateCriterion = (criterionIndex: number, value: CriterionData) =>
        setCriteria(current => current.map((criterion, indexValue) =>
            indexValue === criterionIndex ? value : criterion));

    const inputIsValid = (reference: ReferenceData) =>
    {
        if(reference.mode === WIRED_REFERENCE_SET_VALUE)
            return wiredSignedLongIsValid(reference.value);
        return reference.mode === WIRED_REFERENCE_FROM_VARIABLE &&
            wiredVariableIsSelectable(
                reference.variable,
                wiredVariablesForType(
                    reference.variableType, scalarVariables),
                subVariables);
    };

    const validate = () =>
    {
        if(!definition) return false;
        if(conditionMode === MODE_MATCH)
        {
            if(!criteria.length || !criteria.every(criterion =>
                definition.fields.some(field => field.id === criterion.fieldId) &&
                COMPARISONS.includes(criterion.comparison) &&
                inputIsValid(criterion.reference))) return false;
            if(searchScope === SCOPE_SPECIFIC_INDEX)
                return wiredArrayAddressIsValid(index, definition, false);
            return !resultNeedsReference(resultMode) ||
                wiredSignedLongIsValid(resultReference.value);
        }

        if(!STATE_OPTIONS.some(option => option.value === stateCheck))
            return false;
        return !stateNeedsReference(stateCheck) ||
            inputIsValid(stateReference);
    };

    const save = () =>
    {
        setStringParam(JSON.stringify({
            variableName,
            index,
            criteria,
            resultReference,
            stateReference,
            metadataVersion: 8
        }));
        setIntParams([
            variableType,
            ownerSource,
            conditionMode,
            searchScope,
            criteriaMode,
            resultMode,
            resultComparisonForMode(resultMode),
            stateCheck,
            stateComparison,
            quantifier
        ]);
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
        const legacy = (data.metadataVersion ?? 7) < 8;
        const rawResult = intData[5] ??
            data.resultMode ?? RESULT_AT_LEAST_ONE;
        const rawResultComparison = normalizeComparison(
            intData[6] ?? data.resultComparison ?? COMPARISON_EQUAL);
        const rawState = intData[7] ?? data.stateCheck ?? STATE_EMPTY;

        setVariableType(savedType);
        setVariableName(savedDefinition ? savedName : '');
        setOwnerSource(normalizeWiredSource(
            intData[1] ?? data.ownerSource ??
                getSourceOptions(savedType)[0],
            getSourceOptions(savedType)));
        setConditionMode(normalizeMode(
            intData[2] ?? data.conditionMode ?? MODE_MATCH));
        setSearchScope(normalizeScope(
            intData[3] ?? data.searchScope ?? SCOPE_ANY_INDEX));
        setCriteriaMode(normalizeCriteriaMode(
            intData[4] ?? data.criteriaMode ?? CRITERIA_ALL));
        setResultMode(legacy
            ? migrateLegacyResultMode(rawResult, rawResultComparison)
            : normalizeResultMode(rawResult));
        setStateCheck(legacy
            ? migrateLegacyStateCheck(rawState)
            : normalizeStateCheck(rawState));
        setStateComparison(legacy && rawState === 1
            ? 0
            : normalizeComparison(
                intData[8] ?? data.stateComparison ?? COMPARISON_EQUAL));
        setQuantifier(normalizeQuantifier(
            intData[9] ?? data.quantifier ?? QUANTIFIER_ALL));
        setIndex(normalizeWiredArrayAddress(
            data.index, savedDefinition, includeClickedAvatarSource));
        setCriteria(normalizeCriteria(data.criteria, savedDefinition));
        setResultReference({
            ...normalizeReference(data.resultReference),
            mode: WIRED_REFERENCE_SET_VALUE
        });
        setStateReference(legacy && rawState === 1
            ? { ...createReference(), value: '0' }
            : normalizeReference(data.stateReference));
    }, [
        trigger,
        data,
        variableDefinitions,
        includeClickedAvatarSource,
        getSourceOptions,
        normalizeCriteria,
        normalizeReference
    ]);

    const renderReference = (
        radioName: string,
        reference: ReferenceData,
        setReference: (value: ReferenceData) => void) => (
        <WiredValueOrVariable
            radioName={ radioName }
            mode={ reference.mode }
            onModeChange={ mode => setReference({ ...reference, mode }) }
            value={ reference.value }
            onValueChange={ value => setReference({ ...reference, value }) }
            signedLong
            variableType={ reference.variableType }
            atomicVariableTypeChange
            onVariableTypeChange={ nextType =>
            {
                const normalizedType = normalizeVariableType(nextType);

                setReference({
                    ...reference,
                    variableType: normalizedType,
                    variable: '',
                    variableSource: getSourceOptions(normalizedType)[0]
                });
            } }
            variableName={ reference.variable }
            onVariableNameChange={ variable =>
                setReference({ ...reference, variable }) }
            variables={ scalarVariables }
            subVariables={ subVariables }
            variableSource={ reference.variableSource }
            onVariableSourceChange={ variableSource =>
                setReference({ ...reference, variableSource }) }
            includeClickedAvatarSource={ includeClickedAvatarSource } />
    );

    const renderResultInput = (mode: number) => (
        <WiredTextInput
            compact
            type="text"
            inputMode="numeric"
            pattern="-?[0-9]*"
            disabled={ resultMode !== mode }
            value={ resultReference.value }
            onChange={ event => setResultReference(current => ({
                ...current,
                mode: WIRED_REFERENCE_SET_VALUE,
                value: sanitizeWiredSignedLongText(event.target.value)
            })) } />
    );

    return (
        <WiredConditionBaseView
            requiresFurni={ needsFurniSelection
                ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT
                : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput
            save={ save }
            validate={ validate }
            hideFurniSelector={ needsFurniSelection }
            sourceSelectors={ sourceSelectors }
            advancedSlot={
                <WiredConditionQuantifierSection
                    kind="variables"
                    name="checkArrayOwnerQuantifier"
                    value={ quantifier }
                    onChange={ setQuantifier } />
            }
            alwaysExpandedSources={ sourceSelectors.length > 0 }
            expanded={ sourceSelectors.length > 0 }>
            <WiredParam>
                <WiredVariablePicker
                    title="Array variable"
                    variableType={ variableType }
                    onVariableTypeChange={ setNormalizedVariableType }
                    variableName={ variableName }
                    onVariableNameChange={ setNormalizedVariableName }
                    variables={ arrayVariables } />
            </WiredParam>
            <WiredParam title="Mode">
                <WiredRadioGroup
                    inline
                    gap={ 2 }
                    name="checkArrayMode"
                    value={ conditionMode }
                    onChange={ value => setConditionMode(Number(value)) }
                    options={ [
                        { value: MODE_MATCH, label: 'Match' },
                        { value: MODE_STATE, label: 'State' }
                    ] } />
            </WiredParam>
            { conditionMode === MODE_MATCH &&
                <>
                    <WiredParam title="Search scope">
                        <WiredRadioGroup
                            inline
                            gap={ 2 }
                            name="checkArrayScope"
                            value={ searchScope }
                            onChange={ value => setSearchScope(Number(value)) }
                            options={ [
                                { value: SCOPE_ANY_INDEX, label: 'Any index' },
                                { value: SCOPE_SPECIFIC_INDEX, label: 'Specific index' }
                            ] } />
                    </WiredParam>
                    { searchScope === SCOPE_SPECIFIC_INDEX &&
                        <WiredArrayAddressEditor
                            radioName="checkArraySpecificIndex"
                            title="Index"
                            definition={ definition }
                            value={ index }
                            onChange={ setIndex }
                            variables={ scalarVariables }
                            subVariables={ subVariables }
                            includeClickedAvatarSource={ includeClickedAvatarSource }
                            showField={ false } /> }
                    <WiredParam title="Criteria mode">
                        <WiredRadioGroup
                            inline
                            gap={ 2 }
                            name="checkArrayCriteriaMode"
                            value={ criteriaMode }
                            onChange={ value => setCriteriaMode(Number(value)) }
                            options={ [
                                { value: CRITERIA_ALL, label: 'All conditions' },
                                { value: CRITERIA_ANY, label: 'Any condition' }
                            ] } />
                    </WiredParam>
                    { criteria.map((criterion, criterionIndex) =>
                    {
                        const reference = criterion.reference;

                        return (
                            <WiredParam
                                key={ criterionIndex }
                                title={ `Condition ${ criterionIndex + 1 }` }>
                                { (definition?.fields.length ?? 0) > 1 &&
                                    <WiredSelect
                                        value={ criterion.fieldId }
                                        onChange={ event => updateCriterion(
                                            criterionIndex, {
                                                ...criterion,
                                                fieldId: Number(event.target.value)
                                            }) }
                                        options={ (definition?.fields ?? []).map(
                                            field => ({
                                                value: field.id,
                                                label: field.name
                                            })) } /> }
                                <WiredRadioGroup
                                    inline
                                    gap={ 2 }
                                    name={ `checkArrayComparison${ criterionIndex }` }
                                    value={ criterion.comparison }
                                    onChange={ comparison => updateCriterion(
                                        criterionIndex, {
                                            ...criterion,
                                            comparison: Number(comparison)
                                        }) }
                                    options={ COMPARISONS.map(value => ({
                                        value,
                                        label: COMPARISON_LABELS[value]
                                    })) } />
                                { renderReference(
                                    `checkArrayCriterion${ criterionIndex }`,
                                    reference,
                                    value => updateCriterion(
                                        criterionIndex,
                                        { ...criterion, reference: value })) }
                                { criteria.length > 1 &&
                                    <WiredButton onClick={ () =>
                                        setCriteria(current => current.filter(
                                            (_, indexValue) =>
                                                indexValue !== criterionIndex)) }>
                                        Remove
                                    </WiredButton> }
                            </WiredParam>
                        );
                    }) }
                    <WiredParam>
                        <WiredButton onClick={ () => setCriteria(current => [
                            ...current,
                            createCriterion(definition?.fields[0]?.id ?? 1)
                        ]) }>
                            Add condition
                        </WiredButton>
                    </WiredParam>
                    { searchScope === SCOPE_ANY_INDEX &&
                        <WiredParam
                            title="Result"
                            chevron
                            expanded={ resultExpanded }
                            onToggle={ () =>
                                setResultExpanded(value => !value) }>
                            <Column gap={ 1 }>
                                <ResultRadio
                                    mode={ RESULT_ALL }
                                    currentMode={ resultMode }
                                    onChange={ setResultMode }
                                    label="All" />
                                <ResultRadio
                                    mode={ RESULT_AT_LEAST_ONE }
                                    currentMode={ resultMode }
                                    onChange={ setResultMode }
                                    label="At least one" />
                                <ResultRadio
                                    mode={ RESULT_NOT_ALL }
                                    currentMode={ resultMode }
                                    onChange={ setResultMode }
                                    label="Not all" />
                                <ResultRadio
                                    mode={ RESULT_NONE }
                                    currentMode={ resultMode }
                                    onChange={ setResultMode }
                                    label="None" />
                                <ResultRadio
                                    mode={ RESULT_LESS_THAN }
                                    currentMode={ resultMode }
                                    onChange={ setResultMode }
                                    label="Less than:">
                                    { renderResultInput(RESULT_LESS_THAN) }
                                </ResultRadio>
                                <ResultRadio
                                    mode={ RESULT_EXACTLY }
                                    currentMode={ resultMode }
                                    onChange={ setResultMode }
                                    label="Exactly:">
                                    { renderResultInput(RESULT_EXACTLY) }
                                </ResultRadio>
                                <ResultRadio
                                    mode={ RESULT_MORE_THAN }
                                    currentMode={ resultMode }
                                    onChange={ setResultMode }
                                    label="More than:">
                                    { renderResultInput(RESULT_MORE_THAN) }
                                </ResultRadio>
                            </Column>
                        </WiredParam> }
                </> }
            { conditionMode === MODE_STATE &&
                <>
                    <WiredParam title="State">
                        <WiredSelect
                            value={ stateCheck }
                            onChange={ event =>
                                setStateCheck(Number(event.target.value)) }
                            options={ STATE_OPTIONS } />
                    </WiredParam>
                    { stateNeedsReference(stateCheck) &&
                        <WiredParam title="Compare with" divider={ false }>
                            <WiredRadioGroup
                                inline
                                gap={ 2 }
                                name="checkArrayStateComparison"
                                value={ stateComparison }
                                onChange={ value =>
                                    setStateComparison(Number(value)) }
                                options={ COMPARISONS.map(value => ({
                                    value,
                                    label: COMPARISON_LABELS[value]
                                })) } />
                            { renderReference(
                                'checkArrayStateReference',
                                stateReference,
                                setStateReference) }
                        </WiredParam> }
                </> }
        </WiredConditionBaseView>
    );
};
