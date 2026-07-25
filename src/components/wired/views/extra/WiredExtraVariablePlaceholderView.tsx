import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import {
    createWiredArrayAddress,
    normalizeWiredArrayAddress,
    wiredArrayAddressIsValid,
    wiredArrayDefinition,
    wiredScalarVariableLists,
    WiredArrayAddressData,
    WiredArrayAddressEditor,
    WiredVariableDefinitionMetadata
} from '../WiredArrayControls';
import {
    normalizeWiredSource,
    parseWiredData,
    WiredButtonInfoText,
    WiredDisabled,
    WiredParam,
    WiredPlaceholderPreview,
    WiredRadio,
    WiredTextInput,
    WiredVariablePicker,
    WiredVariableLists,
    wiredClickedAvatarSourceAvailableForTrigger,
    wiredVariableExists,
    wiredVariableSourceOptions,
    WIRED_REFERENCE_FROM_VARIABLE,
    WIRED_SOURCE_SELECTED,
    WIRED_SOURCE_TRIGGER,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER
} from '../WiredControls';

const DISPLAY_NUMERIC = 1;
const DISPLAY_TEXTUAL = 2;
const TYPE_SINGLE = 1;
const TYPE_MULTIPLE = 2;

interface VariablePlaceholderData
{
    placeholderName?: string;
    variableName?: string;
    delimiter?: string;
    variableType?: number;
    source?: number;
    displayType?: number;
    placeholderType?: number;
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    subVariables?: Record<string, string[]>;
    textConnectorAvailable?: boolean;
    globalTextConnectorVariables?: string[];
    furniTextConnectorVariables?: string[];
    userTextConnectorVariables?: string[];
    contextTextConnectorVariables?: string[];
    arrayAddress?: Partial<WiredArrayAddressData>;
    variableDefinitions?: WiredVariableDefinitionMetadata[];
    textConnectorFields?: Array<{ variableType: number; variableName: string; fieldId: number; }>;
}

const sourceLabelPrefix = (variableType: number) => variableType === WIRED_VARIABLE_FURNI
    ? 'wiredfurni.params.sources.furni'
    : (variableType === WIRED_VARIABLE_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources');
const VALID_VARIABLE_TYPES = [ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER, WIRED_VARIABLE_CONTEXT ];

const normalizePlaceholderName = (value: string) =>
{
    let normalized = value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    normalized = normalized.replace(/^_+|_+$/g, '');

    return normalized.substring(0, 40);
}
const normalizeVariableType = (value: number) => VALID_VARIABLE_TYPES.includes(value) ? value : WIRED_VARIABLE_USER;
const normalizeDisplayType = (value: number) => value === DISPLAY_TEXTUAL ? DISPLAY_TEXTUAL : DISPLAY_NUMERIC;
const normalizePlaceholderType = (value: number) => value === TYPE_MULTIPLE ? TYPE_MULTIPLE : TYPE_SINGLE;
const sanitizeDelimiter = (value: string) => value.replace(/[^\x21-\x7E]/g, '').substring(0, 4);
const capturedContextAlias = (value: string) =>
{
    const match = value.match(/^([a-z0-9_]+)\.[a-z0-9_]+$/i);

    return match?.[1] ?? '';
};

export const WiredExtraVariablePlaceholderView: FC<{}> = props =>
{
    const [ placeholderName, setPlaceholderName ] = useState('');
    const [ variableType, setVariableType ] = useState(WIRED_VARIABLE_USER);
    const [ variableName, setVariableName ] = useState('');
    const [ source, setSource ] = useState(WIRED_SOURCE_TRIGGER);
    const [ displayType, setDisplayType ] = useState(DISPLAY_NUMERIC);
    const [ placeholderType, setPlaceholderType ] = useState(TYPE_SINGLE);
    const [ delimiter, setDelimiter ] = useState(',');
    const [ arrayAddress, setArrayAddress ] = useState<WiredArrayAddressData>(createWiredArrayAddress);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [] } = useWired() as any;

    const data = useMemo(() => parseWiredData<VariablePlaceholderData>(trigger?.stringData ?? ''), [ trigger ]);
    const variables = useMemo<WiredVariableLists>(() => ({
        global: data.globalVariables ?? [],
        furni: data.furniVariables ?? [],
        user: data.userVariables ?? [],
        context: data.contextVariables ?? []
    }), [ data ]);
    const subVariables = useMemo(() => data.subVariables ?? {}, [ data ]);
    const variableDefinitions = useMemo(() => data.variableDefinitions ?? [], [ data ]);
    const selectedArray = wiredArrayDefinition(variableDefinitions, variableType, variableName);
    const scalarVariables = useMemo(
        () => wiredScalarVariableLists(variables, variableDefinitions),
        [ variables, variableDefinitions ]);
    const selectedCount = Array.isArray(furniIds) ? furniIds.length : 0;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const isMultiple = placeholderType === TYPE_MULTIPLE;
    const previewToken = placeholderName ? `$(${ placeholderName })` : '$()';
    const includeClickedAvatarSource = wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const getSourceOptions = useCallback(
        (type: number) => wiredVariableSourceOptions(type, includeClickedAvatarSource),
        [ includeClickedAvatarSource ]);
    const sourceOptions = getSourceOptions(variableType);
    const sourceSelectors = [ {
        value: source,
        onChange: setSource,
        options: sourceOptions,
        titleKey: 'wiredfurni.params.sources.merged.title.variables',
        labelPrefix: sourceLabelPrefix(variableType),
        optionLabels: {
            [WIRED_SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`,
            [WIRED_VARIABLE_GLOBAL]: LocalizeText('wiredfurni.params.sources.global'),
            [WIRED_VARIABLE_CONTEXT]: LocalizeText('wiredfurni.params.sources.context')
        }
    } as any ];
    if(selectedArray && arrayAddress.indexMode === WIRED_REFERENCE_FROM_VARIABLE)
    {
        sourceSelectors.push({
            value: arrayAddress.indexVariableSource,
            onChange: (indexVariableSource: number) => setArrayAddress(value => ({ ...value, indexVariableSource })),
            options: wiredVariableSourceOptions(arrayAddress.indexVariableType, includeClickedAvatarSource),
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: sourceLabelPrefix(arrayAddress.indexVariableType),
            optionLabels: sourceSelectors[0].optionLabels
        } as any);
    }
    const textConnectorVariables = variableType === WIRED_VARIABLE_FURNI
        ? (data.furniTextConnectorVariables ?? [])
        : (variableType === WIRED_VARIABLE_USER
            ? (data.userTextConnectorVariables ?? [])
            : (variableType === WIRED_VARIABLE_CONTEXT ? (data.contextTextConnectorVariables ?? []) : (data.globalTextConnectorVariables ?? [])));
    const textualDisplayEnabled = !!variableName && (selectedArray
        ? (data.textConnectorFields ?? []).some(connector =>
            connector.variableType === variableType && connector.variableName === variableName &&
            connector.fieldId === arrayAddress.fieldId)
        : textConnectorVariables.includes(variableName) ||
            (variableType === WIRED_VARIABLE_CONTEXT &&
                textConnectorVariables.includes(capturedContextAlias(variableName))));

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const savedType = normalizeVariableType(intData[0] ?? data.variableType ?? WIRED_VARIABLE_USER);
        const savedSource = normalizeWiredSource(intData[1] ?? data.source ?? getSourceOptions(savedType)[0], getSourceOptions(savedType));
        const savedVariable = data.variableName ?? '';
        const savedVariables = savedType === WIRED_VARIABLE_FURNI ? variables.furni : (savedType === WIRED_VARIABLE_USER ? variables.user : (savedType === WIRED_VARIABLE_CONTEXT ? variables.context : variables.global));
        const savedDelimiter = sanitizeDelimiter(data.delimiter ?? ',') || ',';

        setPlaceholderName(normalizePlaceholderName(data.placeholderName ?? ''));
        setVariableType(savedType);
        setSource(savedSource);
        setDisplayType(normalizeDisplayType(intData[2] ?? data.displayType ?? DISPLAY_NUMERIC));
        setPlaceholderType(normalizePlaceholderType(intData[3] ?? data.placeholderType ?? TYPE_SINGLE));
        setVariableName(wiredVariableExists(savedVariable, savedVariables ?? [], subVariables) ? savedVariable : '');
        setDelimiter(savedDelimiter);
        setArrayAddress(normalizeWiredArrayAddress(
            data.arrayAddress,
            wiredArrayDefinition(variableDefinitions, savedType, savedVariable),
            includeClickedAvatarSource));
    }, [ trigger, data, variables, subVariables, variableDefinitions, includeClickedAvatarSource, getSourceOptions ]);

    useEffect(() =>
    {
        if(!textualDisplayEnabled && displayType === DISPLAY_TEXTUAL) setDisplayType(DISPLAY_NUMERIC);
    }, [ textualDisplayEnabled, displayType ]);

    const save = () =>
    {
        const normalizedName = normalizePlaceholderName(placeholderName);
        const normalizedDelimiter = sanitizeDelimiter(delimiter) || ',';

        setStringParam(JSON.stringify({
            placeholderName: normalizedName,
            variableName,
            delimiter: normalizedDelimiter,
            arrayAddress,
            metadataVersion: 3
        }));
        setIntParams([
            normalizeVariableType(variableType),
            normalizeWiredSource(source, getSourceOptions(variableType)),
            textualDisplayEnabled ? normalizeDisplayType(displayType) : DISPLAY_NUMERIC,
            normalizePlaceholderType(placeholderType)
        ]);
    };

    const validate = () => !!placeholderName && !!variableName &&
        wiredArrayAddressIsValid(arrayAddress, selectedArray);
    const needsFurniSelection = variableType === WIRED_VARIABLE_FURNI ||
        (selectedArray && arrayAddress.indexMode === WIRED_REFERENCE_FROM_VARIABLE &&
            arrayAddress.indexVariableType === WIRED_VARIABLE_FURNI);

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ needsFurniSelection ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT : WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            hideFurniSelector={ variableType === WIRED_VARIABLE_FURNI }
            sourceSelectors={ sourceSelectors }
            alwaysExpandedSources={ true }
            validate={ validate }>
            <WiredParam titleKey="wiredfurni.params.texts.placeholder_name">
                <Column gap={ 1 }>
                    <WiredTextInput
                        type="text"
                        maxLength={ 40 }
                        value={ placeholderName }
                        onChange={ event => setPlaceholderName(normalizePlaceholderName(event.target.value)) } />
                    <WiredPlaceholderPreview placeholder={ previewToken } />
                </Column>
            </WiredParam>
            <WiredParam>
                <WiredVariablePicker
                    titleKey="wiredfurni.params.variables.variable_selection"
                    variableType={ variableType }
                    onVariableTypeChange={ type =>
                    {
                        const nextType = normalizeVariableType(type);

                        setVariableType(nextType);
                        setVariableName('');
                        setArrayAddress(createWiredArrayAddress());
                        setSource(current => normalizeWiredSource(current, getSourceOptions(nextType)));
                    } }
                    variableName={ variableName }
                    onVariableNameChange={ name =>
                    {
                        setVariableName(name);
                        setArrayAddress(normalizeWiredArrayAddress(
                            createWiredArrayAddress(),
                            wiredArrayDefinition(variableDefinitions, variableType, name),
                            includeClickedAvatarSource));
                    } }
                    variables={ variables }
                    subVariables={ subVariables }
                    variableSource={ source }
                    onVariableSourceChange={ setSource }
                    includeClickedAvatarSource={ includeClickedAvatarSource } />
            </WiredParam>
            <WiredArrayAddressEditor
                radioName="variablePlaceholderIndex"
                definition={ selectedArray }
                value={ arrayAddress }
                onChange={ setArrayAddress }
                variables={ scalarVariables }
                subVariables={ subVariables }
                includeClickedAvatarSource={ includeClickedAvatarSource } />
            <WiredParam titleKey="wiredfurni.params.texts.variable_display_type">
                <Column gap={ 1 }>
                    <WiredRadio name="variableDisplayType" checked={ displayType === DISPLAY_NUMERIC } onChange={ () => setDisplayType(DISPLAY_NUMERIC) } label={ LocalizeText('wiredfurni.params.texts.variable_display_type.1') } />
                    <WiredDisabled disabled={ !textualDisplayEnabled }>
                        <WiredRadio name="variableDisplayType" checked={ displayType === DISPLAY_TEXTUAL } onChange={ () => setDisplayType(DISPLAY_TEXTUAL) } label={ LocalizeText('wiredfurni.params.texts.variable_display_type.2') } />
                        <div className="nw-indent-1">
                            <WiredButtonInfoText>{ LocalizeText('wiredfurni.params.texts.variable_display_type.2.info') }</WiredButtonInfoText>
                        </div>
                    </WiredDisabled>
                </Column>
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.texts.placeholder_type" divider={ false }>
                <Column gap={ 1 }>
                    <WiredRadio
                        name="wiredVariablePlaceholderType"
                        checked={ placeholderType === TYPE_SINGLE }
                        onChange={ () => setPlaceholderType(TYPE_SINGLE) }
                        label={ LocalizeText('wiredfurni.params.texts.placeholder_type.1') } />
                    <WiredRadio
                        name="wiredVariablePlaceholderType"
                        checked={ placeholderType === TYPE_MULTIPLE }
                        onChange={ () => setPlaceholderType(TYPE_MULTIPLE) }
                        label={ LocalizeText('wiredfurni.params.texts.placeholder_type.2') } />
                    <WiredDisabled disabled={ !isMultiple } className="nw-indent-1">
                        <Flex alignItems="center" gap={ 1 }>
                            <WiredButtonInfoText>{ LocalizeText('wiredfurni.params.texts.select_delimiter') }</WiredButtonInfoText>
                            <WiredTextInput
                                type="text"
                                compact
                                maxLength={ 4 }
                                value={ delimiter }
                                onChange={ event => setDelimiter(sanitizeDelimiter(event.target.value)) } />
                        </Flex>
                    </WiredDisabled>
                </Column>
            </WiredParam>
        </WiredBaseView>
    );
}
