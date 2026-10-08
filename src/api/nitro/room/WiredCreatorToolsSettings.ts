import { GetSessionDataManager } from '../session/GetSessionDataManager';

export interface WiredCreatorToolsSettingsState
{
    showToolbar: boolean;
    showInspectButton: boolean;
    playtestingMode: boolean;
    handitemPassingBlocked: boolean;
    // room-tools editing-rights toggle (reference: static rightsMode, default on); Inspect is only offered while it is on
    editingRights: boolean;
}

export const WIRED_CREATOR_TOOLS_SETTINGS_EVENT = 'nitro-wired-creator-tools-settings';

const DEFAULT_SETTINGS: WiredCreatorToolsSettingsState = {
    showToolbar: true,
    showInspectButton: true,
    playtestingMode: false,
    handitemPassingBlocked: false,
    editingRights: true
};

const KEY = '__nitroWiredCreatorToolsSettings';

const getWindow = () => window as unknown as Record<string, WiredCreatorToolsSettingsState>;

const INSPECT_MIN_RANK = 7;

export const GetWiredCreatorToolsSettings = (): WiredCreatorToolsSettingsState =>
{
    const settings = { ...DEFAULT_SETTINGS, ...(getWindow()[KEY] ?? {}) };

    return { ...settings, showInspectButton: settings.showInspectButton && ((GetSessionDataManager()?.securityLevel ?? 0) >= INSPECT_MIN_RANK) };
}

export const SetWiredCreatorToolsSettings = (settings: Partial<WiredCreatorToolsSettingsState>) =>
{
    const nextSettings = {
        ...GetWiredCreatorToolsSettings(),
        ...settings
    };

    getWindow()[KEY] = nextSettings;
    window.dispatchEvent(new CustomEvent(WIRED_CREATOR_TOOLS_SETTINGS_EVENT, { detail: nextSettings }));
}
