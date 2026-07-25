import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
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
    WiredRadioGroup,
    WiredSelect,
    WiredValueOrVariable,
    WiredVariableLists,
    WiredVariableNameSelect,
    WiredVariablePicker
} from '../WiredControls';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import { WiredBaseView } from '../WiredBaseView';

const MODE_INDEX = 0;
const MODE_FIND = 1;
const DIRECTION_FIRST = 0;
const DIRECTION_LAST = 1;
const DIRECTION_RANDOM = 2;
const CRITERIA_ALL = 0;
const CRITERIA_ANY = 1;
const COMPARISONS = [ 0, 1, 2, 3, 4, 5 ];
const VARIABLE_TYPES = [
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER,
    WIRED_VARIABLE_CONTEXT
];

interface CriterionReferenceData
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
    reference: CriterionReferenceData;
}

interface ArrayCapturerData
{
    variableName?: string;
    contextVariableName?: string;
    /** Legacy preview configuration. */
    captureAlias?: string;
    variableType?: number;
    ownerSource?: number;
    captureMode?: number;
    findDirection?: number;
    criteriaMode?: number;
    index?: Partial<WiredArrayAddressData>;
    criteria?: Partial<CriterionData>[];
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    subVariables?: Record<string, string[]>;
    variableDefinitions?: WiredVariableDefinitionMetadata[];
}

const normalizeVariableType = (value: number) =>
    VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_GLOBAL;

const createReference = (): CriterionReferenceData => ({
    mode: WIRED_REFERENCE_SET_VALUE,
    value: '0',
    variableType: WIRED_VARIABLE_GLOBAL,
    variable: '',
    variableSource: WIRED_VARIABLE_GLOBAL
});

const createCriterion = (fieldId = 1): CriterionData => ({
    fieldId,
    comparison: 2,
    reference: createReference()
});

const sourceLabelPrefix = (variableType: number) => variableType === WIRED_VARIABLE_FURNI
    ? 'wiredfurni.params.sources.furni'
    : (variableType === WIRED_VARIABLE_USER
        ? 'wiredfurni.params.sources.users'
        : 'wiredfurni.params.sources');

const COMPARISON_LABELS: Record<number, string> = {
    0: '>',
    1: '≥',
    2: '=',
    3: '≤',
    4: '<',
    5: '≠'
};

export const WiredExtraArrayEntryCapturerView: FC<{}> = () =>
{
    const [ variableType, setVariableType ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ variableName, setVariableName ] = useState('');
    const [ ownerSource, setOwnerSource ] = useState(WIRED_VARIABLE_GLOBAL);
    const [ captureMode, setCaptureMode ] = useState(MODE_INDEX);
    const [ contextVariableName, setContextVariableName ] = useState('');
    const [ findDirection, setFindDirection ] = useState(DIRECTION_FIRST);
    const [ criteriaMode, setCriteriaMode ] = useState(CRITERIA_ALL);
    const [ index, setIndex ] = useState<WiredArrayAddressData>(createWiredArrayAddress);
    const [ criteria, setCriteria ] = useState<CriterionData[]>([ createCriterion() ]);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<ArrayCapturerData>(trigger?.stringData ?? ''), [ trigger ]);
    const variableDefinitions = useMemo(() => data.variableDefinitions ?? [], [ data ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const includeClickedAvatarSource = wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const getSourceOptions = useCallback(
        (type: number) => wiredVariableSourceOptions(type, includeClickedAvatarSource),
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
    const contextCaptureVariables = useMemo<WiredVariableLists>(() =>
    {
        const userDefinitions = new Set(variableDefinitions
            .filter(definition =>
                definition.variableType === WIRED_VARIABLE_CONTEXT &&
                definition.valueShape !== WIRED_VALUE_SHAPE_ARRAY)
            .map(definition => definition.name));

        return {
            context: (scalarVariables.context ?? []).filter(name => userDefinitions.has(name))
        };
    }, [ scalarVariables, variableDefinitions ]);
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
                if(definition.variableType === WIRED_VARIABLE_FURNI) result.furni.push(definition.name);
                else if(definition.variableType === WIRED_VARIABLE_USER) result.user.push(definition.name);
                else if(definition.variableType === WIRED_VARIABLE_CONTEXT) result.context.push(definition.name);
                else result.global.push(definition.name);
            });
        Object.values(result).forEach(names => names.sort());
        return result;
    }, [ variableDefinitions ]);
    const definition = wiredArrayDefinition(variableDefinitions, variableType, variableName);

    const normalizeReference = useCallback((raw: Partial<CriterionReferenceData> = {}): CriterionReferenceData =>
    {
        const type = normalizeVariableType(raw.variableType ?? WIRED_VARIABLE_GLOBAL);
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
        const fields = selectedDefinition?.fields ?? [];
        const fallbackField = fields[0]?.id ?? 1;
        const normalized = raw.map(value => ({
            fieldId: fields.some(field => field.id === value.fieldId)
                ? value.fieldId as number
                : fallbackField,
            comparison: COMPARISONS.includes(value.comparison ?? 2)
                ? value.comparison as number
                : 2,
            reference: normalizeReference(value.reference)
        }));

        return normalized.length ? normalized : [ createCriterion(fallbackField) ];
    }, [ normalizeReference ]);

    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const commonOptionLabels = {
        [WIRED_SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`,
        [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
        [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
    };
    const sourceSelectors: WiredSourceSelectorConfig[] = [];

    if(variableType === WIRED_VARIABLE_FURNI || variableType === WIRED_VARIABLE_USER)
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

    if(captureMode === MODE_INDEX && index.indexMode === WIRED_REFERENCE_FROM_VARIABLE)
    {
        sourceSelectors.push({
            value: index.indexVariableSource,
            onChange: indexVariableSource => setIndex(value => ({ ...value, indexVariableSource })),
            options: getSourceOptions(index.indexVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: sourceLabelPrefix(index.indexVariableType),
            optionLabels: commonOptionLabels,
            titleAccessory: 'Index'
        });
    }

    if(captureMode === MODE_FIND)
    {
        criteria.forEach((criterion, criterionIndex) =>
        {
            const reference = criterion.reference;

            if(reference.mode !== WIRED_REFERENCE_FROM_VARIABLE) return;
            const field = definition?.fields.find(value => value.id === criterion.fieldId);

            sourceSelectors.push({
                value: reference.variableSource,
                onChange: variableSource => setCriteria(current => current.map((value, indexValue) =>
                    indexValue === criterionIndex
                        ? { ...value, reference: { ...value.reference, variableSource }}
                        : value)),
                options: getSourceOptions(reference.variableType),
                titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
                labelPrefix: sourceLabelPrefix(reference.variableType),
                optionLabels: commonOptionLabels,
                titleAccessory: field?.name ?? `Condition ${ criterionIndex + 1 }`
            });
        });
    }

    const needsFurniSelection = variableType === WIRED_VARIABLE_FURNI ||
        (captureMode === MODE_INDEX && index.indexMode === WIRED_REFERENCE_FROM_VARIABLE &&
            index.indexVariableType === WIRED_VARIABLE_FURNI) ||
        (captureMode === MODE_FIND && criteria.some(criterion =>
            criterion.reference.mode === WIRED_REFERENCE_FROM_VARIABLE &&
            criterion.reference.variableType === WIRED_VARIABLE_FURNI));

    const setNormalizedVariableType = (nextValue: number) =>
    {
        const nextType = normalizeVariableType(nextValue);

        setVariableType(nextType);
        setVariableName('');
        setOwnerSource(getSourceOptions(nextType)[0]);
        setIndex(createWiredArrayAddress());
        setCriteria([ createCriterion() ]);
    };

    const setNormalizedVariableName = (nextName: string) =>
    {
        const nextDefinition = wiredArrayDefinition(variableDefinitions, variableType, nextName);
        const firstField = nextDefinition?.fields[0]?.id ?? 1;

        setVariableName(nextDefinition ? nextName : '');
        setIndex(normalizeWiredArrayAddress({}, nextDefinition, includeClickedAvatarSource));
        setCriteria([ createCriterion(firstField) ]);
    };

    const updateCriterion = (criterionIndex: number, value: CriterionData) =>
        setCriteria(current => current.map((criterion, indexValue) =>
            indexValue === criterionIndex ? value : criterion));

    const save = () =>
    {
        setStringParam(JSON.stringify({
            variableName,
            contextVariableName,
            index,
            criteria,
            metadataVersion: 6
        }));
        setIntParams([
            variableType,
            ownerSource,
            captureMode,
            findDirection,
            criteriaMode
        ]);
    };

    const validate = () =>
    {
        if(!definition ||
            !(contextCaptureVariables.context ?? []).includes(contextVariableName)) return false;
        if(captureMode === MODE_INDEX)
        {
            return wiredArrayAddressIsValid(index, definition, false);
        }
        if(!criteria.length) return false;
        return criteria.every(criterion =>
        {
            if(!definition.fields.some(field => field.id === criterion.fieldId) ||
                !COMPARISONS.includes(criterion.comparison)) return false;
            if(criterion.reference.mode === WIRED_REFERENCE_SET_VALUE)
            {
                return wiredSignedLongIsValid(criterion.reference.value);
            }
            return criterion.reference.mode === WIRED_REFERENCE_FROM_VARIABLE &&
                wiredVariableIsSelectable(
                    criterion.reference.variable,
                    wiredVariablesForType(criterion.reference.variableType, scalarVariables),
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
        const savedDefinition = wiredArrayDefinition(variableDefinitions, savedType, savedName);

        setVariableType(savedType);
        setVariableName(savedDefinition ? savedName : '');
        setOwnerSource(normalizeWiredSource(
            intData[1] ?? data.ownerSource ?? getSourceOptions(savedType)[0],
            getSourceOptions(savedType)));
        setCaptureMode((intData[2] ?? data.captureMode) === MODE_FIND ? MODE_FIND : MODE_INDEX);
        const savedDirection = intData[3] ?? data.findDirection;

        setFindDirection(savedDirection === DIRECTION_LAST || savedDirection === DIRECTION_RANDOM
            ? savedDirection
            : DIRECTION_FIRST);
        setCriteriaMode((intData[4] ?? data.criteriaMode) === CRITERIA_ANY
            ? CRITERIA_ANY
            : CRITERIA_ALL);
        const savedContextVariable = data.contextVariableName ?? data.captureAlias ?? '';

        setContextVariableName((contextCaptureVariables.context ?? []).includes(savedContextVariable)
            ? savedContextVariable
            : '');
        setIndex(normalizeWiredArrayAddress(
            data.index, savedDefinition, includeClickedAvatarSource));
        setCriteria(normalizeCriteria(data.criteria, savedDefinition));
    }, [
        trigger,
        data,
        variableDefinitions,
        contextCaptureVariables,
        includeClickedAvatarSource,
        getSourceOptions,
        normalizeCriteria
    ]);

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ needsFurniSelection
                ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT
                : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput
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
            <WiredParam title="Capture mode">
                <WiredSelect
                    value={ captureMode }
                    onChange={ event => setCaptureMode(Number(event.target.value)) }
                    options={ [
                        { value: MODE_INDEX, label: 'Index' },
                        { value: MODE_FIND, label: 'Match' }
                    ] } />
            </WiredParam>
            <WiredParam title="Capture variable">
                <WiredVariableNameSelect
                    variableType={ WIRED_VARIABLE_CONTEXT }
                    variableName={ contextVariableName }
                    onVariableNameChange={ setContextVariableName }
                    variables={ contextCaptureVariables } />
            </WiredParam>
            { captureMode === MODE_INDEX &&
                <WiredArrayAddressEditor
                    radioName="arrayCaptureIndex"
                    definition={ definition }
                    value={ index }
                    onChange={ setIndex }
                    variables={ scalarVariables }
                    subVariables={ subVariables }
                    includeClickedAvatarSource={ includeClickedAvatarSource }
                    showField={ false }
                    divider={ false } /> }
            { captureMode === MODE_FIND &&
                <>
                    <WiredParam title="Match">
                        <WiredSelect
                            value={ findDirection }
                            onChange={ event => setFindDirection(Number(event.target.value)) }
                            options={ [
                                { value: DIRECTION_FIRST, label: 'First' },
                                { value: DIRECTION_LAST, label: 'Last' },
                                { value: DIRECTION_RANDOM, label: 'Random' }
                            ] } />
                    </WiredParam>
                    <WiredParam title="Criteria mode">
                        <WiredRadioGroup
                            inline
                            gap={ 2 }
                            name="arrayCaptureCriteriaMode"
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
                                <WiredSelect
                                    value={ criterion.fieldId }
                                    onChange={ event => updateCriterion(criterionIndex, {
                                        ...criterion,
                                        fieldId: Number(event.target.value)
                                    }) }
                                    options={ (definition?.fields ?? []).map(field => ({
                                        value: field.id,
                                        label: field.name
                                    })) } />
                                <WiredRadioGroup
                                    inline
                                    gap={ 2 }
                                    name={ `arrayCaptureComparison${ criterionIndex }` }
                                    value={ criterion.comparison }
                                    onChange={ comparison => updateCriterion(criterionIndex, {
                                        ...criterion,
                                        comparison: Number(comparison)
                                    }) }
                                    options={ COMPARISONS.map(value => ({
                                        value,
                                        label: COMPARISON_LABELS[value]
                                    })) } />
                                <WiredValueOrVariable
                                    radioName={ `arrayCaptureCriterion${ criterionIndex }` }
                                    mode={ reference.mode }
                                    onModeChange={ mode => updateCriterion(criterionIndex, {
                                        ...criterion,
                                        reference: { ...reference, mode }
                                    }) }
                                    value={ reference.value }
                                    onValueChange={ value => updateCriterion(criterionIndex, {
                                        ...criterion,
                                        reference: { ...reference, value }
                                    }) }
                                    signedLong
                                    variableType={ reference.variableType }
                                    atomicVariableTypeChange
                                    onVariableTypeChange={ nextType => updateCriterion(criterionIndex, {
                                        ...criterion,
                                        reference: {
                                            ...reference,
                                            variableType: normalizeVariableType(nextType),
                                            variable: '',
                                            variableSource: getSourceOptions(nextType)[0]
                                        }
                                    }) }
                                    variableName={ reference.variable }
                                    onVariableNameChange={ variable => updateCriterion(criterionIndex, {
                                        ...criterion,
                                        reference: { ...reference, variable }
                                    }) }
                                    variables={ scalarVariables }
                                    subVariables={ subVariables }
                                    variableSource={ reference.variableSource }
                                    onVariableSourceChange={ variableSource => updateCriterion(criterionIndex, {
                                        ...criterion,
                                        reference: { ...reference, variableSource }
                                    }) }
                                    includeClickedAvatarSource={ includeClickedAvatarSource } />
                                { criteria.length > 1 &&
                                    <WiredButton onClick={ () => setCriteria(current =>
                                        current.filter((_, indexValue) => indexValue !== criterionIndex)) }>
                                        Remove
                                    </WiredButton> }
                            </WiredParam>
                        );
                    }) }
                    <WiredParam divider={ false }>
                        <WiredButton onClick={ () => setCriteria(current => [
                            ...current,
                            createCriterion(definition?.fields[0]?.id ?? 1)
                        ]) }>
                            Add condition
                        </WiredButton>
                    </WiredParam>
                </> }
        </WiredBaseView>
    );
};
