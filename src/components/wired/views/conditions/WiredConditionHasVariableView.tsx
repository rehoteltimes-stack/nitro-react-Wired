import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import {
    normalizeWiredSource,
    parseWiredData,
    WIRED_REFERENCE_FROM_VARIABLE,
    WIRED_SOURCE_SELECTED,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_USER,
    wiredVariableSourceOptions,
    WiredParam,
    WiredRadioGroup,
    WiredVariablePicker,
    WiredVariableLists,
    wiredVariableExists
} from '../WiredControls';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';
import {
    createWiredArrayAddress,
    normalizeWiredArrayAddress,
    WIRED_ARRAY_ENTRY_EXISTS,
    WIRED_ARRAY_EXISTS,
    wiredArrayAddressIsValid,
    wiredArrayDefinition,
    WiredArrayAddressData,
    WiredArrayAddressEditor,
    wiredScalarVariableLists,
    WiredVariableDefinitionMetadata
} from '../WiredArrayControls';

interface VariableData
{
    variableName?: string;
    variableType?: number;
    source?: number;
    quantifier?: number;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    subVariables?: Record<string, string[]>;
    arrayExistenceMode?: number;
    arrayAddress?: Partial<WiredArrayAddressData>;
    variableDefinitions?: WiredVariableDefinitionMetadata[];
}

const VARIABLE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];
const defaultSourceForType = (variableType: number) => wiredVariableSourceOptions(variableType)[0];
const normalizeVariableType = (variableType: number) => VARIABLE_TYPES.includes(variableType) ? variableType : WIRED_VARIABLE_USER;

const sourceLabelPrefixForType = (variableType: number) =>
    variableType === WIRED_VARIABLE_FURNI
        ? 'wiredfurni.params.sources.furni'
        : variableType === WIRED_VARIABLE_USER
            ? 'wiredfurni.params.sources.users'
            : 'wiredfurni.params.sources';

export const WiredConditionHasVariableView: FC<{ isNegative?: boolean }> = props =>
{
    const { isNegative = false } = props;
    const [ variableType, setVariableType ] = useState(WIRED_VARIABLE_USER);
    const [ variableName, setVariableName ] = useState('');
    const [ source, setSource ] = useState(defaultSourceForType(WIRED_VARIABLE_USER));
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);
    const [ arrayExistenceMode, setArrayExistenceMode ] = useState(WIRED_ARRAY_EXISTS);
    const [ arrayAddress, setArrayAddress ] = useState<WiredArrayAddressData>(createWiredArrayAddress);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<VariableData>(trigger?.stringData ?? ''), [ trigger ]);
    const variables: WiredVariableLists = useMemo(() => ({
        global: data.globalVariables ?? [],
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? [],
        context: data.contextVariables ?? []
    }), [ data ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const variableDefinitions = useMemo(() => data.variableDefinitions ?? [], [ data ]);
    const selectedArray = wiredArrayDefinition(variableDefinitions, variableType, variableName);
    const scalarIndexVariables = useMemo(
        () => wiredScalarVariableLists(variables, variableDefinitions),
        [ variables, variableDefinitions ]);

    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const sourceOptions = wiredVariableSourceOptions(variableType);

    const sourceSelector: WiredSourceSelectorConfig = {
        value: source,
        onChange: setSource,
        options: sourceOptions,
        titleKey: 'wiredfurni.params.sources.merged.title.variables',
        labelPrefix: sourceLabelPrefixForType(variableType),
        optionLabels: {
            [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context'),
            [WIRED_SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`
        }
    };
    const sourceSelectors: WiredSourceSelectorConfig[] = [ sourceSelector ];
    if(selectedArray && arrayExistenceMode === WIRED_ARRAY_ENTRY_EXISTS &&
        arrayAddress.indexMode === WIRED_REFERENCE_FROM_VARIABLE)
    {
        sourceSelectors.push({
            value: arrayAddress.indexVariableSource,
            onChange: indexVariableSource => setArrayAddress(value => ({ ...value, indexVariableSource })),
            options: wiredVariableSourceOptions(arrayAddress.indexVariableType),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: sourceLabelPrefixForType(arrayAddress.indexVariableType),
            optionLabels: sourceSelector.optionLabels
        });
    }

    const save = () =>
    {
        setStringParam(JSON.stringify({ variableName, arrayExistenceMode, arrayAddress }));
        setIntParams([ variableType, source, quantifier ]);
    };

    const validate = () => !!variableName &&
        (arrayExistenceMode !== WIRED_ARRAY_ENTRY_EXISTS ||
            wiredArrayAddressIsValid(arrayAddress, selectedArray, false));

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const nextType = normalizeVariableType(intData[0] ?? data.variableType ?? WIRED_VARIABLE_USER);
        const nextSource = normalizeWiredSource(intData[1] ?? data.source ?? defaultSourceForType(nextType), wiredVariableSourceOptions(nextType));

        setVariableType(nextType);
        setSource(nextSource);
        setQuantifier((intData[2] ?? data.quantifier ?? QUANTIFIER_ALL) === QUANTIFIER_ANY ? QUANTIFIER_ANY : QUANTIFIER_ALL);
        const savedVariables = nextType === WIRED_VARIABLE_FURNI ? variables.furni : (nextType === WIRED_VARIABLE_CONTEXT ? variables.context : variables.user);
        const savedVariable = data.variableName ?? '';

        setVariableName(wiredVariableExists(savedVariable, savedVariables ?? [], subVariables) ? savedVariable : '');
        const savedDefinition = wiredArrayDefinition(variableDefinitions, nextType, savedVariable);
        setArrayExistenceMode(data.arrayExistenceMode === WIRED_ARRAY_ENTRY_EXISTS
            ? WIRED_ARRAY_ENTRY_EXISTS
            : WIRED_ARRAY_EXISTS);
        setArrayAddress(normalizeWiredArrayAddress(data.arrayAddress, savedDefinition));
    }, [ trigger, data, variables, subVariables, variableDefinitions ]);

    const needsFurniSelection = variableType === WIRED_VARIABLE_FURNI ||
        (!!selectedArray && arrayExistenceMode === WIRED_ARRAY_ENTRY_EXISTS &&
            arrayAddress.indexMode === WIRED_REFERENCE_FROM_VARIABLE && arrayAddress.indexVariableType === WIRED_VARIABLE_FURNI);

    return (
        <WiredConditionBaseView
            requiresFurni={ needsFurniSelection ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            validate={ validate }
            hideFurniSelector={ needsFurniSelection }
            sourceSelectors={ sourceSelectors }
            advancedSlot={ <WiredConditionQuantifierSection kind="variables" name="variableQuantifier" value={ quantifier } onChange={ setQuantifier } negative={ isNegative } /> }
            alwaysExpandedSources={ true }
            expanded={ true }>
            <WiredParam divider={ false }>
                <WiredVariablePicker
                    titleKey="wiredfurni.params.variables.variable_selection"
                    variableType={ variableType }
                    onVariableTypeChange={ type =>
                    {
                        const nextType = normalizeVariableType(type);
                        setVariableType(nextType);
                        setSource(normalizeWiredSource(source, wiredVariableSourceOptions(nextType)));
                    } }
                    variableName={ variableName }
                    onVariableNameChange={ setVariableName }
                    variables={ variables }
                    subVariables={ subVariables }
                    variableSource={ source }
                    onVariableSourceChange={ setSource }
                    hiddenTypes={ [ 1 ] } />
            </WiredParam>
            { selectedArray &&
                <WiredParam title="Existence" divider={ arrayExistenceMode === WIRED_ARRAY_ENTRY_EXISTS }>
                    <WiredRadioGroup
                        name="arrayExistenceMode"
                        value={ arrayExistenceMode }
                        onChange={ value => setArrayExistenceMode(Number(value)) }
                        options={ [
                            { value: WIRED_ARRAY_EXISTS, label: 'Array exists' },
                            { value: WIRED_ARRAY_ENTRY_EXISTS, label: 'Entry exists at index' }
                        ] } />
                </WiredParam> }
            { selectedArray && arrayExistenceMode === WIRED_ARRAY_ENTRY_EXISTS &&
                <WiredArrayAddressEditor
                    radioName="hasVariableArrayIndex"
                    definition={ selectedArray }
                    value={ arrayAddress }
                    onChange={ setArrayAddress }
                    variables={ scalarIndexVariables }
                    subVariables={ subVariables }
                    divider={ false }
                    showField={ false } /> }
        </WiredConditionBaseView>
    );
}
