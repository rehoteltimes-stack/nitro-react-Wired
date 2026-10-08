import { LoadProtected } from '../protected/LoadProtected';

export const MOD_TOOLS_LEVEL = 4;
export const PROFILE_MODERATION_LEVEL = 5;
export const ADMINISTRATION_LEVEL = 7;
export const GAMES_LEVEL = 7;

export const ModToolsRoomView = LoadProtected(() => import('./views/room/ModToolsRoomView').then(m => m.ModToolsRoomView));
export const ModToolsChatlogView = LoadProtected(() => import('./views/room/ModToolsChatlogView').then(m => m.ModToolsChatlogView));
export const ModToolsUserView = LoadProtected(() => import('./views/user/ModToolsUserView').then(m => m.ModToolsUserView));
export const ModToolsUserChatlogView = LoadProtected(() => import('./views/user/ModToolsUserChatlogView').then(m => m.ModToolsUserChatlogView));
export const ModToolsTicketsView = LoadProtected(() => import('./views/tickets/ModToolsTicketsView').then(m => m.ModToolsTicketsView));
export const ModToolsStaffSettingsView = LoadProtected(() => import('./views/staff-settings/ModToolsStaffSettingsView').then(m => m.ModToolsStaffSettingsView));
export const StaffFeedCardView = LoadProtected(() => import('./views/staff-settings/StaffFeedCardView').then(m => m.StaffFeedCardView));
export const StaffFeedActionsView = LoadProtected(() => import('../room/widgets/chat/StaffFeedActionsView').then(m => m.StaffFeedActionsView));
export const UserProfileModerationStaffView = LoadProtected(() => import('../user-profile/UserProfileModerationStaffView').then(m => m.UserProfileModerationStaffView));
export const ModToolsGamesView = LoadProtected(() => import('./views/games/ModToolsGamesView').then(m => m.ModToolsGamesView));
export const ModToolsAdministrationView = LoadProtected(() => import('./views/administration/ModToolsAdministrationView').then(m => m.ModToolsAdministrationView));

export const PreloadStaffViews = (level: number) =>
{
    const views = [
        ...((level >= MOD_TOOLS_LEVEL) ? [ ModToolsRoomView, ModToolsChatlogView, ModToolsUserView, ModToolsUserChatlogView, ModToolsTicketsView, ModToolsStaffSettingsView, StaffFeedCardView, StaffFeedActionsView ] : []),
        ...((level >= PROFILE_MODERATION_LEVEL) ? [ UserProfileModerationStaffView ] : []),
        ...((level >= GAMES_LEVEL) ? [ ModToolsGamesView ] : []),
        ...((level >= ADMINISTRATION_LEVEL) ? [ ModToolsAdministrationView ] : [])
    ];

    return Promise.all(views.map(view => view.preload()));
}
