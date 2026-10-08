import { GetCatalogIndexComposer, GetCatalogPageComposer, RoomId, RoomPreviewer, Vector3d } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { FaCompressAlt, FaExpandAlt, FaWindowMaximize, FaWindowMinimize } from 'react-icons/fa';
import { AddEventLinkTracker, FeedbackKind, GetConfiguration, GuessFeedbackKind, GetRoomEngine, ICatalogNode, GetSessionDataManager, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { FurniEditorActivityComposer, FurniEditorActivityEvent, FurniEditorActivityParser, FurniEditorDetailComposer, FurniEditorDetailEvent, FurniEditorDownloadComposer, FurniEditorDownloadResultEvent, FurniEditorInteractionsComposer, FurniEditorInteractionsEvent, FurniEditorPageItemsComposer, FurniEditorPageItemsEvent, FurniEditorSearchComposer, FurniEditorSearchResultEvent, FurniEditorUpdateComposer, FurniEditorUpdateResultEvent, FurniEditorWordSaveComposer, FurniEditorWordsComposer, FurniEditorWordsEvent, IFurniEditorWord, FurniEditorTestFurniComposer, FurniEditorTestFurniResultEvent, IFurniEditorHotelName, IFurniEditorItem, IFurniEditorOffer, IFurniEditorReference, RegisterFurniEditorMessages } from '../../api/furni-editor/FurniEditorProtocol';
import { Button, Column, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../common';
import { useCatalog, useMessageEvent, useNotification } from '../../hooks';
import { CatalogNavigationView } from '../catalog/views/navigation/CatalogNavigationView';
import { IFurniMeasure, MeasureFurni, SuggestFlags } from './FurniEditorMeasure';
import { FurniEditorIconChecks } from './FurniEditorIconChecks';
import { ConvertClassname, IsPlaceholderName, LoadWordSuggestions, LooksLikeClassname, NeedsTranslation, OnWordSuggestionsLoaded, SetCustomWords, TranslateFurniName } from './FurniNames';
import { FurniEditorWordsView, IWordPrefill, WordChips, WordForm, WordKind } from './FurniEditorWordsView';
import { FurniEditorRenameView, IRenamePage } from './FurniEditorRenameView';
import { FurniEditorReviewView, IAutoRunChange } from './FurniEditorReviewView';
import { FurniEditorRunPagesView, IRunPage } from './FurniEditorRunPagesView';
import { GuessPose, IPoseFeatures, LoadPoseModel } from './FurniPoseModel';
import { DecidePose, FitSeatHeight, FurniEditorPreview, IsMultiheight, PoseLabel, ScanFurniSize, ScanStateHeights, STACK_TEST_ITEMS, TestPose } from './FurniEditorPreview';

// hCMS Furni Editor (own plugin hcms-furnieditor-plugin). Admin only (rank 7+, the server checks again).
// Modelled on sodaho.tel's Furni Editor: Search / Edit, room preview (click = state, Shift+click = rotate), an
// "Asset data" box that measures the loaded .nitro and offers one-click fixes. Extra: a catalog-page mode that steps
// through every furni on the page open in the catalog. Suggestions are never saved without pressing Save.

const TAB_SEARCH = 0, TAB_PAGE = 1, TAB_EDIT = 2, TAB_WORDS = 3, TAB_TEAM = 4;
const FIRST_TODO = -2;

/** "just now", "5 min", "3 h", "2 d" (team work lists). */
const Ago = (seconds: number) => (seconds < 60) ? 'just now' : (seconds < 3600) ? `${ Math.floor(seconds / 60) } min ago` : (seconds < 86400) ? `${ Math.floor(seconds / 3600) } h ago` : `${ Math.floor(seconds / 86400) } d ago`;
const MIN_LEVEL = 7;
const HEIGHT_STEPS = [ 1, 0.1, 0.01 ];   // same steps as build mode's Adjust height (BuilderToolbarView)
const FLAGS: [ keyof IFurniEditorItem, string ][] = [ [ 'allowStack', 'Stack' ], [ 'allowWalk', 'Walk' ], [ 'allowSit', 'Sit' ], [ 'allowLay', 'Lay' ], [ 'allowGift', 'Gift' ], [ 'allowTrade', 'Trade' ], [ 'allowRecycle', 'Recycle' ], [ 'allowMarketplaceSell', 'Marketplace' ], [ 'allowInventoryStack', 'Inventory stack' ] ];

// Sit height from the scanned seat top (2026-09-28, 124 chairs scanned in Chrome vs our DB and the reference hotels):
// most classic chairs / sofas are stored at 1.0 whatever their pixels say, and a low seat scan (0.1 - 0.4) is often the
// front of the base rather than the cushion (it gave 0.8 / 0.9 where 1.0 - 1.2 is right). So: 1.0, unless the seat top is
// clearly higher (>= 0.5, bar stools, thrones, high sofas): then seat top + 0.6, to 0.1. Within 0.2 of the right
// height on 84% (91% where the references agree), exact on 48% (63%) - was 68% / 11% with seat top + 0.7.
const SitHeight = (seat: number) => ((seat === null) || isNaN(seat) || (seat < 0.5)) ? 1 : Math.round((seat + 0.6) * 10) / 10;

export const FurniEditorView: FC<{}> = props =>
{
    RegisterFurniEditorMessages();

    const [ isVisible, setIsVisible ] = useState(false);
    const [ tab, setTab ] = useState(TAB_SEARCH);
    // compact = no catalog column and one field column (the room stays usable next to it); minimized = title bar only
    const readLayout = (key: string) => { try { return window.localStorage.getItem('furni-editor.' + key) === '1'; } catch { return false; } };
    const [ compact, setCompact ] = useState(() => readLayout('compact'));
    const [ minimized, setMinimized ] = useState(() => readLayout('minimized'));

    useEffect(() => { try { window.localStorage.setItem('furni-editor.compact', compact ? '1' : '0'); window.localStorage.setItem('furni-editor.minimized', minimized ? '1' : '0'); } catch { } }, [ compact, minimized ]);
    // staff-added word translations (Words tab); wordsVersion changes whenever a new list arrives so suggestions recompute
    const [ words, setWords ] = useState<IFurniEditorWord[]>([]);
    const [ wordsVersion, setWordsVersion ] = useState(0);
    const [ namePrefill, setNamePrefill ] = useState<IWordPrefill>(null);
    const [ query, setQuery ] = useState('');
    const [ type, setType ] = useState('');
    const [ results, setResults ] = useState<IFurniEditorItem[]>([]);
    const [ total, setTotal ] = useState(0);
    const [ page, setPage ] = useState(1);
    const [ pageItems, setPageItems ] = useState<IFurniEditorItem[]>([]);
    const [ pageCaption, setPageCaption ] = useState('');
    const [ pageNames, setPageNames ] = useState<Map<number, IFurniEditorHotelName[]>>(new Map());
    const [ pageIndex, setPageIndex ] = useState(-1);
    const [ item, setItem ] = useState<IFurniEditorItem>(null);
    const [ form, setForm ] = useState<IFurniEditorItem>(null);
    const [ offers, setOffers ] = useState<IFurniEditorOffer[]>([]);
    const [ interactions, setInteractions ] = useState<string[]>([]);
    const [ measure, setMeasure ] = useState<IFurniMeasure>(null);
    const [ busy, setBusy ] = useState(false);
    const [ nextAfterSave, setNextAfterSave ] = useState(false);
    const [ previewerId ] = useState(() => ++RoomPreviewer.PREVIEW_COUNTER);
    const [ previewer ] = useState(() => new RoomPreviewer(GetRoomEngine(), previewerId));
    const [ pose, setPose ] = useState<TestPose>('none');
    const [ autoTest, setAutoTest ] = useState(false);
    // poses the test tries: ticked with the pose buttons; empty = all four. Preset per furni (chair -> sit, rug -> walk,
    // bed -> lay, anything else -> all)
    const [ testPoses, setTestPoses ] = useState<TestPose[]>([]);
    const [ references, setReferences ] = useState<IFurniEditorReference[]>([]);
    const [ scan, setScan ] = useState<{ surface: number, max: number, seat: number, bed: number, features?: IPoseFeatures }>(null);
    const [ poseModelReady, setPoseModelReady ] = useState(false);
    const [ heightTouched, setHeightTouched ] = useState(false);
    const [ stackItem, setStackItem ] = useState(STACK_TEST_ITEMS[0].sprite);
    const openedId = useRef(-1);
    const [ fit, setFit ] = useState<{ itemId: number, busy: boolean, steps: { height: number, gap: number, debug?: unknown }[], height: number }>(null);
    const [ sizeScan, setSizeScan ] = useState<{ width: number, length: number, busy: boolean }>(null);
    const [ stateHeights, setStateHeights ] = useState<{ heights: number[], busy: boolean }>(null);
    const [ download, setDownload ] = useState<{ busy: boolean, ok?: boolean, message?: string }>(null);
    // every furni the Auto run changed, for the review list afterwards (accept / revert one, some or all)
    const [ reviewRows, setReviewRows ] = useState<IAutoRunChange[]>([]);
    const [ showReview, setShowReview ] = useState(false);
    const [ showRunPages, setShowRunPages ] = useState(false);
    // Auto run over chosen pages: the pages still to do (null = carry on through the whole tree from the open page)
    const runQueue = useRef<number[]>(null);
    const reverting = useRef<Set<number>>(new Set());
    const [ furnidataName, setFurnidataName ] = useState('');
    const [ catalogNames, setCatalogNames ] = useState<string[]>([]);
    const [ hotelNames, setHotelNames ] = useState<IFurniEditorHotelName[]>([]);
    const [ showRename, setShowRename ] = useState(false);
    const [ testFurni, setTestFurni ] = useState<{ placed: boolean, message: string }>(null);
    const [ loadedPageId, setLoadedPageId ] = useState(-1);
    // Auto run: every furni of the catalog page in turn - wait for the measure, scans and pose test, apply the ticked
    // suggestions, save & next; carries on with the next catalog page until Stop, a save error or the end of the catalog
    const [ autoRun, setAutoRun ] = useState(false);
    const [ autoApply, setAutoApply ] = useState({ modes: true, size: true, pose: true, height: true });
    // furni already edited (from the edit log, plus what was saved this session): Auto run skips them unless unticked
    const [ editedIds, setEditedIds ] = useState<Set<number>>(new Set());
    // team work: who edited each furni of the open page, who else is on it, and the Team tab's activity
    const [ pageEditors, setPageEditors ] = useState<Map<number, { name: string, ago: number }>>(new Map());
    const [ othersHere, setOthersHere ] = useState<{ name: string, ago: number }[]>([]);
    const [ activity, setActivity ] = useState<FurniEditorActivityParser>(null);
    const [ skipEdited, setSkipEdited ] = useState(true);
    const [ autoStatus, setAutoStatus ] = useState('');
    const [ autoTick, setAutoTick ] = useState(0);
    const autoRunItem = useRef<{ id: number, since: number, done: boolean }>({ id: -1, since: 0, done: false });
    const autoRunRef = useRef(false);
    const autoCount = useRef({ saved: 0, changed: 0, skipped: 0 });
    const scanFor = useRef(-1);
    const lastOpened = useRef(-1);
    // furni to open when the next page list arrives: an id, FIRST_TODO (the first one not edited yet) or -1 (keep the open one)
    const pendingOpen = useRef(-1);
    // a furni opened from the Team tab without a page: once its detail says where it is sold, that page is opened around it
    const contextFor = useRef(-1);
    const { isVisible: catalogVisible = false, currentPage = null, currentOffer = null, setCurrentOffer = null, rootNode = null, activateNode = null, activeNodes = [], currentType = null, pageId: catalogPageId = -1, searchResult = null, setSearchResult = null } = useCatalog();
    const { simpleAlert = null } = useNotification();
    // results of single actions: a notice line inside the editor (under the tabs, on every tab), like HabboCity's own
    // windows; it clears after 8 seconds. Quiet while Auto run is going (one summary at the end) and for review reverts
    // (the review panel shows those)
    const [ notice, setNotice ] = useState<{ text: string, kind: FeedbackKind }>(null);
    const noticeTimer = useRef<ReturnType<typeof setTimeout>>(null);
    const feedback = (message: string, kind: FeedbackKind = null) =>
    {
        if(!message || autoRunRef.current) return;

        setNotice({ text: message, kind: kind || GuessFeedbackKind(message) });

        if(noticeTimer.current) clearTimeout(noticeTimer.current);

        noticeTimer.current = setTimeout(() => setNotice(null), 8000);
    }
    const pendingWord = useRef<{ word: string, english: string }>(null);

    const allowed = () => (GetSessionDataManager().securityLevel >= MIN_LEVEL);
    const search = (p: number) => { setBusy(true); SendMessageComposer(new FurniEditorSearchComposer(query, type, p)); };
    const open = (id: number) => { lastOpened.current = id; setBusy(true); SendMessageComposer(new FurniEditorDetailComposer(id)); };
    const loadPage = (pageId: number) => { setLoadedPageId(pageId); SendMessageComposer(new FurniEditorPageItemsComposer(pageId)); };
    const set = <K extends keyof IFurniEditorItem>(key: K, value: IFurniEditorItem[K]) => setForm(prev => ({ ...prev, [key]: value }));

    useEffect(() =>
    {
        const tracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2 || !allowed()) return;

                switch(parts[1])
                {
                    case 'show': setIsVisible(true); return;
                    case 'hide': setIsVisible(false); return;
                    case 'toggle': setIsVisible(v => !v); return;
                    case 'item': setIsVisible(true); open(parseInt(parts[2])); return;
                    case 'page': setIsVisible(true); setTab(TAB_PAGE); loadPage(parseInt(parts[2])); return;
                }
            },
            eventUrlPrefix: 'furni-editor/'
        };

        AddEventLinkTracker(tracker);

        return () => RemoveLinkEventTracker(tracker);
    }, []);

    useEffect(() =>
    {
        if(!isVisible) return;

        SendMessageComposer(new FurniEditorInteractionsComposer());
        SendMessageComposer(new FurniEditorWordsComposer());

        // word suggestions for the "?" words and the translator (1.3MB, loaded once, only for the editor)
        LoadWordSuggestions(GetConfiguration<string>('furni-editor.suggestions.url', 'https://cdn.habbo.nz/furni-editor/furni-word-suggestions.json?v=2'));
        LoadPoseModel(() => setPoseModelReady(true));

        if(!results.length) search(1);
    }, [ isVisible ]);

    // once the suggestions arrive, name suggestions are made again, the same way as after a word list change
    useEffect(() => OnWordSuggestionsLoaded(() => setWordsVersion(v => v + 1)), []);

    useMessageEvent<FurniEditorWordsEvent>(FurniEditorWordsEvent, event =>
    {
        const list = event.getParser().words;

        SetCustomWords(list);
        setWords(list);
        setWordsVersion(v => v + 1);

        if(pendingWord.current)
        {
            const { word, english } = pendingWord.current;

            pendingWord.current = null;
            feedback(english ? `Word saved: ${ word } → ${ english }` : `Word removed: ${ word }`, 'success');
        }
    });

    const saveWord = (word: string, english: string, kind: WordKind) => { pendingWord.current = { word, english }; SendMessageComposer(new FurniEditorWordSaveComposer(word, english, kind)); };

    useEffect(() => () => previewer.dispose(), [ previewer ]);

    // the catalog tree on the left: the catalog hook only asks for its index when the catalog opens, so ask here too
    useEffect(() =>
    {
        if(!isVisible || rootNode) return;

        SendMessageComposer(new GetCatalogIndexComposer(currentType));
    }, [ isVisible, rootNode, currentType ]);

    useMessageEvent<FurniEditorSearchResultEvent>(FurniEditorSearchResultEvent, event =>
    {
        const parser = event.getParser();

        setResults(parser.items);
        setTotal(parser.total);
        setPage(parser.page);
        setBusy(false);
    });

    useMessageEvent<FurniEditorActivityEvent>(FurniEditorActivityEvent, event =>
    {
        const parser = event.getParser();

        setActivity({ mine: parser.mine, edits: [ ...parser.edits ], pages: [ ...parser.pages ], staff: [ ...parser.staff ] } as FurniEditorActivityParser);
    });

    // the Team tab is fresh whenever it is opened (and when the editor opens)
    useEffect(() =>
    {
        if(isVisible && ((tab === TAB_TEAM) || !activity)) SendMessageComposer(new FurniEditorActivityComposer());
    }, [ isVisible, tab ]);

    useMessageEvent<FurniEditorPageItemsEvent>(FurniEditorPageItemsEvent, event =>
    {
        const parser = event.getParser();

        setPageItems(parser.items);
        setPageCaption(parser.caption);
        setPageNames(parser.names || new Map());
        setEditedIds(prev => new Set([ ...prev, ...(parser.edited || []) ]));
        setPageEditors(new Map(parser.editors || []));
        setOthersHere([ ...(parser.othersHere || []) ]);
        // open the furni asked for (picked in the catalog / the Team tab), or the first one not done yet, or keep the open
        // one when the same page arrives twice (the catalog sync and a direct load can both ask for it), else the first
        const target = pendingOpen.current;
        const done = new Set([ ...editedIds, ...(parser.edited || []) ]);
        let index = -1;

        if(target === FIRST_TODO) index = parser.items.findIndex(i => !done.has(i.id));
        else if(target > 0) index = parser.items.findIndex(i => (i.id === target) || (i.spriteId === target));
        else index = parser.items.findIndex(i => i.id === lastOpened.current);

        const keepOpen = (target === -1) && (index >= 0);

        if(index < 0) index = parser.items.length ? 0 : -1;

        pendingOpen.current = -1;
        setPageIndex(index);

        if((index >= 0) && !keepOpen) open(parser.items[index].id);
        else if(autoRunRef.current) setTimeout(() => keys.current?.nextPage(), 300);   // an empty page: auto run moves on
    });

    useMessageEvent<FurniEditorDetailEvent>(FurniEditorDetailEvent, event =>
    {
        const parser = event.getParser();

        setBusy(false);

        if(!parser.item) return;

        setItem(parser.item);
        setForm({ ...parser.item });
        setOffers(parser.offers);

        // opened from the Team tab without a page: open the first page that sells it, around this furni
        if((contextFor.current === parser.item.id) && parser.offers?.length)
        {
            contextFor.current = -1;
            goTo(parser.item.id, parser.offers[0].pageId);
        }
        setReferences(parser.references);
        setFurnidataName(parser.furnidataName || '');
        setCatalogNames(parser.catalogNames || []);
        setHotelNames(parser.hotelNames || []);
        setTab(TAB_EDIT);
    });

    useMessageEvent<FurniEditorDownloadResultEvent>(FurniEditorDownloadResultEvent, event =>
    {
        const parser = event.getParser();

        setDownload({ busy: false, ok: parser.ok, message: parser.message });
        feedback(parser.message, parser.ok ? 'success' : null);
    });

    const downloadAsset = (replace: boolean) =>
    {
        if(!form) return;

        setDownload({ busy: true });
        SendMessageComposer(new FurniEditorDownloadComposer(form.id, replace));
    }

    useMessageEvent<FurniEditorTestFurniResultEvent>(FurniEditorTestFurniResultEvent, event =>
    {
        const parser = event.getParser();

        setTestFurni({ placed: parser.placed, message: parser.message });
        feedback(parser.message, parser.placed ? 'success' : null);
    });

    useMessageEvent<FurniEditorInteractionsEvent>(FurniEditorInteractionsEvent, event => setInteractions(event.getParser().interactions));

    // A saved name shows at once: the loaded FurnitureData entry (infostand, inventory, catalog search) gets the new name,
    // and the open catalog page is asked for again (the plugin also renames the emulator's loaded catalog offers).
    const applyNameLocally = (id: number, name: string) =>
    {
        const session = GetSessionDataManager();

        for(const data of [ session.getFloorItemData(id), session.getWallItemData(id) ]) if(data) (data as any)._localizedName = name;

        // the open catalog page's offers for this furni show their catalog_name (Offer.localizationName)
        for(const offer of (currentPage?.offers || [])) if(offer.product && (offer.product.productClassId === id)) (offer as any)._localizationId = name;

        setPageItems(prev => prev.map(i => (i.id === id) ? { ...i, publicName: name } : i));
    }

    const reloadCatalogPage = (offerId: number = -1) =>
    {
        if(catalogVisible && (catalogPageId > -1)) SendMessageComposer(new GetCatalogPageComposer(catalogPageId, offerId, currentType));
    }

    useMessageEvent<FurniEditorUpdateResultEvent>(FurniEditorUpdateResultEvent, event =>
    {
        const parser = event.getParser();

        // a revert from the review list: mark the row, don't move the editor
        if(reverting.current.has(parser.id))
        {
            reverting.current.delete(parser.id);
            setReviewRows(prev => prev.map(r => (r.id === parser.id) ? { ...r, status: parser.success ? 'reverted' : 'error', message: parser.message } : r));

            if(item && (item.id === parser.id)) open(parser.id);

            return;
        }

        setBusy(false);

        if(!parser.success) { stopAutoRun(`Stopped: ${ parser.message }`); feedback(`Save failed: ${ parser.message }`, 'error'); return; }

        feedback((parser.message === 'No changes') ? `#${ parser.id }: no changes` : `#${ parser.id } saved`, (parser.message === 'No changes') ? 'info' : 'success');

        setEditedIds(prev => (prev.has(parser.id) ? prev : new Set([ ...prev, parser.id ])));

        if(item && (item.id === parser.id) && (form.publicName !== item.publicName)) { applyNameLocally(parser.id, form.publicName); if(!nextAfterSave) reloadCatalogPage(currentOffer ? currentOffer.offerId : -1); }

        if(nextAfterSave && (pageIndex >= 0)) step(1);
        else open(parser.id);

        setNextAfterSave(false);
    });

    // put the furni in the preview room and measure its asset once loaded
    useEffect(() =>
    {
        if(!item) return;

        setMeasure(null);
        setHeightTouched(false);
        setFit(null);
        openedId.current = item.id;

        // "Place in room" is per furni: moving on removes the test furni of the previous one
        setTestFurni(prev => { if(prev && prev.placed) SendMessageComposer(new FurniEditorTestFurniComposer(0)); return null; });
        setSizeScan(null);
        setStateHeights(null);
        setDownload(null);
        setAutoTest(true);
        previewer.reset(false);
        previewer.updateObjectRoom('101', '101', '1.1');
        previewer.updateRoomWallsAndFloorVisibility(true, true);

        if(item.type === 'i') previewer.addWallItemIntoRoom(item.spriteId, new Vector3d(90), '');
        else previewer.addFurnitureIntoRoom(item.spriteId, new Vector3d(90));

        let tries = 0;
        const interval = setInterval(() =>
        {
            const result = MeasureFurni(item.itemName);

            if(result || (++tries > 40))
            {
                setMeasure(result);
                clearInterval(interval);

                // the size scan runs once the asset is in, over every state the asset has
                if(result && (item.type !== 'i')) runSizeScan(item.itemName, result.states);
            }
        }, 250);

        return () => clearInterval(interval);
    }, [ item, previewer ]);

    // every name this furni has somewhere, for the Name box (duplicates merged, the source list kept)
    const nameCandidates = useMemo(() =>
    {
        const list = new Map<string, string[]>();
        const add = (name: string, source: string) =>
        {
            const value = (name || '').replace(/\s+/g, ' ').trim();

            if(!value || IsPlaceholderName(value)) return;

            list.set(value, [ ...(list.get(value) || []), source ]);
        }

        if(item) add(item.publicName, 'current');
        // no real name yet (empty or just the file / classname): a readable one made from the classname
        if(item && LooksLikeClassname(item.publicName, item.itemName)) add(ConvertClassname(item.itemName), 'from classname');
        add(furnidataName, 'FurnitureData');
        catalogNames.forEach(n => add(n, 'catalog'));
        references.forEach(r => add(r.publicName, r.source));
        hotelNames.forEach(h => add(h.name, h.hotels + ((h.hotels === 1) ? ' hotel' : ' hotels') + ' (' + h.languages + ')'));

        return [ ...list.entries() ].map(([ name, sources ]) => ({ name, sources, english: NeedsTranslation(name) ? TranslateFurniName(name) : null }));
    }, [ item, furnidataName, catalogNames, references, hotelNames, wordsVersion ]);

    const runSizeScan = async (itemName: string, states: number) =>
    {
        setSizeScan({ width: 0, length: 0, busy: true });

        await new Promise(resolve => setTimeout(resolve, 400));

        const result = await ScanFurniSize(RoomId.makeRoomPreviewerId(previewerId), states, itemName);

        setSizeScan(result ? { ...result, busy: false } : null);

        // then the surface height of every state: different heights = a multiheight furni
        if(states < 2) { setStateHeights({ heights: null, busy: false }); return; }

        setStateHeights({ heights: null, busy: true });

        const heights = await ScanStateHeights(RoomId.makeRoomPreviewerId(previewerId), states, itemName, result?.width || 1, result?.length || 1);

        setStateHeights({ heights, busy: false });
    }

    // references (other hotels' items_base) know best: when they have this furni and none of them makes it multiheight,
    // never suggest it (a lamp or gate whose states look different in pixels); when they agree it is, use their heights.
    const referenceMultiheight = useMemo(() =>
    {
        const known = (references || []).filter(r => r.interactionType !== undefined);

        if(!known.length) return undefined;

        const counts = new Map<string, number>();

        for(const r of known) if((r.interactionType === 'multiheight') && r.multiheight && (r.multiheight !== '0')) counts.set(r.multiheight, (counts.get(r.multiheight) || 0) + 1);

        if(!counts.size) return null;

        return [ ...counts.entries() ].sort((a, b) => b[1] - a[1])[0][0];
    }, [ references ]);
    const multiheightSuggestion = (referenceMultiheight === null) ? null
        : (referenceMultiheight !== undefined) ? referenceMultiheight
            : (stateHeights && IsMultiheight(stateHeights.heights)) ? stateHeights.heights.join(';') : null;

    // the picture's guess: only from a scan of the furni that is open (scanFor), with its stored size
    const pictureGuess = useMemo(() =>
    {
        if(!item || !poseModelReady || !scan?.features || (scanFor.current !== item.id)) return null;

        return GuessPose(scan.features, Number(item.width) || 1, Number(item.length) || 1);
    }, [ item, scan, poseModelReady ]);
    const decision = useMemo(() => (item ? DecidePose(references, item.itemName, item.publicName, hotelNames, pictureGuess) : null), [ item, references, hotelNames, pictureGuess ]);

    // preset of the poses to test when a furni opens: the confident verdict, else what the name says, else all
    useEffect(() =>
    {
        if(!item || !decision) return;

        const hint = SuggestFlags(item.itemName, item.publicName);
        const byName: TestPose = hint.lay ? 'lay' : hint.sit ? 'sit' : hint.walk ? 'std' : null;
        const byVerdict: TestPose = (decision.found && [ 'std', 'sit', 'lay' ].includes(decision.pose)) ? decision.pose : null;
        const preset = byVerdict || byName;

        setTestPoses(preset ? [ preset ] : []);
    }, [ item?.id, decision ]);

    const toggleTestPose = (p: TestPose) =>
    {
        setAutoTest(false);
        setTestPoses(prev => prev.includes(p) ? prev.filter(x => x !== p) : [ ...prev, p ]);
        setPose(p);
    }

    // auto test (starts on every opened furni): the test avatar tries the ticked poses (all four when none is ticked) and
    // stops on the pose the evidence agrees on; with no clear answer it stops after one round so the admin decides
    useEffect(() =>
    {
        if(!autoTest || !decision) return;

        // the first step lays stack tiles over the furni's footprint (width x length from the form, i.e. the asset size),
        // so the size can be checked by eye before the avatar tries walk / sit / lay (user rule 2026-09-29: size first)
        // (always first, even when only one pose is ticked)
        const all: TestPose[] = [ 'stack', 'std', 'sit', 'lay' ];
        const order: TestPose[] = testPoses.length ? all.filter(p => (p === 'stack') || testPoses.includes(p)) : all;
        const target: TestPose = (decision.pose === 'none') ? 'stack' : decision.pose;
        let index = 0;

        setPose(order[0]);

        if(decision.found && (target === order[0])) { setAutoTest(false); return; }

        const interval = setInterval(() =>
        {
            index++;

            if(index >= order.length) { clearInterval(interval); setPose((decision.found && order.includes(target)) ? target : (order.length === 1) ? order[0] : 'none'); setAutoTest(false); return; }

            setPose(order[index]);

            if(decision.found && (target === order[index])) { clearInterval(interval); setAutoTest(false); }
        }, 1000);

        return () => clearInterval(interval);
    }, [ autoTest, decision, testPoses ]);

    // catalog sync: the page open in the catalog is loaded here, the furni picked in the catalog is opened here
    useEffect(() =>
    {
        if(!isVisible || !currentPage || (currentPage.pageId === loadedPageId)) return;

        loadPage(currentPage.pageId);
    }, [ isVisible, currentPage ]);

    useEffect(() =>
    {
        const id = currentOffer?.product?.productClassId;

        if(!isVisible || !id || (id === lastOpened.current)) return;

        const index = pageItems.findIndex(i => (i.id === id) || (i.spriteId === id));

        if((index >= 0) && currentPage && (currentPage.pageId === loadedPageId)) { setPageIndex(index); open(pageItems[index].id); }
        else pendingOpen.current = id;
    }, [ isVisible, currentOffer ]);

    // "stack" = none of walk / sit / lay, stacking allowed
    const applyPose = (p: TestPose) => setForm(prev => ({ ...prev, allowWalk: (p === 'std'), allowSit: (p === 'sit'), allowLay: (p === 'lay'), allowStack: (p === 'stack') ? true : prev.allowStack }));
    // use a height and put the test avatar on it (walk), so the result is visible straight away
    // any height change (typed, ruler, stepper, "use it") moves the test avatar to that height
    const setHeight = (value: string) => { set('stackHeight', value); setHeightTouched(true); }
    const stepHeight = (delta: number) => setHeight(String(Math.max(0, Math.round(((Number(form?.stackHeight) || 0) + delta) * 100) / 100)));
    const applyHeight = (value: string) => { setHeight(value); setAutoTest(false); setPose('std'); };
    // Sit / lay furni: the height comes from the seat or mattress top (lowest real surface), never the backrest or
    // headboard. The client draws a sitting / lying avatar one height unit lower than its sit height
    // (AvatarVisualization._postureOffset = scale / 2), and the pose's hips then sit a bit higher, so the stored height
    // is the seat top plus a fixed pose offset. Calibrated on classic furni whose heights look right in game:
    // chair_norja seat top 0.4 -> sit 1.0 (chair_polyfon 0.45 -> 1.05); classic beds mattress top ~0.9 -> lay 1.8.
    // re-calibrated for the height sweep (seat front edge): chair_norja 0.55 -> 1.0; bed_silo_one mattress 0.9 -> 1.8
    // from the 2026-09-28 benchmark (see scanSurface): sit = seat top + 0.70, lay = mattress top + 0.80
    const LAY_OFFSET = 0.8;
    const seatPose = !form ? null : (form.allowLay || (!!decision && decision.found && (decision.pose === 'lay'))) ? 'lay'
        : (form.allowSit || (!!decision && decision.found && (decision.pose === 'sit'))) ? 'sit' : null;
    const scannedHeight = !scan ? null : (seatPose === 'lay') ? Math.round((scan.bed + LAY_OFFSET) * 20) / 20
        : (seatPose === 'sit') ? SitHeight(scan.seat) : scan.surface;
    const scannedLabel = !seatPose ? 'surface' : `${ seatPose } height (${ seatPose === 'lay' ? 'mattress' : 'seat' } top ${ (seatPose === 'lay') ? scan?.bed : scan?.seat })`;
    const fitted = (fit && !fit.busy && form && (fit.itemId === form.id)) ? fit.height : null;
    const avatarHeight = heightTouched ? (Number(form?.stackHeight) || 0) : (fitted !== null) ? fitted : ((scannedHeight !== null) ? scannedHeight : (Number(form?.stackHeight) || 0));

    // seat fit: the avatar really sits / lies on the seat, adjusted step by step (FitSeatHeight)
    const runFit = async () =>
    {
        if(!form || !scan || !seatPose) return;

        const itemId = form.id;

        setAutoTest(false);
        setPose('none');   // the fit places its own avatar
        setFit({ itemId, busy: true, steps: [], height: null });

        await new Promise(resolve => setTimeout(resolve, 200));

        const height = await FitSeatHeight(RoomId.makeRoomPreviewerId(previewerId), seatPose, (seatPose === 'lay') ? scan.bed : scan.seat, scannedHeight,
            (h, gap, debug) => setFit(prev => (prev && prev.itemId === itemId) ? { ...prev, steps: [ ...prev.steps, { height: h, gap, debug } ] } : prev),
            () => (openedId.current !== itemId));   // stop at once when another furni is opened

        setFit(prev => (prev && prev.itemId === itemId) ? { ...prev, busy: false, height } : prev);
        setPose(seatPose);
    }

    // beta: runs only from its button until its hip measurement is verified on real chairs
    const hasAssetSize = !!measure && (measure.width > 0) && (measure.length > 0);
    const poseOf = (f: IFurniEditorItem): TestPose => (f.allowLay ? 'lay' : f.allowSit ? 'sit' : f.allowWalk ? 'std' : f.allowStack ? 'stack' : 'none');
    const poseMatches = decision && form && (poseOf(form) === ((decision.pose === 'none') ? 'stack' : decision.pose));

    // every visible catalog page, indented like the catalog tree (the bulk rename modal's page chooser)
    const catalogPages = useMemo((): IRenamePage[] =>
    {
        const list: IRenamePage[] = [];
        const walk = (node: ICatalogNode, depth: number) => { for(const child of node.children) { if(!child.isVisible) continue; list.push({ pageId: child.pageId, label: '\u00a0\u00a0'.repeat(depth) + child.localization + ` (${ child.pageId })` }); walk(child, depth + 1); } };

        if(rootNode) walk(rootNode, 0);

        return list;
    }, [ rootNode ]);

    const runPages = useMemo((): IRunPage[] =>
    {
        const list: IRunPage[] = [];
        const walk = (node: ICatalogNode, depth: number) => { for(const child of node.children) { if(!child.isVisible) continue; list.push({ pageId: child.pageId, caption: child.localization, depth }); walk(child, depth + 1); } };

        if(rootNode) walk(rootNode, 0);

        return list;
    }, [ rootNode ]);

    // opens a catalog page by id in the catalog state; the catalog sync then loads its furni here
    const choosePage = (pageId: number) =>
    {
        const find = (node: ICatalogNode): ICatalogNode => { for(const child of node.children) { if(child.pageId === pageId) return child; const found = find(child); if(found) return found; } return null; };
        const node = rootNode ? find(rootNode) : null;

        if(node && activateNode) activateNode(node);
        else loadPage(pageId);
    }

    /** Team tab: go to a furni on its page (pageId > 0) or to a page's first furni not done yet (itemId <= 0), in the
     *  catalog too, so Prev / Next / Save & next carry on from there. Without a page, the furni's own offers pick it. */
    const goTo = (itemId: number, pageId: number) =>
    {
        setTab(TAB_EDIT);

        if(pageId > 0)
        {
            pendingOpen.current = (itemId > 0) ? itemId : FIRST_TODO;

            if(currentPage && (currentPage.pageId === pageId)) loadPage(pageId);   // already open in the catalog: no sync would fire
            else choosePage(pageId);

            return;
        }

        if(itemId > 0) { contextFor.current = itemId; open(itemId); }
    }

    const goNextPage = () =>
    {
        const node = nextCatalogNode();

        if(node && activateNode) activateNode(node);
    }

    // the next visible page after the open one in the catalog tree (depth first, the navigation's own order)
    const nextCatalogNode = (): ICatalogNode =>
    {
        if(!rootNode) return null;

        const list: ICatalogNode[] = [];

        // a run over chosen pages: the next one still queued (pages no longer in the tree are skipped)
        if(autoRunRef.current && runQueue.current)
        {
            const find = (node: ICatalogNode): ICatalogNode => { for(const child of node.children) { if(child.pageId === id) return child; const found = find(child); if(found) return found; } return null; };
            let id = -1;

            while(runQueue.current.length)
            {
                id = runQueue.current.shift();

                const node = find(rootNode);

                if(node) return node;
            }

            return null;
        }

        if(!currentPage) return null;

        const walk = (node: ICatalogNode) => { for(const child of node.children) { if(!child.isVisible) continue; list.push(child); walk(child); } };

        walk(rootNode);

        const index = list.findIndex(n => n.pageId === currentPage.pageId);

        return (index >= 0) ? (list[index + 1] || null) : null;
    }

    const save = (next: boolean) =>
    {
        if(!form) return;

        setBusy(true);
        setNextAfterSave(next);
        SendMessageComposer(new FurniEditorUpdateComposer(form));
    }

    const step = (delta: number) =>
    {
        const index = pageIndex + delta;

        if(index >= pageItems.length)
        {
            // end of the page: carry on with the next catalog page (the catalog sync loads it here)
            const node = nextCatalogNode();

            if(node && activateNode) activateNode(node);
            else if(autoRunRef.current) stopAutoRun('Done: reached the end of the catalog.');

            return;
        }

        if(index < 0) return;

        setPageIndex(index);
        open(pageItems[index].id);

        // keep the catalog on the same furni
        const offer = currentPage?.offers?.find(o => o.product && ((o.product.productClassId === pageItems[index].id) || (o.product.productClassId === pageItems[index].spriteId)));

        if(offer && setCurrentOffer) { offer.activate(); setCurrentOffer(offer); }
    }

    const startAutoRun = (pageIds: number[] = null) =>
    {
        if(pageIds && !pageIds.length) return;

        runQueue.current = pageIds ? pageIds.slice(1) : null;
        autoCount.current = { saved: 0, changed: 0, skipped: 0 };
        autoRunItem.current = { id: -1, since: 0, done: false };
        autoRunRef.current = true;
        setReviewRows(prev => prev.filter(r => r.status === 'pending'));   // decided rows of an earlier run go
        setShowReview(false);
        setAutoStatus('Running...');
        setAutoRun(true);

        if(pageIds && pageIds.length) { setShowRunPages(false); goTo(-1, pageIds[0]); }
    }

    const stopAutoRun = (status: string = null) =>
    {
        if(!autoRunRef.current) return;

        autoRunRef.current = false;
        runQueue.current = null;
        setAutoRun(false);
        setShowReview(true);   // the review list opens when there is something in it
        setAutoStatus(status || `Stopped after ${ autoCount.current.saved } furni (${ autoCount.current.changed } changed).`);
        feedback(`Auto run: ${ status || `stopped after ${ autoCount.current.saved } furni` } (${ autoCount.current.changed } changed)`, 'info');
    }

    useEffect(() => { if(!isVisible) stopAutoRun(); }, [ isVisible ]);

    // the fields Auto run can change, shown as Old -> Current in the review list
    const REVIEW_FIELDS: [ keyof IFurniEditorItem, string ][] = [ [ 'width', 'Width' ], [ 'length', 'Length' ], [ 'modes', 'Modes' ], [ 'stackHeight', 'Height' ],
        [ 'allowWalk', 'Walk' ], [ 'allowSit', 'Sit' ], [ 'allowLay', 'Lay' ], [ 'allowStack', 'Stack' ], [ 'interactionType', 'Interaction' ], [ 'multiheight', 'Multiheight' ] ];

    // an asset that never loads / a scan that never ends: save what is known after this long
    const AUTO_RUN_WAIT = 10000;

    useEffect(() =>
    {
        if(!autoRun || !item || !form || busy || (form.id !== item.id) || (pageIndex < 0)) return;

        if(autoRunItem.current.id !== item.id) autoRunItem.current = { id: item.id, since: Date.now(), done: false };

        if(autoRunItem.current.done) return;

        // already edited (edit log / this session): don't scan it again, jump to the next furni that isn't
        if(skipEdited && editedIds.has(item.id))
        {
            autoRunItem.current.done = true;

            let next = pageIndex + 1;

            while((next < pageItems.length) && editedIds.has(pageItems[next].id)) next++;

            autoCount.current.skipped += (next - pageIndex);
            setAutoStatus(`${ autoCount.current.saved } done, ${ autoCount.current.changed } changed, ${ autoCount.current.skipped } skipped (already edited)`);
            setTimeout(() => step(next - pageIndex), 50);

            return;
        }

        const scanned = (scanFor.current === item.id) ? scan : null;
        // wall items (2026-09-28): their width / length mean nothing (every hotel stores 0x0, 1x0, 2x0...) and they are not
        // sat / laid / stacked on, so only the modes are checked; no size, pose, height or multiheight.
        const isWall = (form.type === 'i');
        const ready = isWall ? (!!measure && !autoTest) : (!!measure && !!sizeScan && !sizeScan.busy && !!scanned && !autoTest && !(stateHeights && stateHeights.busy));

        if(!ready && ((Date.now() - autoRunItem.current.since) < AUTO_RUN_WAIT))
        {
            const timer = setTimeout(() => setAutoTick(n => n + 1), 400);

            return () => clearTimeout(timer);
        }

        autoRunItem.current.done = true;

        const next: IFurniEditorItem = { ...form };
        const changes: string[] = [];

        if(autoApply.modes && measure && (Number(next.modes) !== measure.states)) { next.modes = measure.states; changes.push(`modes ${ measure.states }`); }

        const unsure: string[] = [];

        // Size (user rule): the asset's own size (the .nitro's logic dimensions) is the answer. Another size is only taken
        // when the other hotels agree on it (every reference hotel that has this furni, at least two); anything else
        // that disagrees with the asset is only flagged "unsure" for the review list, never applied.
        if(autoApply.size && !isWall)
        {
            const sized = references.filter(r => (r.width > 0) && (r.length > 0));
            const hotelsAgree = (sized.length >= 2) && sized.every(r => (r.width === sized[0].width) && (r.length === sized[0].length));
            const assetSize = (measure && (measure.width > 0) && (measure.length > 0)) ? { width: measure.width, length: measure.length } : null;
            let target: { width: number, length: number } = null;

            if(hotelsAgree && (!assetSize || (sized[0].width !== assetSize.width) || (sized[0].length !== assetSize.length)))
            {
                target = { width: sized[0].width, length: sized[0].length };
                if(assetSize) unsure.push(`hotels say ${ target.width }x${ target.length }, asset ${ assetSize.width }x${ assetSize.length } (took the hotels)`);
            }
            else if(assetSize)
            {
                target = assetSize;

                const others = sized.filter(r => (r.width !== assetSize.width) || (r.length !== assetSize.length));

                if(others.length) unsure.push(`asset ${ assetSize.width }x${ assetSize.length }, but ${ others.map(r => `${ r.source } ${ r.width }x${ r.length }`).join(', ') }`);
                // no "scan says" flag: on 100 furni whose size every hotel agrees on, the asset size was right 100 times and
                // the pixel scan only 91 (it misreads art drawn against the back or hanging over its tiles)
            }
            else unsure.push('no size in the asset - kept the current size');

            if(target && ((Number(next.width) !== target.width) || (Number(next.length) !== target.length)))
            {
                next.width = target.width;
                next.length = target.length;
                changes.push(`size ${ target.width }x${ target.length }`);
            }
        }

        if(autoApply.pose && !isWall && decision && decision.found)
        {
            const p: TestPose = (decision.pose === 'none') ? 'stack' : decision.pose;

            if(poseOf(next) !== p)
            {
                next.allowWalk = (p === 'std');
                next.allowSit = (p === 'sit');
                next.allowLay = (p === 'lay');
                if(p === 'stack') next.allowStack = true;
                changes.push(PoseLabel(p).toLowerCase());
            }
        }

        if(autoApply.height && !isWall && scanned)
        {
            // same rule as the "Scanned ... - use it" button: sit / lay from the seat or mattress top, else the surface
            const height = next.allowLay ? Math.round((scanned.bed + LAY_OFFSET) * 20) / 20 : next.allowSit ? SitHeight(scanned.seat) : scanned.surface;

            if((height !== null) && !isNaN(height) && (Number(next.stackHeight) !== height)) { next.stackHeight = String(height); changes.push(`height ${ height }`); }
        }

        // multiheight: only on furni without a special interaction (a gate, lamp or teleport changes its look per state
        // too, for other reasons)
        if(autoApply.height && !isWall && multiheightSuggestion && [ 'default', 'multiheight', '' ].includes(next.interactionType || '')
            && ((next.interactionType !== 'multiheight') || (next.multiheight !== multiheightSuggestion)))
        {
            next.interactionType = 'multiheight';
            next.multiheight = multiheightSuggestion;
            changes.push(`multiheight ${ multiheightSuggestion }`);
        }

        autoCount.current.saved++;
        if(changes.length) autoCount.current.changed++;

        if(changes.length || unsure.length)
        {
            const before = { ...form };
            // every field that really changed, old and current value, for the review list
            const diffs = REVIEW_FIELDS.filter(([ key ]) => String(before[key] ?? '') !== String(next[key] ?? ''))
                .map(([ key, label ]) => ({ field: label, old: String(before[key] ?? ''), current: String(next[key] ?? '') }));

            setReviewRows(prev => [ ...prev.filter(r => r.id !== before.id), { id: before.id, itemName: before.itemName, before, changes, diffs, unsure, status: 'pending' } ]);
        }
        setAutoStatus(`${ autoCount.current.saved } done, ${ autoCount.current.changed } changed - ${ item.itemName }: ${ changes.length ? changes.join(', ') : 'no changes' }`);

        setForm(next);
        setBusy(true);
        setNextAfterSave(true);
        SendMessageComposer(new FurniEditorUpdateComposer(next));
    }, [ autoRun, item, form, busy, measure, sizeScan, stateHeights, scan, autoTest, decision, references, autoTick, pageIndex, skipEdited, editedIds ]);

    // keyboard: Ctrl+S = save & next, Ctrl+X = skip to the next furni (a real "cut" while text is selected in a field)
    const keys = useRef<{ save: () => void, skip: () => void, nextPage: () => void }>(null);

    keys.current = { save: () => save(pageIndex >= 0), skip: () => { if(pageIndex >= 0) step(1); }, nextPage: () => { const node = nextCatalogNode(); if(node && activateNode) activateNode(node); else stopAutoRun('Done: reached the end of the catalog.'); } };

    useEffect(() =>
    {
        if(!isVisible || (tab !== TAB_EDIT)) return;

        const onKey = (event: KeyboardEvent) =>
        {
            if(!event.ctrlKey || event.altKey) return;

            const key = event.key.toLowerCase();

            if(key === 's') { event.preventDefault(); keys.current.save(); return; }

            if(key === 'x')
            {
                const field = document.activeElement as HTMLInputElement;
                const selecting = field && ('selectionStart' in field) && (field.selectionStart !== field.selectionEnd);

                if(selecting) return;

                event.preventDefault();
                keys.current.skip();
            }
        }

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [ isVisible, tab ]);

    if(!isVisible) return null;

    const pages = Math.max(1, Math.ceil(total / 20));
    const sizeMatches = measure && (measure.width === null || (Number(form?.width) === measure.width && Number(form?.length) === measure.length));
    const modesMatch = measure && (Number(form?.modes) === measure.states);
    const heightMatches = measure && (measure.height === null || Number(form?.stackHeight) === measure.height);

    // after deciding on the furni that is open, the next one still to check opens by itself
    const openNextToCheck = (decided: number[]) =>
    {
        if(!item || !decided.includes(item.id)) return;

        const order = reviewRows.filter(r => (r.status === 'pending') && !decided.includes(r.id));
        const after = reviewRows.findIndex(r => r.id === item.id);
        const next = order.find(r => reviewRows.indexOf(r) > after) || order[0];

        if(next) open(next.id);
    }

    const acceptChanges = (ids: number[]) =>
    {
        setReviewRows(prev => prev.map(r => ids.includes(r.id) ? { ...r, status: 'accepted' } : r));
        openNextToCheck(ids);
    }

    // saves the values from before the run again, one after the other (each save is logged, like any edit)
    const revertChanges = (ids: number[]) =>
    {
        const rows = reviewRows.filter(r => ids.includes(r.id) && (r.status === 'pending'));

        setReviewRows(prev => prev.map(r => rows.some(x => x.id === r.id) ? { ...r, status: 'reverting' } : r));

        rows.forEach((row, index) => setTimeout(() =>
        {
            reverting.current.add(row.id);
            SendMessageComposer(new FurniEditorUpdateComposer(row.before));
        }, index * 400));

        // the revert saves take a moment: move on once the last one is sent
        setTimeout(() => openNextToCheck(ids), rows.length * 400 + 300);
    }

    return (
        <>
        { showRename &&
            <FurniEditorRenameView caption={ pageCaption } pageId={ loadedPageId } pages={ catalogPages } onChoosePage={ choosePage } onNextPage={ goNextPage } items={ pageItems } hotelNames={ pageNames } words={ words } wordsVersion={ wordsVersion } onSaveWord={ saveWord } onClose={ () => setShowRename(false) }
                onFinished={ () => { reloadCatalogPage(); feedback('Bulk rename finished', 'success'); } }
                onRenamed={ (id, name) =>
                {
                    applyNameLocally(id, name);

                    if(item && (item.id === id)) { setItem(prev => ({ ...prev, publicName: name })); setForm(prev => ({ ...prev, publicName: name })); }
                } } /> }
        <NitroCardView uniqueKey="furni-editor" className={ `furni-editor ${ compact ? 'is-compact' : '' } ${ minimized ? 'is-minimized' : '' }` } theme="primary-slim"
            style={ minimized ? { width: 340, height: 'auto' } : { width: (compact ? 780 : 1120) + ((((showRunPages && !autoRun) || (showReview && (reviewRows.length > 0))) && compact) ? 330 : 0) + ((((showRunPages && !autoRun) || (showReview && (reviewRows.length > 0))) && !compact) ? 130 : 0), height: compact ? 620 : 670 } }>
            <NitroCardHeaderView headerText={ (minimized && item) ? `Furni Editor - #${ item.id } ${ item.itemName }` : 'Furni Editor' } onCloseClick={ () => setIsVisible(false) }
                buttonList={ [
                    ...(minimized ? [] : [ { iconElement: compact ? <FaExpandAlt title="Full layout" /> : <FaCompressAlt title="Compact: no catalog column, one field column" />, onClick: () => setCompact(value => !value) } ]),
                    { iconElement: minimized ? <FaWindowMaximize title="Open the editor again" /> : <FaWindowMinimize title="Minimize to the title bar (the room stays free)" />, onClick: () => setMinimized(value => !value) }
                ] } />
            { !minimized &&
            <NitroCardContentView>
                <NitroCardTabsView>
                    <NitroCardTabsItemView isActive={ tab === TAB_SEARCH } onClick={ () => setTab(TAB_SEARCH) }>Search</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ tab === TAB_PAGE } onClick={ () => setTab(TAB_PAGE) }>Catalog page</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ tab === TAB_EDIT } onClick={ () => item && setTab(TAB_EDIT) }>Edit</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ tab === TAB_WORDS } onClick={ () => setTab(TAB_WORDS) }>Words ({ words.length })</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ tab === TAB_TEAM } onClick={ () => setTab(TAB_TEAM) }>Team{ (activity && activity.staff.length) ? ` (${ activity.staff.length } here)` : '' }</NitroCardTabsItemView>
                </NitroCardTabsView>
                { /* the catalog's own tabs and page tree: picking a page here opens it in the catalog state, and the catalog
                     sync above loads its furni into the editor */ }
                { !compact &&
                <NitroCardTabsView small>
                    { rootNode && rootNode.children.filter(child => child.isVisible).map(child =>
                        <NitroCardTabsItemView key={ child.pageId } isActive={ child.isActive } onClick={ () => { if(searchResult) setSearchResult(null); activateNode(child); } }>
                            { child.localization } ({ child.pageId })
                        </NitroCardTabsItemView>) }
                    { !rootNode && <Text small className="furni-editor-muted">Loading catalog...</Text> }
                </NitroCardTabsView> }
                { notice && <Text small className={ `furni-editor-notice is-${ notice.kind }` }>{ notice.text }</Text> }
                <Flex gap={ 2 } fullHeight overflow="hidden">
                    { showRunPages && !autoRun &&
                        <FurniEditorRunPagesView pages={ runPages } busy={ busy } onRun={ pageIds => startAutoRun(pageIds) } onClose={ () => setShowRunPages(false) } /> }
                    { !(showRunPages && !autoRun) && (showReview && (reviewRows.length > 0)) &&
                        <FurniEditorReviewView rows={ reviewRows } currentId={ item ? item.id : 0 } onAccept={ acceptChanges } onRevert={ revertChanges } onOpen={ id => { open(id); setTab(TAB_EDIT); } } onClose={ () => setShowReview(false) } /> }
                    { !(showRunPages && !autoRun) && !(showReview && (reviewRows.length > 0)) && !compact &&
                    <Column className="furni-editor-catalog" fullHeight overflow="hidden">
                        { activeNodes && (activeNodes.length > 0) && <CatalogNavigationView node={ activeNodes[0] } showIds /> }
                        { (!activeNodes || !activeNodes.length) && <Text small className="furni-editor-muted p-1">Pick a catalog tab above.</Text> }
                    </Column> }
                    <Column fullWidth fullHeight overflow="hidden">
                { (tab === TAB_SEARCH) &&
                    <Column gap={ 1 } fullHeight overflow="hidden">
                        <Flex gap={ 1 } shrink>
                            <input className="form-control form-control-sm flex-grow-1" placeholder="Search by id, name or sprite id..." value={ query } onChange={ e => setQuery(e.target.value) } onKeyDown={ e => (e.key === 'Enter') && search(1) } />
                            <select className="form-select form-select-sm w-auto" value={ type } onChange={ e => setType(e.target.value) }>
                                <option value="">All</option>
                                <option value="s">Floor</option>
                                <option value="i">Wall</option>
                            </select>
                            <Button disabled={ busy } onClick={ () => search(1) }>Go</Button>
                        </Flex>
                        <ItemList items={ results } onSelect={ open } />
                        <Flex justifyContent="between" alignItems="center" shrink>
                            <Text small>{ total } results - { page }/{ pages }</Text>
                            <Flex gap={ 1 }>
                                <Button disabled={ page <= 1 || busy } onClick={ () => search(page - 1) }>Prev</Button>
                                <Button disabled={ page >= pages || busy } onClick={ () => search(page + 1) }>Next</Button>
                            </Flex>
                        </Flex>
                    </Column> }
                { (tab === TAB_PAGE) &&
                    <Column gap={ 1 } fullHeight overflow="hidden">
                        <Flex gap={ 1 } alignItems="center" justifyContent="between" shrink>
                            <Text small>{ pageCaption ? `${ pageCaption } - ${ pageItems.length } furni` : 'Open a page in the catalog, then load it here.' }</Text>
                            <Flex gap={ 1 }>
                                { autoRun ? <Button variant="danger" onClick={ () => stopAutoRun() }>Stop auto run</Button> : <Button variant="warning" disabled={ busy || !runPages.length } onClick={ () => { setShowRunPages(value => !value); setShowReview(false); } } title="Pick several catalog pages (or all of them) for Auto run">Auto run pages...</Button> }
                                <Button variant="dark" disabled={ !pageItems.length } onClick={ () => setShowRename(true) }>Rename page</Button>
                                <Button disabled={ !currentPage } onClick={ () => currentPage && loadPage(currentPage.pageId) }>Load open catalog page</Button>
                            </Flex>
                        </Flex>
                        { (othersHere.length > 0) &&
                            <Text small bold className="furni-editor-warn">{ othersHere.map(o => `${ o.name } (${ Ago(o.ago) })`).join(', ') } { (othersHere.length === 1) ? 'is' : 'are' } also on this page - pick another page or split the work.</Text> }
                        { (pageItems.length > 0) && <Text small className="furni-editor-muted">{ pageItems.filter(i => editedIds.has(i.id)).length } of { pageItems.length } already done.</Text> }
                        <ItemList items={ pageItems } activeIndex={ pageIndex } editors={ pageEditors } edited={ editedIds } onSelect={ id => { setPageIndex(pageItems.findIndex(i => i.id === id)); open(id); } } />
                    </Column> }
                { (tab === TAB_TEAM) &&
                    <Column gap={ 2 } fullHeight overflow="auto" className="furni-editor-team">
                        { !activity && <Text small>Loading...</Text> }
                        { activity &&
                            <>
                                <Column gap={ 1 } className="furni-editor-box">
                                    <Flex alignItems="center" justifyContent="between" gap={ 1 }>
                                        <Text small bold>Continue where you left off</Text>
                                        { autoRun ? <Button variant="danger" onClick={ () => stopAutoRun() }>Stop auto run</Button> : <Button variant="warning" disabled={ busy || !runPages.length } onClick={ () => { setShowRunPages(value => !value); setShowReview(false); } } title="Pick several catalog pages (or all of them) for Auto run">Auto run pages...</Button> }
                                    </Flex>
                                    { activity.mine
                                        ? <Flex gap={ 1 } alignItems="center" justifyContent="between">
                                            <Text small truncate>{ activity.mine.pageCaption ? `Page "${ activity.mine.pageCaption }"` : 'No page' }{ activity.mine.itemName ? `, furni ${ activity.mine.itemName }` : '' } - { Ago(activity.mine.ago) }</Text>
                                            <Button onClick={ () => goTo(activity.mine.itemId, activity.mine.pageId) }>Continue</Button>
                                        </Flex>
                                        : <Text small className="furni-editor-muted">Nothing yet.</Text> }
                                </Column>
                                <Column gap={ 1 } className="furni-editor-box">
                                    <Text small bold>In the editor now</Text>
                                    { activity.staff.map((s, i) => <Text key={ i } small><b>{ s.who }</b> - { s.pageCaption || 'no page' }{ s.itemName ? `, ${ s.itemName }` : '' } ({ Ago(s.ago) })</Text>) }
                                    { !activity.staff.length && <Text small className="furni-editor-muted">Only you.</Text> }
                                </Column>
                                <Column gap={ 1 } className="furni-editor-box">
                                    <Text small bold>Pages worked on</Text>
                                    { activity.pages.map(p =>
                                        <Flex key={ p.pageId } gap={ 2 } pointer className="furni-editor-row px-1" onClick={ () => goTo(0, p.pageId) } title="Continue with the first furni not done yet">
                                            <Text small truncate grow>{ p.caption || `Page ${ p.pageId }` }</Text>
                                            <Text small className={ (p.edited >= p.total) ? 'furni-editor-match' : '' }>{ p.edited }/{ p.total }</Text>
                                            <Text small className="furni-editor-muted" style={ { width: 150 } }>{ p.lastBy }, { Ago(p.ago) }</Text>
                                        </Flex>) }
                                    { !activity.pages.length && <Text small className="furni-editor-muted">No edits yet.</Text> }
                                </Column>
                                <Column gap={ 1 } className="furni-editor-box">
                                    <Text small bold>Recent edits</Text>
                                    { activity.edits.map((e, i) =>
                                        <Flex key={ i } gap={ 2 } pointer className="furni-editor-row px-1" onClick={ () => goTo(e.itemId, 0) } title="Open this furni on its catalog page">
                                            <Text small bold style={ { width: 110 } } truncate>{ e.who }</Text>
                                            <Text small truncate style={ { width: 170 } }>{ e.itemName || `#${ e.itemId }` }</Text>
                                            <Text small truncate grow className="furni-editor-muted">{ e.fields }</Text>
                                            <Text small className="furni-editor-muted" style={ { width: 80 } }>{ Ago(e.ago) }</Text>
                                        </Flex>) }
                                    { !activity.edits.length && <Text small className="furni-editor-muted">No edits yet.</Text> }
                                </Column>
                            </> }
                    </Column> }
                { (tab === TAB_WORDS) && <FurniEditorWordsView words={ words } onSave={ saveWord } /> }
                { (tab === TAB_EDIT) && form &&
                    <Flex gap={ 2 } fullHeight overflow="hidden">
                        <Column gap={ 1 } overflow="auto" className="furni-editor-side">
                            <FurniEditorPreview previewer={ previewer } previewerId={ previewerId } height={ 210 } stackHeight={ Number(form.stackHeight) }
                                width={ Number(form.width) } length={ Number(form.length) } multiheight={ form.multiheight } pose={ pose } wall={ form.type === 'i' }
                                avatarHeight={ avatarHeight } itemName={ form.itemName } stackItem={ stackItem } onHeight={ h => setHeight(String(h)) } onScan={ s => { if(s) scanFor.current = openedId.current; setScan(s); } } />
                            <Text small center className="furni-editor-muted">Click: state - Shift+Click: rotate - drag the ruler: height</Text>
                            <Column gap={ 1 } className="furni-editor-box">
                                <Flex alignItems="center" justifyContent="between">
                                    <Text small bold>Pose test</Text>
                                    <Button variant={ autoTest ? 'primary' : 'dark' } onClick={ () => setAutoTest(a => !a) }>{ autoTest ? 'Testing...' : 'Test again' }</Button>
                                </Flex>
                                <Flex gap={ 1 }>
                                    { ([ 'std', 'sit', 'lay', 'stack' ] as TestPose[]).map(p =>
                                        <Button key={ p } fullWidth variant={ (pose === p) ? 'primary' : testPoses.includes(p) ? 'secondary' : 'dark' }
                                            title={ testPoses.includes(p) ? 'Tested - click to leave it out' : 'Click to test only the ticked poses' }
                                            onClick={ () => toggleTestPose(p) }>{ testPoses.includes(p) ? '✓ ' : '' }{ PoseLabel(p) }</Button>) }
                                </Flex>
                                { (pose === 'stack') &&
                                    <Flex gap={ 1 } alignItems="center">
                                        <Text small className="furni-editor-muted">Test furni:</Text>
                                        <select className="form-select form-select-sm" value={ stackItem } onChange={ e => setStackItem(Number(e.target.value)) }>
                                            { STACK_TEST_ITEMS.map(i => <option key={ i.sprite } value={ i.sprite }>{ i.name }</option>) }
                                        </select>
                                    </Flex> }
                                { decision && !autoTest && (decision.found
                                    ? <Text small className={ poseMatches ? 'furni-editor-match' : '' }>{ poseMatches ? '✓ ' : '' }Found: { PoseLabel((decision.pose === 'none') ? 'stack' : decision.pose) }</Text>
                                    : <Text small>No clear answer - pick a pose yourself</Text>) }
                                { decision && !autoTest && <Text small className="furni-editor-muted">{ decision.why }</Text> }
                                { !autoTest && (pose !== 'none') && (poseOf(form) !== pose) &&
                                    <Button variant="warning" onClick={ () => applyPose(pose) }>Use: { PoseLabel(pose) }</Button> }
                                { decision && !autoTest && decision.found && decision.height && (Number(decision.height) !== Number(form.stackHeight)) &&
                                    <Button variant="primary" onClick={ () => applyHeight(decision.height) }>Reference height { decision.height } - use it</Button> }
                            </Column>
                            <Column gap={ 1 } className="furni-editor-box">
                                <Flex alignItems="center" justifyContent="between">
                                    <Text small bold>Test in room</Text>
                                    <Flex gap={ 1 }>
                                        <Button variant="primary" onClick={ () => SendMessageComposer(new FurniEditorTestFurniComposer(form.id)) }>Place</Button>
                                        { testFurni && testFurni.placed && <Button variant="dark" onClick={ () => SendMessageComposer(new FurniEditorTestFurniComposer(0)) }>Remove</Button> }
                                    </Flex>
                                </Flex>
                                { testFurni && <Text small className={ testFurni.placed ? 'furni-editor-match' : 'furni-editor-muted' }>{ testFurni.message }</Text> }
                            </Column>
                            <Column gap={ 1 } className="furni-editor-box">
                                <Text small bold>Asset data</Text>
                                { !measure && <Text small>Loading asset...</Text> }
                                { /* a missing / broken .nitro (grey box, or it never loads): get it from another hotel */ }
                                <Flex gap={ 1 } className="flex-wrap">
                                    <Button variant={ measure ? 'dark' : 'warning' } disabled={ !!download?.busy } onClick={ () => downloadAsset(false) }>Download missing from other hotels</Button>
                                    <Button variant="dark" disabled={ !!download?.busy } onClick={ () => downloadAsset(true) }>Replace ours</Button>
                                </Flex>
                                { download && <Text small className={ download.busy ? 'furni-editor-muted' : download.ok ? 'furni-editor-match' : '' }>{ download.busy ? 'Asking the other hotels...' : download.message }</Text> }
                                { measure && <>
                                    { modesMatch
                                        ? <Text small className="furni-editor-match">✓ Modes match ({ measure.states })</Text>
                                        : <Button variant="warning" onClick={ () => set('modes', measure.states) }>Set modes to { measure.states }</Button> }
                                    { (form.type !== 'i') && (measure.width !== null) && (sizeMatches
                                        ? <Text small className="furni-editor-match">✓ Asset size matches (W{ measure.width } x L{ measure.length })</Text>
                                        : <Button variant="warning" onClick={ () => { set('width', measure.width); set('length', measure.length); } }>Asset size W{ measure.width } x L{ measure.length } - use it</Button>) }
                                    { (measure.height !== null) && (heightMatches
                                        ? <Text small className="furni-editor-match">✓ Asset height matches ({ measure.height })</Text>
                                        : <Button variant="primary" onClick={ () => applyHeight(String(measure.height)) }>Asset height { measure.height } - use it</Button>) }
                                </> }
                                { /* the furni's icon and the icon of every catalog page that sells it */ }
                                <FurniEditorIconChecks itemName={ form.itemName } offers={ offers } rootNode={ rootNode } />
                            </Column>
                        </Column>
                        <Column gap={ 1 } fullWidth overflow="hidden">
                            <Flex gap={ 1 } alignItems="center" justifyContent="between">
                                <Column gap={ 0 } overflow="hidden">
                                    <Text bold truncate>#{ form.id } { form.itemName }</Text>
                                    <Text small truncate className="furni-editor-muted">{ form.publicName } - { form.type === 'i' ? 'wall' : 'floor' } - { form.usageCount } in use{ editedIds.has(form.id) ? ' - ✓ edited' : '' }</Text>
                                </Column>
                                { (pageIndex >= 0) &&
                                    <Flex gap={ 1 } alignItems="center" shrink>
                                        <Button variant="dark" onClick={ () => setShowRename(true) } title="Rename the furni of this catalog page">Rename page</Button>
                                        <Button disabled={ pageIndex <= 0 } onClick={ () => step(-1) }>Prev</Button>
                                        <Text small>{ pageIndex + 1 }/{ pageItems.length }</Text>
                                        <Button disabled={ (pageIndex >= pageItems.length - 1) && !(catalogVisible && nextCatalogNode()) } onClick={ () => step(1) }>{ (pageIndex >= pageItems.length - 1) ? 'Next page' : 'Next' }</Button>
                                    </Flex> }
                            </Flex>
                            <Flex gap={ 2 } fullHeight overflow="hidden" className="furni-editor-fields">
                            <Column gap={ 2 } fullWidth overflow="auto" className="furni-editor-scroll">
                                <Column gap={ 1 } className="furni-editor-box">
                                    <Text small bold>Name</Text>
                                    <Flex gap={ 1 }>
                                        <input className="form-control form-control-sm" value={ form.publicName ?? '' } onChange={ e => set('publicName', e.target.value) } />
                                        { NeedsTranslation(form.publicName) &&
                                            <Button variant="primary" onClick={ () => set('publicName', TranslateFurniName(form.publicName)) }>Translate: { TranslateFurniName(form.publicName) }</Button> }
                                    </Flex>
                                    <WordChips name={ form.publicName } onPick={ setNamePrefill } />
                                    { namePrefill && <WordForm prefill={ namePrefill } words={ words } onSave={ (w, e, k) => { saveWord(w, e, k); setNamePrefill(null); } } /> }
                                    <div className="furni-editor-names">
                                        { nameCandidates.map(c =>
                                            <div key={ c.name } className={ `furni-editor-name ${ (c.name === form.publicName) ? 'active' : '' }` }>
                                                <div className="line">
                                                    <span className="name" title="Use this name" onClick={ () => set('publicName', c.name) }>{ c.name }</span>
                                                    { c.english && (c.english !== c.name) &&
                                                        <span className="english" title="Use the English version" onClick={ () => set('publicName', c.english) }>→ { c.english }</span> }
                                                </div>
                                                <div className="sources">{ c.sources.join(' · ') }</div>
                                            </div>) }
                                    </div>
                                    <Flex alignItems="center" justifyContent="between">
                                        <Text small className="furni-editor-muted">Saving also renames catalog offers + FurnitureData.</Text>
                                        <Button variant="dark" disabled={ !pageItems.length } onClick={ () => setShowRename(true) } title="Rename many furni of this catalog page at once">Bulk rename...</Button>
                                    </Flex>
                                </Column>
                                <Column gap={ 1 } className="furni-editor-box">
                                    <Text small bold>Size</Text>
                                    <Flex gap={ 1 }>
                                        <Field label="Width" value={ form.width } onChange={ v => set('width', Number(v)) } />
                                        <Field label="Length" value={ form.length } onChange={ v => set('length', Number(v)) } />
                                        <Field label="Modes" value={ form.modes } onChange={ v => set('modes', Number(v)) } />
                                    </Flex>
                                    { (form.type === 'i') && <Text small className="furni-editor-muted">Wall item: width / length are not used for wall items, so they are not scanned or suggested.</Text> }
                                    { sizeScan && sizeScan.busy && <Text small className="furni-editor-muted">Scanning the size over all states...</Text> }
                                    { /* the asset size (the .nitro file) is the answer; the pixel scan is only offered when the asset has none */ }
                                    { sizeScan && !sizeScan.busy && (sizeScan.width > 0) && hasAssetSize && ((sizeScan.width !== measure.width) || (sizeScan.length !== measure.length)) &&
                                        <Text small className="furni-editor-muted" title="The pixel scan is only a fallback: art drawn against the back or hanging over its tiles fools it">Pixel scan saw W{ sizeScan.width } x L{ sizeScan.length } - the asset size W{ measure.width } x L{ measure.length } counts.</Text> }
                                    { sizeScan && !sizeScan.busy && (sizeScan.width > 0) && !hasAssetSize && ((sizeScan.width === Number(form.width) && sizeScan.length === Number(form.length))
                                        ? <Text small className="furni-editor-match">✓ Scanned size matches (W{ sizeScan.width } x L{ sizeScan.length })</Text>
                                        : <Button variant="warning" onClick={ () => { set('width', sizeScan.width); set('length', sizeScan.length); } }>No asset size - scanned W{ sizeScan.width } x L{ sizeScan.length }, use it</Button>) }
                                    <Column gap={ 0 }>
                                        <Text small bold>Stack height</Text>
                                        <Flex gap={ 1 } alignItems="center" className="furni-editor-stepper">
                                            { HEIGHT_STEPS.map(step => <button key={ `down-${ step }` } type="button" title={ `Lower by ${ step }` } onClick={ () => stepHeight(-step) }>-{ step }</button>) }
                                            <input className="form-control form-control-sm" value={ form.stackHeight ?? '' } onChange={ e => setHeight(e.target.value) } />
                                            { [ ...HEIGHT_STEPS ].reverse().map(step => <button key={ `up-${ step }` } type="button" title={ `Raise by ${ step }` } onClick={ () => stepHeight(step) }>+{ step }</button>) }
                                        </Flex>
                                        { seatPose && fit && (fit.itemId === form.id) &&
                                            <Column gap={ 0 }>
                                                <Text small className="furni-editor-muted">
                                                    { fit.busy ? 'Fitting the avatar on the seat: ' : 'Fitted: ' }{ fit.steps.map(s => `${ s.height } (${ s.gap > 0 ? '+' : '' }${ s.gap }px)`).join(' → ') }
                                                </Text>
                                                { !fit.busy && (fit.height !== null) && ((fit.height === Number(form.stackHeight))
                                                    ? <Text small className="furni-editor-match">✓ Fitted { seatPose } height matches ({ fit.height })</Text>
                                                    : <Button variant="success" onClick={ () => applyHeight(String(fit.height)) }>Fitted { seatPose } height { fit.height } - use it</Button>) }
                                                { !fit.busy && (fit.height === null) && <Text small className="furni-editor-muted">The fit could not measure the avatar here.</Text> }
                                            </Column> }
                                        { seatPose && scan && !(fit && fit.busy) && <Button variant="dark" onClick={ runFit }>Fit avatar (beta)</Button> }
                                        { (scannedHeight !== null) && ((scannedHeight === Number(form.stackHeight))
                                            ? <Text small className="furni-editor-match">✓ Scanned { scannedLabel } matches ({ scannedHeight })</Text>
                                            : <Button variant="primary" onClick={ () => applyHeight(String(scannedHeight)) }>Scanned { scannedLabel } { scannedHeight } - use it</Button>) }
                                    </Column>
                                    <Field label="Multiheight (one height per state, ; between)" value={ form.multiheight } onChange={ v => set('multiheight', v) } placeholder="e.g. 0.5;1;1.5" />
                                    { stateHeights && stateHeights.busy && <Text small className="furni-editor-muted">Scanning the height of every state...</Text> }
                                    { multiheightSuggestion && ((form.interactionType === 'multiheight') && (form.multiheight === multiheightSuggestion)
                                        ? <Text small className="furni-editor-match">✓ Multiheight matches the states ({ multiheightSuggestion })</Text>
                                        : <Button variant="warning" onClick={ () => { set('interactionType', 'multiheight'); set('multiheight', multiheightSuggestion); } }>States have different heights ({ multiheightSuggestion }) - make it multiheight</Button>) }
                                    { stateHeights && !stateHeights.busy && stateHeights.heights && !multiheightSuggestion && <Text small className="furni-editor-muted">Every state has the same height (not multiheight).</Text> }
                                </Column>
                            </Column>
                            <Column gap={ 2 } fullWidth overflow="auto" className="furni-editor-scroll">
                                <Column gap={ 1 } className="furni-editor-box">
                                    <Text small bold>Behaviour</Text>
                                    <Column gap={ 0 }>
                                        <Text small>Interaction</Text>
                                        <select className="form-select form-select-sm" value={ form.interactionType } onChange={ e => set('interactionType', e.target.value) }>
                                            { !interactions.includes(form.interactionType) && <option value={ form.interactionType }>{ form.interactionType }</option> }
                                            { interactions.map(i => <option key={ i } value={ i }>{ i }</option>) }
                                        </select>
                                    </Column>
                                    <div className="furni-editor-flags">
                                        { FLAGS.map(([ key, label ]) =>
                                            <label key={ key } className="d-flex align-items-center gap-1 small">
                                                <input type="checkbox" className="form-check-input" checked={ !!form[key] } onChange={ e => set(key, e.target.checked as never) } />
                                                { label }
                                            </label>) }
                                    </div>
                                </Column>
                                <Column gap={ 1 } className="furni-editor-box">
                                    <Text small bold>Advanced</Text>
                                    <Flex gap={ 1 }>
                                        <Field label="Custom params" value={ form.customparams } onChange={ v => set('customparams', v) } />
                                        <Field label="Vending ids" value={ form.vendingIds } onChange={ v => set('vendingIds', v) } />
                                    </Flex>
                                    <Flex gap={ 1 }>
                                        <Field label="Effect (M)" value={ form.effectMale } onChange={ v => set('effectMale', Number(v)) } />
                                        <Field label="Effect (F)" value={ form.effectFemale } onChange={ v => set('effectFemale', Number(v)) } />
                                        <Field label="Clothing on walk" value={ form.clothingOnWalk } onChange={ v => set('clothingOnWalk', v) } />
                                    </Flex>
                                    { !!offers.length &&
                                        <Text small className="furni-editor-muted">Sold on: { offers.map(o => `${ o.pageName } (#${ o.pageId })`).join(', ') }</Text> }
                                </Column>
                            </Column>
                            </Flex>
                            <Flex gap={ 1 } justifyContent="end" alignItems="center">
                                { (pageIndex >= 0) && <>
                                    { autoStatus && <Text small truncate className="furni-editor-muted furni-editor-auto-status" title={ autoStatus }>{ autoStatus }</Text> }
                                    { !autoRun && (reviewRows.length > 0) && <Button variant="dark" onClick={ () => setShowReview(true) }>Review ({ reviewRows.filter(r => r.status === 'pending').length })</Button> }
                                    { !autoRun && ([ [ 'modes', 'Modes' ], [ 'size', 'Size' ], [ 'pose', 'Pose' ], [ 'height', 'Height' ] ] as [ keyof typeof autoApply, string ][]).map(([ key, label ]) =>
                                        <label key={ key } className="d-flex align-items-center gap-1 text-nowrap" title="Auto run applies this suggestion">
                                            <input type="checkbox" className="form-check-input" checked={ autoApply[key] } onChange={ e => setAutoApply(prev => ({ ...prev, [key]: e.target.checked })) } />
                                            <Text small>{ label }</Text>
                                        </label>) }
                                    { !autoRun &&
                                        <label className="d-flex align-items-center gap-1 text-nowrap" title="Auto run skips furni already edited (edit log), so they aren't scanned again">
                                            <input type="checkbox" className="form-check-input" checked={ skipEdited } onChange={ e => setSkipEdited(e.target.checked) } />
                                            <Text small>Skip edited</Text>
                                        </label> }
                                    { autoRun
                                        ? <Button variant="danger" onClick={ () => stopAutoRun() }>Stop</Button>
                                        : <Button variant="warning" disabled={ busy } onClick={ () => startAutoRun() } title="Go through every furni from here on: apply the ticked suggestions, save & next, page after page">Auto run</Button> }
                                </> }
                                { !autoRun && <Button variant="warning" disabled={ busy || !runPages.length } onClick={ () => { setShowRunPages(value => !value); setShowReview(false); } } title="Pick several catalog pages (or all of them) for Auto run">Auto run pages...</Button> }
                                <Button variant="dark" disabled={ autoRun } onClick={ () => setForm({ ...item }) }>Reset</Button>
                                <Button variant="success" disabled={ busy } onClick={ () => save(false) }>{ busy ? 'Saving...' : 'Save' }</Button>
                                { (pageIndex >= 0) &&
                                    <Button variant="success" disabled={ busy } onClick={ () => save(true) } title="Ctrl+S">Save & next</Button> }
                            </Flex>
                        </Column>
                    </Flex> }
                    </Column>
                </Flex>
            </NitroCardContentView> }
        </NitroCardView>
        </>
    );
}

const Field: FC<{ label: string, value: string | number, onChange: (value: string) => void, placeholder?: string }> = ({ label, value, onChange, placeholder }) =>
    <Column gap={ 0 } fullWidth>
        <Text small bold>{ label }</Text>
        <input className="form-control form-control-sm" value={ value ?? '' } placeholder={ placeholder } onChange={ e => onChange(e.target.value) } />
    </Column>;

const ItemList: FC<{ items: IFurniEditorItem[], activeIndex?: number, editors?: Map<number, { name: string, ago: number }>, edited?: Set<number>, onSelect: (id: number) => void }> = ({ items, activeIndex = -1, editors = null, edited = null, onSelect }) =>
    <Column gap={ 0 } fullHeight overflow="auto" className="furni-editor-list">
        { items.map((i, index) =>
            <Flex key={ i.id } gap={ 2 } pointer className={ `furni-editor-row px-1 ${ index === activeIndex ? 'active' : '' }` } onClick={ () => onSelect(i.id) }>
                <Text small style={ { width: 70 } }>{ i.id }</Text>
                <Text small truncate style={ { width: 190 } }>{ i.itemName }</Text>
                <Text small truncate grow>{ i.publicName }</Text>
                <Text small style={ { width: 90 } }>{ i.interactionType || 'default' }</Text>
                { (editors || edited) &&
                    <Text small truncate style={ { width: 150 } } className={ (edited && edited.has(i.id)) ? 'furni-editor-match' : 'furni-editor-muted' }>
                        { editors && editors.has(i.id) ? `✓ ${ editors.get(i.id).name }, ${ Ago(editors.get(i.id).ago) }` : (edited && edited.has(i.id)) ? '✓ edited' : 'to do' }
                    </Text> }
            </Flex>) }
        { !items.length && <Text small center className="p-2">No furni found</Text> }
    </Column>;
