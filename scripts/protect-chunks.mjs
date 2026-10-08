import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const dist = resolve(process.argv[2] || 'dist');
const target = resolve(process.argv[3] || 'C:/inetpub/wwwroot/hcms-client-chunks');
const manifestPath = join(dist, 'manifest.json');

const PROTECTED_ROOTS = {
    'src/components/shop/ShopView.tsx': 1,
    'src/components/shop/ShopAuraSync.tsx': 1,
    'src/components/shop/ShopBubbleSync.tsx': 1,
    'src/components/shop/ShopSpawnPlayer.tsx': 1,
    'src/components/event-alert/EventAlertView.tsx': 1,
    'src/components/commands/CommandConfirmView.tsx': 1,
    'src/components/commands/ListConfirmView.tsx': 1,
    'src/components/room-tools/AreaHideView.tsx': 1,
    'src/components/builder-toolbar/BuilderToolbarView.tsx': 1,
    'src/components/clothes-shop/ClothesShopView.tsx': 1,
    'src/components/habbopass/HabboPassView.tsx': 1,
    'src/components/room-youtube/RoomYoutubeView.tsx': 1,
    'src/components/hotel-info/HotelInfoView.tsx': 1,
    'src/components/findretros-vote/ForceVoteView.tsx': 1,
    'src/components/bug-report/BugReportView.tsx': 1,
    'src/components/creator/CreatorView.tsx': 1,
    'src/components/automat/AutomatView.tsx': 1,
    'src/components/casino/CasinoView.tsx': 1,
    'src/components/casino/CasinoDealersView.tsx': 1,
    'src/components/casino/CasinoDealerSettingsView.tsx': 4,
    'src/components/prison/PrisonerPanelView.tsx': 1,
    'src/components/lotto-live/LottoLiveView.tsx': 1,
    'src/components/furni-editor/FurniEditorView.tsx': 7,
    'src/components/mod-tools/views/games/ModToolsGamesView.tsx': 6,
    'src/components/mod-tools/views/room/ModToolsRoomView.tsx': 4,
    'src/components/mod-tools/views/room/ModToolsChatlogView.tsx': 4,
    'src/components/mod-tools/views/user/ModToolsUserView.tsx': 4,
    'src/components/mod-tools/views/user/ModToolsUserChatlogView.tsx': 4,
    'src/components/mod-tools/views/tickets/ModToolsTicketsView.tsx': 4,
    'src/components/mod-tools/views/staff-settings/ModToolsStaffSettingsView.tsx': 4,
    'src/components/mod-tools/views/staff-settings/StaffFeedCardView.tsx': 4,
    'src/components/room/widgets/chat/StaffFeedActionsView.tsx': 4,
    'src/components/user-profile/UserProfileModerationView.tsx': 1,
    'src/components/user-profile/UserProfileModerationStaffView.tsx': 5,
    'src/components/mod-tools/views/administration/ModToolsAdministrationView.tsx': 7
};

if(!existsSync(manifestPath)) throw new Error('dist/manifest.json is missing; build.manifest must stay enabled');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const splitStyles = Object.values(manifest).flatMap(chunk => chunk.css || []).filter(file => !/^src\/assets\/index-[^/]+\.css$/.test(file));

if(splitStyles.length) throw new Error(`styles were split out of index.css (${ [ ...new Set(splitStyles) ].join(', ') }); a gated view owns a stylesheet, keep that view static`);

const reach = (key, seen = new Set()) =>
{
    if(seen.has(key) || !manifest[key]) return seen;

    seen.add(key);

    for(const child of (manifest[key].imports || [])) reach(child, seen);

    return seen;
};

const open = new Set();

for(const [ key, chunk ] of Object.entries(manifest))
{
    if(chunk.isEntry || (chunk.isDynamicEntry && !(key in PROTECTED_ROOTS))) reach(key, open);
}

for(const key of Object.keys(PROTECTED_ROOTS))
{
    if(!manifest[key] || !manifest[key].isDynamicEntry) throw new Error(`${ key } is not a dynamic entry anymore; a static import pulled it back into the main bundle`);
}

const levels = {};

for(const [ root, level ] of Object.entries(PROTECTED_ROOTS))
{
    for(const key of reach(root))
    {
        if(open.has(key)) continue;

        const file = manifest[key].file.replace(/^assets\//, '');

        levels[file] = Math.min(levels[file] ?? level, level);
    }
}

const files = Object.keys(levels);

if(!files.length) throw new Error('no protected chunks found');

mkdirSync(target, { recursive: true });

for(const name of readdirSync(target)) rmSync(join(target, name), { force: true });

for(const file of files)
{
    copyFileSync(join(dist, 'assets', file), join(target, file));
    unlinkSync(join(dist, 'assets', file));
}

writeFileSync(join(target, 'protected.json'), JSON.stringify(levels, null, 1));
unlinkSync(manifestPath);

console.log(`Protected ${ files.length } chunks (${ files.filter(file => levels[file] > 1).length } staff-only) into ${ target }`);
