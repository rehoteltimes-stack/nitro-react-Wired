import { FC, ReactNode, useMemo, useState } from 'react';
import { HABBO_STYLES } from 'truffle-text';
import chestCoinIcon from '../../assets/images/wired/chest_coin.png';
import { GetRoomEngine, GetRoomSession, GetUserProfile } from '../../api';
import { DraggableWindow, LayoutAvatarImageView, LayoutPetImageView } from '../../common';
import { HabboBitmapView, HabboLayoutRuntimeProvider, measureHabboText, SkinRegistryView } from '../../common/habbo';
import { applyHabboXmlTextRendering, TruffleTextView } from '../../truffle';
import { ObjectLocationView } from '../room/widgets/object-location/ObjectLocationView';
import { HabboDropMenuOverlay, HabboInputOverlay, HabboLinkText, HabboScrollView, HabboTableRow, HabboTableText, HabboTableView } from './HabboCreatorControls';
import { WiredCreatorToolsArrayDefinition, WiredCreatorToolsArrayInspection, WiredCreatorToolsChestLogDetailItem, WiredCreatorToolsChestLogEntry, WiredCreatorToolsInspectionValues, WiredCreatorToolsRoomAction, WiredCreatorToolsRoomStats, WiredCreatorToolsVariableHighlight } from './WiredCreatorToolsMessages';
import { ErrorInfoViewView } from './layouts/ErrorInfoViewView';
import { LogsOverviewView } from './layouts/LogsOverviewView';
import { TransactionDetailsView } from './layouts/TransactionDetailsView';
import { TransactionOverviewView as VariableManagementOverviewView } from './layouts/TransactionOverviewView';
import { TransactionOverviewView as TransactionLogOverviewView } from './layouts/TransactionOverviewViewLog';
import { VariableValueInfoBubbleView } from './layouts/VariableValueInfoBubbleView';
import { WiredMenuViewView } from './layouts/WiredMenuViewView';
import { getWiredLocalization, hasWiredLocalization, resolveWiredCaption } from './localization/WiredLocalizations';

export type HabboWiredTab = 'monitor' | 'variables' | 'inspection' | 'chests' | 'settings';
export type HabboVariableType = 'furni' | 'user' | 'global' | 'context';
export type HabboInspectionType = 'furni' | 'user' | 'global';

export interface HabboMonitorStat
{
    key: string;
    label: string;
    value: string;
}

export interface HabboMonitorLog
{
    type: string;
    category: string;
    amount: number;
    latest: string;
    message: string;
    source: string;
    description?: string;
}

export interface HabboVariableDefinition
{
    key: string;
    type: 'Internal' | 'Created by user';
    target: 'Furni' | 'User' | 'Global' | 'Context';
    availability: string;
    hasValue: string;
    canWriteTo: string;
    canCreateDelete: string;
    canIntercept: string;
    isAlwaysAvailable: string;
    hasCreationTime: string;
    hasUpdateTime: string;
    isTextConnected: string;
    textValues?: { value: string; text: string; }[];
    arrayDefinition?: WiredCreatorToolsArrayDefinition;
}

export type HabboInspectionPreview =
    | { type: 'user'; id: number; name: string; figure: string; isPet?: boolean; }
    | { type: 'furni'; id: number; category: number; name: string; imageSrc: string; };

export interface HabboInspectionRow
{
    key: string;
    label: string;
    value: string;
    rawValue: string;
    editable: boolean;
}

interface LogsState
{
    filter: string;
    setFilter: (value: string) => void;
    source: string;
    setSource: (value: string) => void;
    level: string;
    setLevel: (value: string) => void;
    autoRefresh: boolean;
    setAutoRefresh: (value: boolean) => void;
    page: number;
    pageCount: number;
    setPage: (value: number | ((previous: number) => number)) => void;
}

interface TransactionLogsState
{
    filter: string;
    setFilter: (value: string) => void;
    type: string;
    setType: (value: string) => void;
    autoRefresh: boolean;
    setAutoRefresh: (value: boolean) => void;
    page: number;
    pageCount: number;
    setPage: (value: number | ((previous: number) => number)) => void;
}

export interface HabboWiredCreatorToolsViewProps
{
    visible: boolean;
    placementHidden: boolean;
    activeTab: HabboWiredTab;
    onTabChange: (tab: HabboWiredTab) => void;
    onClose: () => void;
    roomStats: WiredCreatorToolsRoomStats;
    monitorStats: HabboMonitorStat[];
    monitorLogs: HabboMonitorLog[];
    hasLogs: boolean;
    onClearLogs: () => void;
    onOpenLogs: () => void;
    variableType: HabboVariableType;
    onVariableTypeChange: (type: HabboVariableType) => void;
    variables: HabboVariableDefinition[];
    selectedVariable: HabboVariableDefinition;
    onSelectVariable: (type: HabboVariableType, key: string) => void;
    variableHighlight: WiredCreatorToolsVariableHighlight;
    onHighlightVariable: (type: HabboVariableType, key: string) => void;
    onClearVariableHighlight: () => void;
    inspectionType: HabboInspectionType;
    onInspectionTypeChange: (type: HabboInspectionType) => void;
    keepInspectionSelected: boolean;
    onKeepInspectionSelectedChange: (value: boolean) => void;
    inspectionPreview: HabboInspectionPreview;
    inspectionValues: WiredCreatorToolsInspectionValues;
    inspectionRows: HabboInspectionRow[];
    arrayDefinitions: WiredCreatorToolsArrayDefinition[];
    selectedArrayDefinition: WiredCreatorToolsArrayDefinition;
    arrayInspection: WiredCreatorToolsArrayInspection;
    onOpenArray: (name: string) => void;
    onCloseArray: () => void;
    onArrayPage: (page: number) => void;
    onSetArrayField: (index: number, fieldId: number, value: string) => void;
    pulseKeys: Record<string, number>;
    selectedInspectionVariable: string;
    onSelectInspectionVariable: (key: string) => void;
    onSetInspectionVariable: (key: string, value: string) => void;
    canRemoveInspectionVariable: boolean;
    onRemoveInspectionVariable: () => void;
    giveVariableOpen: boolean;
    onGiveVariableOpenChange: (value: boolean) => void;
    giveVariableName: string;
    onGiveVariableNameChange: (value: string) => void;
    giveVariableValue: string;
    onGiveVariableValueChange: (value: string) => void;
    onGiveInspectionVariable: () => void;
    chests: WiredCreatorToolsChestLogEntry[];
    onOpenChestLogs: () => void;
    onRefreshChestLogs: () => void;
    onSelectChestLog: (log: WiredCreatorToolsChestLogEntry) => void;
    onRoomAction: (action: WiredCreatorToolsRoomAction) => void;
    timezone: string;
    timezones: string[];
    onTimezoneChange: (timezone: string) => void;
    modifyPermissions: number;
    onModifyPermissionsChange: (permissions: number) => void;
    inspectPermissions: number;
    onInspectPermissionsChange: (permissions: number) => void;
    showToolbar: boolean;
    onShowToolbarChange: (value: boolean) => void;
    showInspectButton: boolean;
    onShowInspectButtonChange: (value: boolean) => void;
    playtestingMode: boolean;
    onPlaytestingModeChange: (value: boolean) => void;
    logsOpen: boolean;
    onCloseLogs: () => void;
    filteredLogs: HabboMonitorLog[];
    logsState: LogsState;
    chestLogsOpen: boolean;
    onCloseChestLogs: () => void;
    filteredChestLogs: WiredCreatorToolsChestLogEntry[];
    transactionLogsState: TransactionLogsState;
    selectedChestLog: WiredCreatorToolsChestLogEntry;
    onCloseChestLogDetails: () => void;
    variableHighlightPulse: number;
}

const WIRED_PERMISSION_EVERYONE = 1;
const WIRED_PERMISSION_RIGHTS = 2;
const WIRED_PERMISSION_GROUP_MEMBERS = 4;
const WIRED_PERMISSION_GROUP_ADMINS = 8;
const LOG_PAGE_SIZE = 50;
const TRANSACTION_PAGE_SIZE = 25;
const COLOR_RED = 'ff5733';
const COLOR_ORANGE = 'BD7800';
const COLOR_GREEN = '008000';

const colorize = (amount: number, limit: number, lowerThreshold: number, upperThreshold: number) =>
{
    const ratio = amount / limit;

    if(ratio < lowerThreshold) return COLOR_GREEN;
    if(ratio < upperThreshold) return COLOR_ORANGE;

    return COLOR_RED;
};

const formatTimestamp = (timestamp: string) =>
{
    if(!timestamp) return '-';

    const numeric = Number(timestamp);
    const date = Number.isFinite(numeric)
        ? new Date(numeric < 100000000000 ? numeric * 1000 : numeric)
        : new Date(timestamp);

    return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
};

const CHEST_LOG_TYPE_LABELS: Record<string, string> = {
    DEPOSIT: 'Deposit',
    WITHDRAW: 'Withdrawal',
    WITHDRAWAL: 'Withdrawal',
    TRANSFER: 'Transfer',
    MANUAL: 'Manual'
};

const chestLogTypeLabel = (type: string) =>
{
    const localizationKey = `wiredmenu.chests.transaction.type.${ type }`;

    if(hasWiredLocalization(localizationKey)) return getWiredLocalization(localizationKey);

    return CHEST_LOG_TYPE_LABELS[(type || '').toUpperCase()] ?? (type || getWiredLocalization('wiredmenu.chests.transaction.type.0'));
};
const formatChestAmount = (furni: number, coins: number) =>
{
    if(furni <= 0 && coins <= 0) return '-';
    if(furni > 0 && coins <= 0) return getWiredLocalization('wiredmenu.chests.room_logs.only_furni', { amount: furni });
    if(furni <= 0 && coins > 0) return getWiredLocalization('wiredmenu.chests.room_logs.only_coins', { amount: coins });

    return getWiredLocalization('wiredmenu.chests.room_logs.furni_and_coins', { amount: furni, amount2: coins });
};
const text = (value: string | number, bold = false) => <TruffleTextView text={ value } format={ bold ? 'u_bold' : 'u_regular' } />;

const HabboWindow: FC<{ uniqueKey: string; hidden?: boolean; children: ReactNode; }> = ({ uniqueKey, hidden = false, children }) => (
    <DraggableWindow
        uniqueKey={ uniqueKey }
        handleSelector=".habbo-layout-frame-drag-region"
        dragStyle={ hidden ? { display: 'none' } : undefined }>
        <div className={ `habbo-wired-window ${ hidden ? 'is-hidden' : '' }` }>{ children }</div>
    </DraggableWindow>
);

const ArrayValueCell: FC<{
    index: number;
    fieldId: number;
    value: string;
    connectedText?: string;
    editable: boolean;
    onSave: (index: number, fieldId: number, value: string) => void;
}> = ({ index, fieldId, value, connectedText, editable, onSave }) =>
{
    const [ editValue, setEditValue ] = useState<string>(null);
    const commit = () =>
    {
        if(editValue !== null && /^-?\d+$/.test(editValue)) onSave(index, fieldId, editValue);
        setEditValue(null);
    };

    if(editValue !== null)
    {
        return <input
            autoFocus
            className="habbo-wired-array-editor"
            value={ editValue }
            onChange={ event => setEditValue(event.target.value.replace(/[^0-9-]/g, '')) }
            onBlur={ commit }
            onClick={ event => event.stopPropagation() }
            onKeyDown={ event =>
            {
                event.stopPropagation();
                if(event.key === 'Enter') commit();
                if(event.key === 'Escape') setEditValue(null);
            } } />;
    }

    const displayValue = connectedText === undefined ? value : `${ value } (${ connectedText })`;

    return <button
        className="habbo-wired-array-value"
        type="button"
        title={ editable ? 'Double-click to edit' : undefined }
        onDoubleClick={ () => editable && setEditValue(value) }>
        { text(displayValue || '/') }
    </button>;
};

const ArrayInspectionWindow: FC<{
    definition: WiredCreatorToolsArrayDefinition;
    inspection: WiredCreatorToolsArrayInspection;
    onPage: (page: number) => void;
    onSave: (index: number, fieldId: number, value: string) => void;
    onClose: () => void;
}> = ({ definition, inspection, onPage, onSave, onClose }) =>
{
    const fields = (inspection?.definition?.fields ?? definition.fields)
        .slice()
        .sort((first, second) => first.order - second.order);
    const visibleFields = definition.arrayFormat === 0 ? fields.slice(0, 1) : fields;
    const columns = [
        { key: 'index', label: 'Index', width: .14 },
        ...visibleFields.map(field => ({
            key: `field-${ field.id }`,
            label: definition.arrayFormat === 0 ? 'Value' : field.name,
            width: .86 / Math.max(1, visibleFields.length)
        }))
    ];
    const rows: HabboTableRow[] = (inspection?.entries ?? []).map(entry => ({
        key: String(entry.index),
        cells: {
            index: entry.index,
            ...Object.fromEntries(visibleFields.map(field =>
            {
                const value = entry.values?.[String(field.id)] ?? '';
                const connectedText = entry.connectedText?.[String(field.id)];

                return [ `field-${ field.id }`, <ArrayValueCell
                    key={ field.id }
                    index={ entry.index }
                    fieldId={ field.id }
                    value={ value }
                    connectedText={ connectedText }
                    editable={ definition.writable }
                    onSave={ onSave } /> ];
            }))
        }
    }));
    const currentPage = inspection?.page ?? 0;
    const pageCount = Math.max(1, inspection?.pageCount ?? 1);

    return (
        <HabboWindow uniqueKey={ `wired-array-${ definition.variableType }-${ definition.name }` }>
            <HabboLayoutRuntimeProvider controller={ {
                appendedSlots: {
                    pagina_number_input: <HabboInputOverlay
                        ariaLabel="Array page"
                        inputMode="numeric"
                        value={ currentPage + 1 }
                        onChange={ value => onPage(Math.min(pageCount, Math.max(1, Number(value || 1))) - 1) } />,
                    header: (
                        <div className="habbo-wired-array-log-summary">
                            <div className="habbo-wired-array-log-stat">
                                { text('Length:', true) }
                                { text(inspection?.logicalLength ?? '/') }
                            </div>
                            <div className="habbo-wired-array-log-stat">
                                { text('Occupied:', true) }
                                { text(inspection?.occupiedCount ?? '/') }
                            </div>
                            <div className="habbo-wired-array-log-stat">
                                { text('Capacity:', true) }
                                { text(definition.maxEntries) }
                            </div>
                        </div>
                    )
                }
            } }>
                <TransactionLogOverviewView
                    captions={ {
                        list_type_key: 'Type:',
                        list_type_value: definition.arrayFormat === 1 ? 'Record array' : 'Simple array',
                        id_key: 'Name:',
                        id_value: definition.name,
                        pagina_number_input: String(currentPage + 1),
                        pagina_text_start: `${ inspection?.totalIndexes ?? 0 } indexes found. Showing page `,
                        pagina_text_end: `of ${ pageCount }`
                    } }
                    slots={ {
                        table_view: <HabboTableView
                            columns={ columns }
                            rows={ rows }
                            emptyText={ inspection ? 'This array has no entries.' : 'Loading...' } />
                    } }
                    resolveCaption={ value => value.includes('wiredchests.logs.title')
                        ? `Array: ${ definition.name }`
                        : resolveWiredCaption(value) }
                    onAction={ name =>
                    {
                        if(name === 'refresh_btn') onPage(currentPage);
                        if(name === 'first_page_btn') onPage(0);
                        if(name === 'prev_page_btn') onPage(Math.max(0, currentPage - 1));
                        if(name === 'next_page_btn') onPage(Math.min(pageCount - 1, currentPage + 1));
                        if(name === 'last_page_btn') onPage(pageCount - 1);
                    } }
                    onClose={ onClose } />
            </HabboLayoutRuntimeProvider>
        </HabboWindow>
    );
};

const permissionToggle = (value: number, bit: number, normalize: (value: number) => number, onChange: (value: number) => void) =>
{
    onChange(normalize((value & bit) === bit ? value & ~bit : value | bit));
};

const normalizeModify = (value: number) =>
{
    return value & (WIRED_PERMISSION_RIGHTS | WIRED_PERMISSION_GROUP_MEMBERS | WIRED_PERMISSION_GROUP_ADMINS);
};

const normalizeInspect = (value: number) =>
{
    return value & (WIRED_PERMISSION_EVERYONE | WIRED_PERMISSION_RIGHTS | WIRED_PERMISSION_GROUP_MEMBERS | WIRED_PERMISSION_GROUP_ADMINS);
};

const VariableManagementWindow: FC<{
    variable: HabboVariableDefinition;
    onClose: () => void;
}> = ({ variable, onClose }) =>
{
    const [ userType, setUserType ] = useState('all');
    const [ sortType, setSortType ] = useState('0');
    const [ page, setPage ] = useState(1);

    return (
        <HabboWindow uniqueKey="wired-variable-management">
            <HabboLayoutRuntimeProvider controller={ {
                appendedSlots: {
                    user_type_menu: <HabboDropMenuOverlay
                        ariaLabel="Variable holder type"
                        value={ userType }
                        options={ [
                            { value: 'all', label: getWiredLocalization('wiredmenu.variable_management.usertype.all') },
                            { value: '1', label: getWiredLocalization('wiredmenu.variable_management.usertype.1') },
                            { value: '2', label: getWiredLocalization('wiredmenu.variable_management.usertype.2') },
                            { value: '4', label: getWiredLocalization('wiredmenu.variable_management.usertype.4') }
                        ] }
                        onChange={ setUserType } />,
                    sort_type_menu: <HabboDropMenuOverlay
                        ariaLabel="Variable holder sort"
                        value={ sortType }
                        options={ [
                            { value: '0', label: getWiredLocalization('wiredmenu.variable_management.sort_by.0') },
                            { value: '1', label: getWiredLocalization('wiredmenu.variable_management.sort_by.1') },
                            { value: '2', label: getWiredLocalization('wiredmenu.variable_management.sort_by.2') },
                            { value: '3', label: getWiredLocalization('wiredmenu.variable_management.sort_by.3') },
                            { value: '4', label: getWiredLocalization('wiredmenu.variable_management.sort_by.4') },
                            { value: '5', label: getWiredLocalization('wiredmenu.variable_management.sort_by.5') }
                        ] }
                        onChange={ setSortType } />,
                    pagina_number_input: <HabboInputOverlay ariaLabel="Variable management page" inputMode="numeric" value={ page } onChange={ value => setPage(Math.max(1, Number(value || 1))) } />
                }
            } }>
                <VariableManagementOverviewView
                    captions={ {
                        variable_name_value: variable?.key || '-',
                        user_type_menu: getWiredLocalization(`wiredmenu.variable_management.usertype.${ userType }`),
                        sort_type_menu: getWiredLocalization(`wiredmenu.variable_management.sort_by.${ sortType }`),
                        pagina_number_input: String(page),
                        pagina_text_start: '0 entries found. Showing page ',
                        pagina_text_end: 'of 1'
                    } }
                    slots={ {
                        table_view: <HabboTableView
                            columns={ [
                                { key: 'type', label: getWiredLocalization('wiredmenu.variable_management.col.usertype'), width: .1 },
                                { key: 'name', label: getWiredLocalization('wiredmenu.variable_management.col.name'), width: .18 },
                                { key: 'created', label: getWiredLocalization('wiredmenu.variable_management.col.creation_time'), width: .21 },
                                { key: 'updated', label: getWiredLocalization('wiredmenu.variable_management.col.last_update_time'), width: .21 },
                                { key: 'value', label: getWiredLocalization('wiredmenu.variable_management.col.value'), width: .18 },
                                { key: 'manage', label: getWiredLocalization('wiredmenu.variable_management.col.manage'), width: .12 }
                            ] }
                            rows={ [] }
                            emptyText="No holder data is available for this room." />
                    } }
                    resolveCaption={ resolveWiredCaption }
                    onAction={ name =>
                    {
                        if(name === 'first_page_btn' || name === 'prev_page_btn') setPage(1);
                        if(name === 'next_page_btn' || name === 'last_page_btn') setPage(1);
                    } }
                    onClose={ onClose } />
            </HabboLayoutRuntimeProvider>
        </HabboWindow>
    );
};

const ERROR_INFO_TEXT_FORMAT = applyHabboXmlTextRendering({
    ...HABBO_STYLES.il_regular,
    letterSpacing: 0,
    leading: 0
});

const ErrorInfoWindow: FC<{ log: HabboMonitorLog; onClose: () => void; }> = ({ log, onClose }) =>
{
    const errorIndex = [ 'EXECUTION_CAP', 'DELAYED_EVENTS_CAP', 'EXECUTOR_OVERLOAD', 'MARKED_AS_HEAVY', 'KILLED', 'RECURSION_TIMEOUT', 'TOO_MANY_VARIABLES' ].indexOf(log.type);
    const errorText = errorIndex >= 0 ? getWiredLocalization(`wiredmenu.error_info.${ errorIndex }`) : (log.description || log.message);
    const errorTextHeight = Math.max(50, measureHabboText(errorText, ERROR_INFO_TEXT_FORMAT, 319)?.textHeight || 0);
    const contentsHeight = Math.max(100, 46 + errorTextHeight);

    return (
        <HabboWindow uniqueKey="wired-error-info">
            <HabboLayoutRuntimeProvider controller={ { rootSize: { width: 337, height: contentsHeight + 48 } } }>
                <ErrorInfoViewView
                    captions={ {
                        error_name: log.type,
                        error_text: errorText
                    } }
                    slots={ {
                        type_icon: <HabboBitmapView
                            assetName={ `icon_wired_${ log.category.toLowerCase() === 'warn' ? 'warning' : log.category.toLowerCase() }_png` }
                            alt={ log.category }
                            stretchedX={ false }
                            stretchedY={ false }
                            pivotPoint="center" />
                    } }
                    resolveCaption={ resolveWiredCaption }
                    onClose={ onClose } />
            </HabboLayoutRuntimeProvider>
        </HabboWindow>
    );
};

const InspectionPreview: FC<{ type: HabboInspectionType; preview: HabboInspectionPreview; }> = ({ type, preview }) =>
{
    if(type === 'global') return null;
    if(!preview || preview.type !== type) return <div className="habbo-wired-preview-instruction">{ text(getWiredLocalization(`wiredmenu.inspection.preview_${ type }_instruction`)) }</div>;

    if(preview.type === 'user')
    {
        return (
            <div className="habbo-wired-inspection-preview" title={ preview.name }>
                { preview.isPet
                    ? <LayoutPetImageView figure={ preview.figure } direction={ 4 } />
                    : <LayoutAvatarImageView figure={ preview.figure } direction={ 4 } /> }
            </div>
        );
    }

    return (
        <div className="habbo-wired-inspection-preview" title={ preview.name }>
            { preview.imageSrc && <img src={ preview.imageSrc } alt="" /> }
        </div>
    );
};

const TransactionItems: FC<{ coins: number; items: WiredCreatorToolsChestLogDetailItem[]; }> = ({ coins, items }) => (
    <HabboScrollView className="habbo-wired-transaction-items-scroll" contentKey={ `${ coins }-${ items.length }` } step={ 59 }>
        <div className="habbo-wired-transaction-items">
            { coins > 0 &&
                <div className="habbo-wired-transaction-item habbo-wired-coin-item" title="Credits">
                    <img src={ chestCoinIcon } alt="" />
                    <span className="habbo-wired-transaction-quantity">{ text(`x${ coins }`, true) }</span>
                </div> }
            { items.map((item, index) =>
            {
                const icon = (item.productType || '').toLowerCase() === 'wall'
                    ? GetRoomEngine().getFurnitureWallIconUrl(item.spriteId, item.extraData)
                    : GetRoomEngine().getFurnitureFloorIconUrl(item.spriteId);

                return (
                    <div key={ `${ item.furniCode }-${ item.spriteId }-${ item.extraData }-${ index }` } className="habbo-wired-transaction-item" title={ item.name || item.furniCode }>
                        <img src={ icon } alt="" />
                        <span className="habbo-wired-transaction-quantity">{ text(`x${ item.amount }`, true) }</span>
                    </div>
                );
            }) }
            { coins <= 0 && !items.length && text(getWiredLocalization('wiredmenu.table.empty')) }
        </div>
    </HabboScrollView>
);

const MetaPair: FC<{ label: string; value: ReactNode; }> = ({ label, value }) => (
    <div className="habbo-wired-meta-pair">
        <span>{ text(label, true) }</span>
        <span>{ typeof value === 'string' || typeof value === 'number' ? text(value) : value }</span>
    </div>
);

const TransactionDetailsWindow: FC<{ log: WiredCreatorToolsChestLogEntry; onClose: () => void; }> = ({ log, onClose }) => (
    <HabboWindow uniqueKey="wired-transaction-details">
        <TransactionDetailsView
            visibility={ {
                extra_container: false,
                extra_pair: false,
                extra_info_button: false,
                extra_info_bubble: false
            } }
            slots={ {
                transaction_type_pair: <MetaPair label="Transaction type:" value={ chestLogTypeLabel(log.type) } />,
                timestamp_pair: <MetaPair label="Timestamp:" value={ formatTimestamp(log.timestamp) } />,
                room_id_pair: <MetaPair label="Room ID:" value={ String(GetRoomSession()?.roomId ?? '-') } />,
                chest_ids_pair: <MetaPair label="Chest IDs:" value="-" />,
                username_pair: <MetaPair label="Username:" value={
                    <HabboLinkText onClick={ () => log.userId > 0 && GetUserProfile(log.userId) }>{ log.username || '/' }</HabboLinkText>
                } />,
                '0.0.7.0.0.1.0': <TransactionItems coins={ log.withdrawalCoins } items={ log.details?.withdrawals ?? [] } />,
                '0.0.7.0.1.1.0': <TransactionItems coins={ log.depositCoins } items={ log.details?.deposits ?? [] } />
            } as never }
            resolveCaption={ resolveWiredCaption }
            onClose={ onClose } />
    </HabboWindow>
);

const LogsWindow: FC<{
    rows: HabboMonitorLog[];
    state: LogsState;
    onClose: () => void;
}> = ({ rows, state, onClose }) =>
{
    const pageRows = rows.slice((state.page - 1) * LOG_PAGE_SIZE, state.page * LOG_PAGE_SIZE);
    const tableRows = pageRows.map((row, index): HabboTableRow => ({
        key: `${ row.latest }-${ row.type }-${ index }`,
        cells: {
            timestamp: row.latest,
            source: row.source,
            level: row.category,
            message: row.message
        }
    }));

    return (
        <HabboWindow uniqueKey="wired-room-logs">
            <HabboLayoutRuntimeProvider controller={ {
                selected: { auto_refresh_cbx: state.autoRefresh },
                appendedSlots: {
                    filter_input: <HabboInputOverlay ariaLabel="Filter wired logs" inputMode="search" value={ state.filter } onChange={ state.setFilter } />,
                    log_source_menu: <HabboDropMenuOverlay
                        ariaLabel="Log source"
                        value={ state.source }
                        options={ [
                            { value: 'All', label: getWiredLocalization('wiredmenu.logs_overview.log_source.all') },
                            { value: 'System', label: getWiredLocalization('wiredmenu.logs_overview.log_source.0') },
                            { value: 'Wired', label: getWiredLocalization('wiredmenu.logs_overview.log_source.1') }
                        ] }
                        onChange={ state.setSource } />,
                    log_level_menu: <HabboDropMenuOverlay
                        ariaLabel="Log level"
                        value={ state.level }
                        options={ [
                            { value: 'All', label: getWiredLocalization('wiredmenu.logs_overview.log_level.all') },
                            ...[ 0, 1, 2, 3 ].map(index =>
                            {
                                const label = getWiredLocalization(`wiredmenu.logs_overview.log_level.${ index }`);

                                return { value: label, label };
                            })
                        ] }
                        onChange={ state.setLevel } />,
                    pagina_number_input: <HabboInputOverlay ariaLabel="Wired logs page" inputMode="numeric" value={ state.page } onChange={ value => state.setPage(Math.min(state.pageCount, Math.max(1, Number(value || 1)))) } />
                }
            } }>
                <LogsOverviewView
                    captions={ {
                        filter_input: state.filter,
                        log_source_menu: state.source,
                        log_level_menu: state.level,
                        pagina_number_input: String(state.page),
                        pagina_text_start: `${ rows.length } log entries found. Showing page `,
                        pagina_text_end: `of ${ state.pageCount }`
                    } }
                    slots={ {
                        table_view: <HabboTableView
                            columns={ [
                                { key: 'timestamp', label: getWiredLocalization('wiredmenu.logs_overview.col.timestamp'), width: .2 },
                                { key: 'source', label: getWiredLocalization('wiredmenu.logs_overview.col.source'), width: .08 },
                                { key: 'level', label: getWiredLocalization('wiredmenu.logs_overview.col.level'), width: .08 },
                                { key: 'message', label: getWiredLocalization('wiredmenu.logs_overview.col.message'), width: .64 }
                            ] }
                            rows={ tableRows }
                            emptyText="No logs found for the current filters." />
                    } }
                    resolveCaption={ resolveWiredCaption }
                    onAction={ name =>
                    {
                        if(name === 'auto_refresh_cbx') state.setAutoRefresh(!state.autoRefresh);
                        if(name === 'first_page_btn') state.setPage(1);
                        if(name === 'prev_page_btn') state.setPage(page => Math.max(1, page - 1));
                        if(name === 'next_page_btn') state.setPage(page => Math.min(state.pageCount, page + 1));
                        if(name === 'last_page_btn') state.setPage(state.pageCount);
                    } }
                    onClose={ onClose } />
            </HabboLayoutRuntimeProvider>
        </HabboWindow>
    );
};

const TransactionLogsWindow: FC<{
    rows: WiredCreatorToolsChestLogEntry[];
    allRows: WiredCreatorToolsChestLogEntry[];
    state: TransactionLogsState;
    onSelect: (log: WiredCreatorToolsChestLogEntry) => void;
    onRefresh: () => void;
    onClose: () => void;
}> = ({ rows, allRows, state, onSelect, onRefresh, onClose }) =>
{
    const pageRows = rows.slice((state.page - 1) * TRANSACTION_PAGE_SIZE, state.page * TRANSACTION_PAGE_SIZE);
    const typeOptions = [ 'All', ...Array.from(new Set(allRows.map(log => (log.type || '').toUpperCase()).filter(Boolean))) ]
        .map(value => ({ value, label: value === 'All' ? value : chestLogTypeLabel(value) }));
    const tableRows = pageRows.map((log, index): HabboTableRow => ({
        key: `${ log.timestamp }-${ log.userId }-${ index }`,
        onClick: () => onSelect(log),
        cells: {
            type: chestLogTypeLabel(log.type),
            timestamp: formatTimestamp(log.timestamp),
            user: <HabboLinkText onClick={ () => log.userId > 0 && GetUserProfile(log.userId) }>{ log.username || '/' }</HabboLinkText>,
            withdrawals: formatChestAmount(log.withdrawalFurni, log.withdrawalCoins),
            deposits: formatChestAmount(log.depositFurni, log.depositCoins),
            chests: log.chestCount
        }
    }));

    return (
        <HabboWindow uniqueKey="wired-transaction-logs">
            <HabboLayoutRuntimeProvider controller={ {
                appendedSlots: {
                    pagina_number_input: <HabboInputOverlay ariaLabel="Transaction logs page" inputMode="numeric" value={ state.page } onChange={ value => state.setPage(Math.min(state.pageCount, Math.max(1, Number(value || 1)))) } />,
                    header: (
                        <div className="habbo-wired-custom-transaction-filters">
                            <div className="habbo-wired-filter-field">
                                <span className="habbo-wired-filter-value">{ text(state.filter || 'Search') }</span>
                                <HabboInputOverlay ariaLabel="Search transactions" inputMode="search" value={ state.filter } onChange={ state.setFilter } />
                            </div>
                            <div className="habbo-wired-filter-field habbo-wired-filter-type">
                                <span className="habbo-wired-filter-value">{ text(typeOptions.find(option => option.value === state.type)?.label || 'All') }</span>
                                <HabboDropMenuOverlay ariaLabel="Transaction type" value={ state.type } options={ typeOptions } onChange={ state.setType } />
                            </div>
                        </div>
                    )
                }
            } }>
                <TransactionLogOverviewView
                    captions={ {
                        list_type_value: 'Room',
                        id_value: String(GetRoomSession()?.roomId ?? '-'),
                        pagina_number_input: String(state.page),
                        pagina_text_start: `${ rows.length } transactions found. Showing page `,
                        pagina_text_end: `of ${ state.pageCount }`
                    } }
                    slots={ {
                        table_view: <HabboTableView
                            columns={ [
                                { key: 'type', label: 'Type', width: .17 },
                                { key: 'timestamp', label: 'Timestamp', width: .15 },
                                { key: 'user', label: 'Username', width: .14 },
                                { key: 'withdrawals', label: 'Withdraws', width: .14 },
                                { key: 'deposits', label: 'Deposits', width: .14 },
                                { key: 'chests', label: 'Chests', width: .12 }
                            ] }
                            rows={ tableRows }
                            emptyText="No chest logs found for the current filters." />
                    } }
                    resolveCaption={ resolveWiredCaption }
                    onAction={ name =>
                    {
                        if(name === 'refresh_btn')
                        {
                            state.setPage(1);
                            onRefresh();
                        }
                        if(name === 'first_page_btn') state.setPage(1);
                        if(name === 'prev_page_btn') state.setPage(page => Math.max(1, page - 1));
                        if(name === 'next_page_btn') state.setPage(page => Math.min(state.pageCount, page + 1));
                        if(name === 'last_page_btn') state.setPage(state.pageCount);
                    } }
                    onClose={ onClose } />
            </HabboLayoutRuntimeProvider>
        </HabboWindow>
    );
};

export const HabboWiredCreatorToolsView: FC<HabboWiredCreatorToolsViewProps> = props =>
{
    const [ selectedError, setSelectedError ] = useState<HabboMonitorLog>(null);
    const [ variableManagementOpen, setVariableManagementOpen ] = useState(false);
    const [ editVariable, setEditVariable ] = useState<{ key: string; value: string; }>(null);
    const currentVariableHighlight = props.variableHighlight?.sourceType === props.variableType
        && props.variableHighlight.variableName === props.selectedVariable?.key;
    const canHighlightVariable = props.selectedVariable?.type === 'Created by user'
        && !props.selectedVariable.arrayDefinition
        && (props.variableType === 'furni' || props.variableType === 'user');
    const hasMonitorAlert = !!props.roomStats && (
        props.roomStats.isHeavy
        || props.roomStats.wiredUsage >= props.roomStats.wiredUsageLimit
        || props.roomStats.floorFurni >= props.roomStats.floorFurniLimit
        || props.roomStats.wallFurni >= props.roomStats.wallFurniLimit
        || props.monitorLogs.some(log => log.amount > 0));
    const variableProperties: Array<[string, string]> = props.selectedVariable
        ? [
            [ getWiredLocalization('wiredmenu.variable_overview.properties.name'), props.selectedVariable.key ],
            [ getWiredLocalization('wiredmenu.variable_overview.properties.type'), props.selectedVariable.type ],
            [ getWiredLocalization('wiredmenu.variable_overview.properties.target'), props.selectedVariable.target ],
            [ getWiredLocalization('wiredmenu.variable_overview.properties.availability'), props.selectedVariable.availability ],
            [ getWiredLocalization('wiredmenu.variable_overview.properties.has_value'), props.selectedVariable.hasValue ],
            [ getWiredLocalization('wiredmenu.variable_overview.properties.can_write_to'), props.selectedVariable.canWriteTo ],
            [ getWiredLocalization('wiredmenu.variable_overview.properties.can_create_delete'), props.selectedVariable.canCreateDelete ],
            [ getWiredLocalization('wiredmenu.variable_overview.properties.can_intercept'), props.selectedVariable.canIntercept ],
            [ getWiredLocalization('wiredmenu.variable_overview.properties.is_always_available'), props.selectedVariable.isAlwaysAvailable ],
            [ getWiredLocalization('wiredmenu.variable_overview.properties.can_read_creation_time'), props.selectedVariable.hasCreationTime ],
            [ getWiredLocalization('wiredmenu.variable_overview.properties.can_read_last_update_time'), props.selectedVariable.hasUpdateTime ],
            [ getWiredLocalization('wiredmenu.variable_overview.properties.is_text_connected'), props.selectedVariable.isTextConnected ]
        ]
        : [];
    const selectedArray = props.selectedVariable?.arrayDefinition;

    if(selectedArray)
    {
        variableProperties.splice(4, 0,
            [ 'Shape', 'Array' ],
            [ 'Format', selectedArray.arrayFormat === 1 ? 'Record' : 'Simple' ],
            [ 'Mode', selectedArray.arrayMode === 1 ? 'Slots' : 'List' ],
            [ 'Capacity', String(selectedArray.maxEntries) ],
            [ 'Schema version', String(selectedArray.schemaVersion) ],
            [ 'Referenced', selectedArray.referenced ? 'Yes' : 'No' ],
            [ 'Inspectable', selectedArray.inspectable ? 'Yes' : 'No' ],
            [ 'Fields', selectedArray.fields
                .slice()
                .sort((first, second) => first.order - second.order)
                .map(field => field.name)
                .join(', ') || '/' ]);
    }
    const roomTotals = useMemo(() => props.chests.reduce((totals, log) =>
    {
        totals.withdrawalFurni += log.withdrawalFurni;
        totals.withdrawalCoins += log.withdrawalCoins;
        totals.depositFurni += log.depositFurni;
        totals.depositCoins += log.depositCoins;

        return totals;
    }, { withdrawalFurni: 0, withdrawalCoins: 0, depositFurni: 0, depositCoins: 0 }), [ props.chests ]);
    const typeOptions = [
        { key: 'furni', name: 'type_furni_button' },
        { key: 'user', name: 'type_user_button' },
        { key: 'global', name: 'type_global_button' },
        { key: 'context', name: 'type_context_button' }
    ] as const;
    const inspectionTypeOptions = [
        { key: 'furni', name: 'type_furni_button' },
        { key: 'user', name: 'type_user_button' },
        { key: 'global', name: 'type_global_button' }
    ] as const;
    const giveOptions = (props.inspectionValues?.variables ?? []).map(variable => ({
        value: variable,
        label: Object.prototype.hasOwnProperty.call(props.inspectionValues?.values ?? {}, variable) ? `${ variable } (already given)` : variable,
        disabled: Object.prototype.hasOwnProperty.call(props.inspectionValues?.values ?? {}, variable)
    }));
    const canGiveVariable = props.inspectionType !== 'global' && !!props.inspectionValues && giveOptions.length > 0;
    const canCreateGivenVariable = !!props.giveVariableName && !Object.prototype.hasOwnProperty.call(props.inspectionValues?.values ?? {}, props.giveVariableName);
    const monitorRows = props.monitorLogs.map((log, index): HabboTableRow => ({
        key: `${ log.type }-${ index }`,
        cells: { type: <HabboLinkText onClick={ () => setSelectedError(log) }>{ log.type }</HabboLinkText>, category: log.category, amount: log.amount, latest: log.latest }
    }));
    const variableRows = props.variables.map(variable => ({
        key: variable.key,
        selected: variable.key === props.selectedVariable?.key,
        onClick: () => props.onSelectVariable(props.variableType, variable.key),
        cells: { variable: variable.key }
    }));
    const scalarInspectionRows = props.inspectionRows.map(row => ({
        key: row.key,
        pulseToken: props.pulseKeys[row.key],
        selected: row.key === props.selectedInspectionVariable,
        onClick: () => props.onSelectInspectionVariable(row.key),
        cells: {
            variable: row.label,
            value: editVariable?.key === row.key
                ? <input
                    autoFocus
                    className="habbo-wired-value-editor"
                    value={ editVariable.value }
                    onChange={ event => setEditVariable({ key: row.key, value: event.target.value.replace(/[^0-9-]/g, '') }) }
                    onBlur={ () =>
                    {
                        props.onSetInspectionVariable(row.key, editVariable.value);
                        setEditVariable(null);
                    } }
                    onClick={ event => event.stopPropagation() }
                    onKeyDown={ event =>
                    {
                        event.stopPropagation();
                        if(event.key === 'Enter')
                        {
                            props.onSetInspectionVariable(row.key, editVariable.value);
                            setEditVariable(null);
                        }
                        if(event.key === 'Escape') setEditVariable(null);
                    } } />
                : <button
                    className="habbo-wired-value-button"
                    type="button"
                    onDoubleClick={ event =>
                    {
                        event.stopPropagation();
                        if(row.editable) setEditVariable({ key: row.key, value: row.rawValue });
                    } }>
                    { text(row.value) }
                </button>
        }
        }));
    const createdInspectionRows = scalarInspectionRows.filter(row => !row.key.startsWith('@'));
    const internalInspectionRows = scalarInspectionRows.filter(row => row.key.startsWith('@'));
    const viewArrayTextWidth = Math.ceil(measureHabboText('View Array', 'u_regular')?.textWidth || 48) + 8;
    const arrayInspectionRows = props.arrayDefinitions
        .slice()
        .sort((first, second) => first.name.localeCompare(second.name))
        .map(definition => ({
            key: `array:${ definition.name }`,
            cells: {
                variable: definition.name,
                value: <button
                    className="habbo-wired-table-value-link"
                    style={ { width: viewArrayTextWidth } }
                    type="button"
                    onClick={ event =>
                    {
                        event.stopPropagation();
                        props.onOpenArray(definition.name);
                    } }>
                    <HabboTableText value="View Array" format="u_regular" />
                </button>
            }
        }));
    const inspectionRows = [ ...createdInspectionRows, ...arrayInspectionRows, ...internalInspectionRows ];
    const chestSummaryRows = props.chests.slice(0, 10).map((log, index): HabboTableRow => ({
        key: `${ log.timestamp }-${ log.userId }-${ index }`,
        cells: {
            type: chestLogTypeLabel(log.type),
            user: <HabboLinkText onClick={ () => log.userId > 0 && GetUserProfile(log.userId) }>{ log.username || '/' }</HabboLinkText>,
            withdrawals: formatChestAmount(log.withdrawalFurni, log.withdrawalCoins),
            deposits: formatChestAmount(log.depositFurni, log.depositCoins)
        }
    }));
    const selected: Record<string, boolean> = {
        top_view_monitor_button: props.activeTab === 'monitor',
        top_view_variable_overview_button: props.activeTab === 'variables',
        top_view_inspection_button: props.activeTab === 'inspection',
        top_view_chests_button: props.activeTab === 'chests',
        top_view_settings_button: props.activeTab === 'settings',
        pin_checkbox: props.keepInspectionSelected,
        preference_toolbar_checkbox: props.showToolbar,
        preference_inspect_button_checkbox: props.showInspectButton,
        preference_playtest_checkbox: props.playtestingMode,
        modify_1_checkbox: !!(props.modifyPermissions & WIRED_PERMISSION_RIGHTS),
        modify_2_checkbox: !!(props.modifyPermissions & WIRED_PERMISSION_GROUP_MEMBERS),
        modify_3_checkbox: !!(props.modifyPermissions & (WIRED_PERMISSION_GROUP_MEMBERS | WIRED_PERMISSION_GROUP_ADMINS)),
        read_0_checkbox: !!(props.inspectPermissions & WIRED_PERMISSION_EVERYONE),
        read_1_checkbox: !!(props.inspectPermissions & (WIRED_PERMISSION_EVERYONE | WIRED_PERMISSION_RIGHTS))
            || !!(props.modifyPermissions & WIRED_PERMISSION_RIGHTS),
        read_2_checkbox: !!(props.inspectPermissions & (WIRED_PERMISSION_EVERYONE | WIRED_PERMISSION_GROUP_MEMBERS))
            || !!(props.modifyPermissions & WIRED_PERMISSION_GROUP_MEMBERS),
        read_3_checkbox: !!(props.inspectPermissions & (WIRED_PERMISSION_EVERYONE | WIRED_PERMISSION_GROUP_MEMBERS | WIRED_PERMISSION_GROUP_ADMINS))
            || !!(props.modifyPermissions & (WIRED_PERMISSION_GROUP_MEMBERS | WIRED_PERMISSION_GROUP_ADMINS))
    };

    typeOptions.forEach(option =>
    {
        selected[option.name] = props.activeTab === 'inspection'
            ? option.key !== 'context' && props.inspectionType === option.key
            : props.variableType === option.key;
    });

    const visibility = {
        monitor_container: props.activeTab === 'monitor',
        variable_overview_container: props.activeTab === 'variables',
        inspection_container: props.activeTab === 'inspection',
        chests_container: props.activeTab === 'chests',
        settings_container: props.activeTab === 'settings',
        info_container: false,
        top_view_info_button: false,
        monitor_image_1: hasMonitorAlert,
        monitor_image_2: !hasMonitorAlert,
        create_var_bubble: props.giveVariableOpen && canGiveVariable,
        preview_avatar: false,
        preview_pet: false,
        preview_image_bitmap: false,
        preview_instruction_furni: false,
        preview_instruction_user: false,
        global_placeholder: props.inspectionType === 'global',
        wired_style_border: false,
        wored_style_container: false,
        '0.2.4.1.1.0.4': false
    };
    const canManageVariable = props.selectedVariable?.type === 'Created by user'
        && props.selectedVariable.target === 'User'
        && props.selectedVariable.availability.toLowerCase().includes('permanent');
    const enabled = {
        clear_log_btn: props.hasLogs,
        highlight_holders_button: canHighlightVariable,
        manage_button: canManageVariable,
        delete_var_btn: props.canRemoveInspectionVariable,
        add_var_btn: canGiveVariable,
        create_var_btn: canCreateGivenVariable,
        lock_all_button: !!GetRoomSession()?.isRoomOwner,
        modify_3_checkbox: !(props.modifyPermissions & WIRED_PERMISSION_GROUP_MEMBERS),
        read_1_checkbox: !(props.inspectPermissions & WIRED_PERMISSION_EVERYONE) && !(props.modifyPermissions & WIRED_PERMISSION_RIGHTS),
        read_2_checkbox: !(props.inspectPermissions & WIRED_PERMISSION_EVERYONE) && !(props.modifyPermissions & WIRED_PERMISSION_GROUP_MEMBERS),
        read_3_checkbox: !(props.inspectPermissions & WIRED_PERMISSION_EVERYONE)
            && !(props.inspectPermissions & WIRED_PERMISSION_GROUP_MEMBERS)
            && !(props.modifyPermissions & (WIRED_PERMISSION_GROUP_MEMBERS | WIRED_PERMISSION_GROUP_ADMINS))
    };

    return (
        <>
            <HabboWindow uniqueKey="wired-creator-tools-habbo" hidden={ !props.visible || props.placementHidden }>
                <HabboLayoutRuntimeProvider controller={ {
                    geometryOverrides: {
                        top_view_monitor_button: { x: 0, width: 100 },
                        top_view_variable_overview_button: { x: 100, width: 100 },
                        top_view_inspection_button: { x: 200, width: 100 },
                        top_view_chests_button: { x: 300, width: 100 },
                        top_view_settings_button: { x: 400, width: 100 }
                    },
                    selected,
                    enabled,
                    textColors: {
                        clear_log_btn: 0xFFFFFF,
                        roll_back_btn: 0xFFFFFF
                    },
                    appendedSlots: {
                        preview_border: props.inspectionType !== 'global'
                            ? <div className="habbo-wired-preview-surface">
                                <InspectionPreview type={ props.inspectionType } preview={ props.inspectionPreview } />
                            </div>
                            : undefined,
                        timezone_picker: <HabboDropMenuOverlay
                            ariaLabel="Room timezone"
                            value={ props.timezone }
                            options={ props.timezones.map(value => ({ value, label: value })) }
                            onChange={ props.onTimezoneChange } />,
                        value_input: <HabboInputOverlay
                            ariaLabel="Variable value"
                            inputMode="numeric"
                            value={ props.giveVariableValue }
                            onChange={ value => props.onGiveVariableValueChange(value.replace(/[^0-9-]/g, '')) } />,
                        chest_controls_container: (
                            <div className="habbo-wired-room-totals" title="Room Totals">
                                <div className="habbo-wired-room-total">{ text('Transactions', true) }{ text(props.chests.length) }</div>
                                <div className="habbo-wired-room-total">{ text('Withdrawn', true) }{ text(formatChestAmount(roomTotals.withdrawalFurni, roomTotals.withdrawalCoins)) }</div>
                                <div className="habbo-wired-room-total">{ text('Deposited', true) }{ text(formatChestAmount(roomTotals.depositFurni, roomTotals.depositCoins)) }</div>
                            </div>
                        )
                    }
                } }>
                    <WiredMenuViewView
                        visibility={ visibility as never }
                        captions={ {
                            header_title: ({
                                monitor: getWiredLocalization('wiredmenu.monitor.title'),
                                variables: getWiredLocalization('wiredmenu.variable_overview.title'),
                                inspection: getWiredLocalization('wiredmenu.inspection.title'),
                                chests: getWiredLocalization('wiredmenu.chests.title'),
                                settings: getWiredLocalization('wiredmenu.settings.title')
                            })[props.activeTab],
                            statistics_usage_html: getWiredLocalization('wiredmenu.monitor.statistics.usage', {
                                color: colorize(props.roomStats?.wiredUsage ?? 0, props.roomStats?.wiredUsageLimit ?? 0, .3, .7),
                                amount: props.roomStats?.wiredUsage ?? 0,
                                limit: props.roomStats?.wiredUsageLimit ?? 0
                            }),
                            statistics_heavy_html: getWiredLocalization('wiredmenu.monitor.statistics.is_heavy', {
                                color: props.roomStats?.isHeavy ? COLOR_ORANGE : COLOR_GREEN,
                                bool: getWiredLocalization(props.roomStats?.isHeavy ? 'wiredmenu.bool.yes' : 'wiredmenu.bool.no')
                            }),
                            statistics_floorfurni_html: getWiredLocalization('wiredmenu.monitor.statistics.floorfurni', {
                                color: colorize(props.roomStats?.floorFurni ?? 0, props.roomStats?.floorFurniLimit ?? 0, .6, .85),
                                amount: props.roomStats?.floorFurni ?? 0,
                                limit: props.roomStats?.floorFurniLimit ?? 0
                            }),
                            statistics_wallfurni_html: getWiredLocalization('wiredmenu.monitor.statistics.wallfurni', {
                                color: colorize(props.roomStats?.wallFurni ?? 0, props.roomStats?.wallFurniLimit ?? 0, .6, .85),
                                amount: props.roomStats?.wallFurni ?? 0,
                                limit: props.roomStats?.wallFurniLimit ?? 0
                            }),
                            statistics_perm_vars_furni_html: getWiredLocalization('wiredmenu.monitor.statistics.perm_furni_vars', {
                                color: colorize(props.roomStats?.permanentFurniVariables ?? 0, props.roomStats?.permanentFurniVariablesLimit ?? 0, .5, .8),
                                amount: props.roomStats?.permanentFurniVariables ?? 0,
                                limit: props.roomStats?.permanentFurniVariablesLimit ?? 0
                            }),
                            statistics_perm_vars_user_html: getWiredLocalization('wiredmenu.monitor.statistics.perm_user_vars', {
                                color: colorize(props.roomStats?.permanentUserVariables ?? 0, props.roomStats?.permanentUserVariablesLimit ?? 0, .5, .8),
                                amount: props.roomStats?.permanentUserVariables ?? 0,
                                limit: props.roomStats?.permanentUserVariablesLimit ?? 0
                            }),
                            statistics_perm_vars_global_html: getWiredLocalization('wiredmenu.monitor.statistics.perm_global_vars', {
                                color: colorize(props.roomStats?.permanentGlobalVariables ?? 0, props.roomStats?.permanentGlobalVariablesLimit ?? 0, .5, .8),
                                amount: props.roomStats?.permanentGlobalVariables ?? 0,
                                limit: props.roomStats?.permanentGlobalVariablesLimit ?? 0
                            }),
                            highlight_holders_button: getWiredLocalization(currentVariableHighlight ? 'wiredmenu.variable_overview.unhighlight_holders' : 'wiredmenu.variable_overview.highlight_holders'),
                            timezone_picker: props.timezone,
                            value_input: props.giveVariableValue
                        } }
                        slots={ {
                            log_table_container: <HabboTableView
                                columns={ [
                                    { key: 'type', label: getWiredLocalization('wiredmenu.monitor.column.type'), width: .33 },
                                    { key: 'category', label: getWiredLocalization('wiredmenu.monitor.column.category'), width: .22 },
                                    { key: 'amount', label: getWiredLocalization('wiredmenu.monitor.column.occurrences'), width: .15 },
                                    { key: 'latest', label: getWiredLocalization('wiredmenu.monitor.column.latest'), width: .30 }
                                ] }
                                rows={ monitorRows }
                                emptyText="No errors logged." />,
                            variable_list_container: <HabboTableView
                                hideHeader
                                columns={ [ { key: 'variable', label: getWiredLocalization('wiredmenu.inspection.variables.variable'), width: 1 } ] }
                                rows={ variableRows }
                                emptyText={ getWiredLocalization('wiredmenu.table.empty') } />,
                            variable_properties_table_container: <HabboTableView
                                columns={ [
                                    { key: 'property', label: getWiredLocalization('wiredmenu.variable_overview.properties.column.property'), width: .52 },
                                    { key: 'value', label: getWiredLocalization('wiredmenu.variable_overview.properties.column.value'), width: .48 }
                                ] }
                                rows={ variableProperties.map(([ property, value ]) => ({ key: property, cells: { property, value }})) }
                                emptyText={ getWiredLocalization('wiredmenu.table.empty') } />,
                            variable_texts_table_container: <HabboTableView
                                columns={ [
                                    { key: 'value', label: getWiredLocalization('wiredmenu.variable_overview.text.column.value'), width: .2 },
                                    { key: 'text', label: getWiredLocalization('wiredmenu.variable_overview.text.column.text'), width: .8, align: 'right' }
                                ] }
                                rows={ (props.selectedVariable?.textValues ?? []).map((entry, index) => ({ key: `${ entry.value }-${ index }`, cells: entry })) }
                                emptyText={ getWiredLocalization('wiredmenu.table.empty') } />,
                            variable_values_table_container: <HabboTableView
                                columns={ [
                                    { key: 'variable', label: getWiredLocalization('wiredmenu.inspection.variables.variable'), width: .65 },
                                    { key: 'value', label: getWiredLocalization('wiredmenu.inspection.variables.value'), width: .35 }
                                ] }
                                rows={ inspectionRows }
                                emptyText={ props.inspectionType === 'global' || props.inspectionValues
                                    ? getWiredLocalization('wiredmenu.table.empty')
                                    : getWiredLocalization(`wiredmenu.inspection.preview_${ props.inspectionType }_instruction`) } />,
                            var_picker_container: (
                                <div className="habbo-wired-standalone-dropmenu">
                                    <SkinRegistryView registryId="habbo_skin_dropmenu_3" layout="dropmenu_frame_3" />
                                    <span>{ text(giveOptions.find(option => option.value === props.giveVariableName)?.label || 'Choose variable') }</span>
                                    <HabboDropMenuOverlay
                                        ariaLabel="Variable to give"
                                        value={ props.giveVariableName }
                                        options={ [ { value: '', label: 'Choose variable' }, ...giveOptions ] }
                                        onChange={ props.onGiveVariableNameChange } />
                                </div>
                            ),
                            logs_table_container: <HabboTableView
                                columns={ [
                                    { key: 'type', label: getWiredLocalization('wiredmenu.chests.room_logs.column.type'), width: .28 },
                                    { key: 'user', label: getWiredLocalization('wiredmenu.chests.room_logs.column.username'), width: .24 },
                                    { key: 'withdrawals', label: getWiredLocalization('wiredmenu.chests.room_logs.column.withdraws'), width: .24 },
                                    { key: 'deposits', label: getWiredLocalization('wiredmenu.chests.room_logs.column.deposits'), width: .24 }
                                ] }
                                rows={ chestSummaryRows }
                                emptyText="No chest transactions logged yet." />
                        } }
                        resolveCaption={ resolveWiredCaption }
                        onAction={ name =>
                        {
                            const tabActions: Record<string, HabboWiredTab> = {
                                top_view_monitor_button: 'monitor',
                                top_view_variable_overview_button: 'variables',
                                top_view_inspection_button: 'inspection',
                                top_view_chests_button: 'chests',
                                top_view_settings_button: 'settings'
                            };
                            const variableTypeAction = typeOptions.find(option => option.name === name);
                            const inspectionTypeAction = inspectionTypeOptions.find(option => option.name === name);

                            if(tabActions[name]) props.onTabChange(tabActions[name]);
                            if(variableTypeAction && props.activeTab === 'variables')
                            {
                                props.onClearVariableHighlight();
                                props.onVariableTypeChange(variableTypeAction.key);
                            }
                            if(inspectionTypeAction && props.activeTab === 'inspection') props.onInspectionTypeChange(inspectionTypeAction.key);
                            if(name === 'clear_log_btn') props.onClearLogs();
                            if(name === 'log_overview_btn') props.onOpenLogs();
                            if(name === 'highlight_holders_button')
                            {
                                if(currentVariableHighlight) props.onClearVariableHighlight();
                                else if(canHighlightVariable) props.onHighlightVariable(props.variableType, props.selectedVariable.key);
                            }
                            if(name === 'manage_button' && canManageVariable) setVariableManagementOpen(true);
                            if(name === 'pin_checkbox') props.onKeepInspectionSelectedChange(!props.keepInspectionSelected);
                            if(name === 'delete_var_btn') props.onRemoveInspectionVariable();
                            if(name === 'add_var_btn') props.onGiveVariableOpenChange(!props.giveVariableOpen);
                            if(name === 'create_var_btn') props.onGiveInspectionVariable();
                            if(name === 'lock_own_button') props.onRoomAction('lock_own_chests');
                            if(name === 'unlock_own_button') props.onRoomAction('unlock_own_chests');
                            if(name === 'lock_all_button') props.onRoomAction('lock_all_chests');
                            if(name === 'view_in_detail_button') props.onOpenChestLogs();
                            if(name === 'reload_room_btn') props.onRoomAction('reload');
                            if(name === 'roll_back_btn') props.onRoomAction('rollback');
                            if(name === 'modify_1_checkbox') permissionToggle(props.modifyPermissions, WIRED_PERMISSION_RIGHTS, normalizeModify, props.onModifyPermissionsChange);
                            if(name === 'modify_2_checkbox') permissionToggle(props.modifyPermissions, WIRED_PERMISSION_GROUP_MEMBERS, normalizeModify, props.onModifyPermissionsChange);
                            if(name === 'modify_3_checkbox') permissionToggle(props.modifyPermissions, WIRED_PERMISSION_GROUP_ADMINS, normalizeModify, props.onModifyPermissionsChange);
                            if(name === 'read_0_checkbox') permissionToggle(props.inspectPermissions, WIRED_PERMISSION_EVERYONE, normalizeInspect, props.onInspectPermissionsChange);
                            if(name === 'read_1_checkbox') permissionToggle(props.inspectPermissions, WIRED_PERMISSION_RIGHTS, normalizeInspect, props.onInspectPermissionsChange);
                            if(name === 'read_2_checkbox') permissionToggle(props.inspectPermissions, WIRED_PERMISSION_GROUP_MEMBERS, normalizeInspect, props.onInspectPermissionsChange);
                            if(name === 'read_3_checkbox') permissionToggle(props.inspectPermissions, WIRED_PERMISSION_GROUP_ADMINS, normalizeInspect, props.onInspectPermissionsChange);
                            if(name === 'preference_toolbar_checkbox') props.onShowToolbarChange(!props.showToolbar);
                            if(name === 'preference_inspect_button_checkbox') props.onShowInspectButtonChange(!props.showInspectButton);
                            if(name === 'preference_playtest_checkbox') props.onPlaytestingModeChange(!props.playtestingMode);
                        } }
                        onClose={ props.onClose } />
                </HabboLayoutRuntimeProvider>
            </HabboWindow>
            { props.visible && props.logsOpen &&
                <LogsWindow rows={ props.filteredLogs } state={ props.logsState } onClose={ props.onCloseLogs } /> }
            { props.visible && props.chestLogsOpen &&
                <TransactionLogsWindow
                    rows={ props.filteredChestLogs }
                    allRows={ props.chests }
                    state={ props.transactionLogsState }
                    onSelect={ props.onSelectChestLog }
                    onRefresh={ props.onRefreshChestLogs }
                    onClose={ props.onCloseChestLogs } /> }
            { props.visible && props.selectedChestLog &&
                <TransactionDetailsWindow log={ props.selectedChestLog } onClose={ props.onCloseChestLogDetails } /> }
            { props.visible && selectedError &&
                <ErrorInfoWindow log={ selectedError } onClose={ () => setSelectedError(null) } /> }
            { props.visible && variableManagementOpen && props.selectedVariable &&
                <VariableManagementWindow variable={ props.selectedVariable } onClose={ () => setVariableManagementOpen(false) } /> }
            { props.visible && props.selectedArrayDefinition &&
                <ArrayInspectionWindow
                    definition={ props.selectedArrayDefinition }
                    inspection={ props.arrayInspection }
                    onPage={ props.onArrayPage }
                    onSave={ props.onSetArrayField }
                    onClose={ props.onCloseArray } /> }
            <VariableHighlightOverlay
                highlight={ props.visible && props.activeTab === 'variables' ? props.variableHighlight : null }
                pulseStamp={ props.variableHighlightPulse } />
        </>
    );
};

const VariableHighlightOverlay: FC<{ highlight: WiredCreatorToolsVariableHighlight; pulseStamp: number; }> = ({ highlight, pulseStamp }) =>
{
    if(!highlight?.targets?.length) return null;

    const pulseClassName = pulseStamp
        ? `is-live-updated wired-tools-pulse-${ pulseStamp % 2 ? 'a' : 'b' }`
        : '';

    return (
        <div className="habbo-wired-highlight-overlay">
            { highlight.targets.map(target => (
                <ObjectLocationView
                    key={ `${ target.category }-${ target.objectId }-${ target.value }` }
                    objectId={ target.objectId }
                    category={ target.category }
                    className="habbo-wired-highlight-location">
                    <div className={ `habbo-wired-highlight-bubble ${ pulseClassName }`.trim() }>
                        <VariableValueInfoBubbleView captions={ { value: target.value } } resolveCaption={ resolveWiredCaption } />
                    </div>
                </ObjectLocationView>
            )) }
        </div>
    );
};
