import { FC, useEffect, useMemo, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { FurniEditorRenameComposer, FurniEditorRenameResultEvent, IFurniEditorHotelName, IFurniEditorItem, IFurniEditorWord } from '../../api/furni-editor/FurniEditorProtocol';
import { Button, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useMessageEvent } from '../../hooks';
import { ConvertClassname, IsPlaceholderName, LooksLikeClassname, NeedsTranslation, TranslateFurniName } from './FurniNames';
import { IWordPrefill, SaveWord, WordChips, WordForm } from './FurniEditorWordsView';

// Bulk rename modal of the Furni Editor (opened with "Bulk rename..." / "Rename page"): every furni of the loaded catalog
// page in one table - tick | classname | current name | new name | status. The new name is editable and has a dropdown
// of that furni's names in other hotels (all languages, most used first, with the English version where it differs).
// Bulk actions fill the new name of every ticked row: best English hotel name, translate the current name, name made
// from the classname, or keep the current one. Rows whose name is clearly not a proper English name start ticked.
// Apply renames the ticked rows one by one (FurniEditorRenameComposer: items_base, catalog offers, FurnitureData.json,
// audit log).

interface Row
{
    id: number;
    itemName: string;
    current: string;
    suggestion: string;
    source: string;       // the chosen hotel's own name the suggestion came from ('' = none)
    options: { name: string, label: string }[];
    checked: boolean;
    auto: boolean;        // suggestion made by the tool (re-made when a word is added); false once typed / picked by hand
    status: '' | 'saving' | 'done' | 'error';
    message: string;
}

const needsRename = (item: IFurniEditorItem) => LooksLikeClassname(item.publicName, item.itemName) || NeedsTranslation(item.publicName) || /[^\x00-\x7F]/.test(item.publicName || '');

const bestEnglish = (names: IFurniEditorHotelName[]) => (names || []).find(n => n.languages.split(',').includes('en') && !IsPlaceholderName(n.name))?.name || '';

const fromClassname = (item: IFurniEditorItem) => ConvertClassname(item.itemName) || item.publicName;

const translated = (item: IFurniEditorItem) => LooksLikeClassname(item.publicName, item.itemName) ? fromClassname(item) : TranslateFurniName(item.publicName);

// best first guess: English hotel name, else made from the classname, else translated
const suggest = (item: IFurniEditorItem, names: IFurniEditorHotelName[]) => bestEnglish(names) || translated(item) || item.publicName;

const optionsFor = (item: IFurniEditorItem, names: IFurniEditorHotelName[]) =>
{
    const seen = new Set<string>();
    const list: { name: string, label: string }[] = [];
    const add = (name: string, label: string) =>
    {
        const value = (name || '').replace(/\s+/g, ' ').trim();

        if(!value || seen.has(value) || IsPlaceholderName(value)) return;

        seen.add(value);
        list.push({ name: value, label });
    }

    add(item.publicName, 'current');
    add(fromClassname(item), 'from classname');
    add(TranslateFurniName(item.publicName), 'translated');

    for(const n of (names || []))
    {
        add(n.name, `${ n.hotels } hotel${ n.hotels === 1 ? '' : 's' }, ${ n.languages }`);

        if(NeedsTranslation(n.name)) add(TranslateFurniName(n.name), `translated from ${ n.languages }`);
    }

    return list;
}

export interface IRenamePage { pageId: number, label: string }

export const FurniEditorRenameView: FC<{ caption: string, pageId: number, pages: IRenamePage[], items: IFurniEditorItem[], hotelNames: Map<number, IFurniEditorHotelName[]>,
    words: IFurniEditorWord[], wordsVersion: number, onSaveWord: SaveWord,
    onClose: () => void, onRenamed: (id: number, name: string) => void, onFinished: () => void, onChoosePage: (pageId: number) => void, onNextPage: () => void }> = props =>
{
    const { caption, pageId, pages, items, hotelNames, words, wordsVersion, onSaveWord, onClose, onRenamed, onFinished, onChoosePage, onNextPage } = props;
    const [ wordPrefill, setWordPrefill ] = useState<IWordPrefill>(null);
    // find & replace in the "New name" column
    const [ findText, setFindText ] = useState('');
    const [ replaceText, setReplaceText ] = useState('');
    const [ matchCase, setMatchCase ] = useState(false);
    const [ rows, setRows ] = useState<Row[]>([]);
    const [ running, setRunning ] = useState(false);
    const [ nextAfter, setNextAfter ] = useState(false);   // "Apply & next page": move on once the renames are done
    const [ hotel, setHotel ] = useState('');   // '' = best English name over all hotels

    // hotels naming furni on this page, most furni first
    const hotels = useMemo(() =>
    {
        const count = new Map<string, number>();

        for(const list of hotelNames.values())
        {
            const seen = new Set<string>();

            for(const n of list) for(const h of (n.hotelList || '').split(',').filter(Boolean)) if(!seen.has(h)) { seen.add(h); count.set(h, (count.get(h) || 0) + 1); }
        }

        return [ ...count.entries() ].sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]));
    }, [ hotelNames ]);

    // fill every row from one hotel: its own name for the furni, translated into English (word order too) when needed
    const fromHotel = (row: Row, value: string): Row =>
    {
        const item = items.find(i => i.id === row.id);
        const names = hotelNames.get(row.id) || [];

        if(!value)
        {
            const suggestion = item ? suggest(item, names) : row.suggestion;

            return { ...row, source: '', suggestion, auto: true, checked: (suggestion !== row.current) && !!item && needsRename(item) };
        }

        const own = names.find(n => (n.hotelList || '').split(',').includes(value));

        if(!own || IsPlaceholderName(own.name)) return { ...row, source: '', auto: true, checked: false };

        const suggestion = NeedsTranslation(own.name) ? TranslateFurniName(own.name) : own.name;

        return { ...row, source: own.name, suggestion, auto: true, checked: suggestion !== row.current };
    }

    const pickHotel = (value: string) =>
    {
        setHotel(value);
        setRows(prev => prev.map(row => fromHotel(row, value)));
    }

    // The table is only rebuilt when another page (another set of furni) or its hotel names arrive. A saved rename only
    // changes that furni's name in "items": rebuilding then reset every row still waiting to be saved (ticks, chosen
    // hotel, edited names), so part of a bulk Apply was never sent.
    const itemIds = items.map(i => i.id).join(',');

    useEffect(() =>
    {
        setRows(items.map(item =>
        {
            const names = hotelNames.get(item.id);
            const suggestion = suggest(item, names);
            const row: Row = { id: item.id, itemName: item.itemName, current: item.publicName, suggestion, source: '', options: optionsFor(item, names), checked: !!suggestion && (suggestion !== item.publicName) && needsRename(item), auto: true, status: '', message: '' };

            return hotel ? fromHotel(row, hotel) : row;
        }));
    }, [ itemIds, hotelNames ]);

    // a word was added / changed: every suggestion the tool made (and not saved yet) is made again with it
    useEffect(() =>
    {
        if(!wordsVersion) return;

        setRows(prev => prev.map(row =>
        {
            if(!row.auto || (row.status !== '')) return row;

            if(hotel) return { ...fromHotel(row, hotel), checked: row.checked };

            const item = items.find(i => i.id === row.id);

            return item ? { ...row, suggestion: suggest(item, hotelNames.get(row.id)), options: optionsFor(item, hotelNames.get(row.id)) } : row;
        }));
    }, [ wordsVersion ]);

    // same furni, new names (a rename saved here or in the editor): only the "current name" column follows
    useEffect(() => setRows(prev => prev.map(row =>
    {
        const item = items.find(i => i.id === row.id);

        return (item && (item.publicName !== row.current)) ? { ...row, current: item.publicName } : row;
    })), [ items ]);

    const update = (id: number, change: Partial<Row>) => setRows(prev => prev.map(row => (row.id === id) ? { ...row, ...change } : row));

    // fill the new name of every ticked row
    const fill = (pick: (item: IFurniEditorItem, row: Row) => string) => setRows(prev => prev.map(row =>
    {
        if(!row.checked) return row;

        const item = items.find(i => i.id === row.id);
        const value = item ? pick(item, row) : '';

        return value ? { ...row, suggestion: value, auto: true } : row;
    }));

    // Translate: the picked hotel's own name when a hotel is chosen, otherwise the current name
    const translateRow = (item: IFurniEditorItem, row: Row) => row.source ? TranslateFurniName(row.source) : translated(item);

    // renames go one at a time: the next is sent when the previous answer is in
    useEffect(() =>
    {
        if(!running) return;

        if(rows.some(row => row.status === 'saving')) return;

        const next = rows.find(row => row.checked && (row.status === ''));

        if(!next)
        {
            setRunning(false);
            onFinished();

            if(nextAfter) { setNextAfter(false); onNextPage(); }

            return;
        }

        update(next.id, { status: 'saving' });
        SendMessageComposer(new FurniEditorRenameComposer(next.id, next.suggestion));
    }, [ running, rows ]);

    useMessageEvent<FurniEditorRenameResultEvent>(FurniEditorRenameResultEvent, event =>
    {
        const parser = event.getParser();

        update(parser.id, parser.success ? { status: 'done', message: parser.message, checked: false, current: parser.name } : { status: 'error', message: parser.message, checked: false });

        if(parser.success) onRenamed(parser.id, parser.name);
    });

    const checkedCount = rows.filter(row => row.checked).length;

    // every row whose new name contains the text (ignoring case unless "Match case"); saved / saving rows are left alone
    const findPattern = findText ? new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? 'g' : 'gi') : null;
    const replaceable = (row: Row) => !!findPattern && ((row.status === '') || (row.status === 'error')) && (row.suggestion.search(findPattern) >= 0);
    const replaceCount = rows.filter(replaceable).length;

    const replaceAll = () => setRows(prev => prev.map(row =>
    {
        if(!replaceable(row)) return row;

        const suggestion = row.suggestion.replace(findPattern, () => replaceText).replace(/\s+/g, ' ').trim();

        return { ...row, suggestion, auto: false, status: '', checked: !!suggestion && (suggestion !== row.current) };
    }));

    const pending = rows.filter(row => row.status === 'saving' || (row.checked && row.status === '')).length;

    return (
        <NitroCardView uniqueKey="furni-editor-rename" className="furni-editor furni-editor-bulk" theme="primary-slim" style={ { width: 980, height: 620 } }>
            <NitroCardHeaderView headerText={ `Bulk rename: ${ caption }` } onCloseClick={ onClose } />
            <NitroCardContentView>
                <Flex gap={ 1 } alignItems="center" justifyContent="between" className="furni-editor-bulk-toolbar">
                    <Text small>{ rows.length } furni - <b>{ checkedCount }</b> ticked</Text>
                    <Flex gap={ 1 } alignItems="center">
                        <Button variant="dark" disabled={ running } onClick={ () => setRows(prev => prev.map(r => ({ ...r, checked: r.suggestion !== r.current }))) }>Tick changed</Button>
                        <Button variant="dark" disabled={ running } onClick={ () => setRows(prev => prev.map(r => ({ ...r, checked: false }))) }>Untick all</Button>
                        <Text small className="furni-editor-muted">Fill ticked:</Text>
                        <Button variant="primary" disabled={ running || !checkedCount } onClick={ () => fill(item => bestEnglish(hotelNames.get(item.id))) }>Best English</Button>
                        <Button variant="primary" disabled={ running || !checkedCount } onClick={ () => fill(translateRow) }>Translate</Button>
                        <Button variant="primary" disabled={ running || !checkedCount } onClick={ () => fill(fromClassname) }>From classname</Button>
                        <Button variant="dark" disabled={ running || !checkedCount } onClick={ () => fill(item => item.publicName) }>Keep current</Button>
                        <Button variant="success" disabled={ running || !checkedCount } onClick={ () => setRunning(true) }>{ running ? `Renaming... (${ pending })` : `Apply (${ checkedCount })` }</Button>
                    </Flex>
                </Flex>
                <Flex gap={ 1 } alignItems="center" className="furni-editor-bulk-toolbar">
                    <Text small className="furni-editor-muted">Hotel:</Text>
                    <select className="form-select form-select-sm furni-editor-bulk-hotels" value={ hotel } disabled={ running } onChange={ e => pickHotel(e.target.value) }>
                        <option value="">Best English (all hotels)</option>
                        { hotels.map(([ h, n ]) => <option key={ h } value={ h }>{ h } ({ n } furni)</option>) }
                    </select>
                    <Text small className="furni-editor-muted">Page:</Text>
                    <select className="form-select form-select-sm furni-editor-bulk-pages" value={ pageId } disabled={ running } onChange={ e => onChoosePage(Number(e.target.value)) }>
                        { !pages.some(p => p.pageId === pageId) && <option value={ pageId }>{ caption }</option> }
                        { pages.map(p => <option key={ p.pageId } value={ p.pageId }>{ p.label }</option>) }
                    </select>
                    <Button variant="dark" disabled={ running } onClick={ onNextPage }>Next page ›</Button>
                    <Button variant="success" disabled={ running } onClick={ () => { if(checkedCount) { setNextAfter(true); setRunning(true); } else onNextPage(); } }>
                        { checkedCount ? `Apply (${ checkedCount }) & next page` : 'Next page (nothing ticked)' }
                    </Button>
                </Flex>
                <Flex gap={ 1 } alignItems="center" className="furni-editor-bulk-toolbar furni-editor-bulk-replace">
                    <Text small className="furni-editor-muted">Find:</Text>
                    <input className="form-control form-control-sm" placeholder="Text in the new names" value={ findText } disabled={ running } onChange={ e => setFindText(e.target.value) } onKeyDown={ e => (e.key === 'Enter') && !!replaceCount && replaceAll() } />
                    <Text small className="furni-editor-muted">Replace with:</Text>
                    <input className="form-control form-control-sm" placeholder="(empty = remove it)" value={ replaceText } disabled={ running } onChange={ e => setReplaceText(e.target.value) } onKeyDown={ e => (e.key === 'Enter') && !!replaceCount && replaceAll() } />
                    <label className="d-flex align-items-center gap-1 text-nowrap">
                        <input type="checkbox" className="form-check-input" checked={ matchCase } disabled={ running } onChange={ e => setMatchCase(e.target.checked) } />
                        <Text small>Match case</Text>
                    </label>
                    <Button variant="primary" disabled={ running || !replaceCount } onClick={ replaceAll } title="Replace it in every row's new name and tick the rows that change">Replace ({ replaceCount })</Button>
                </Flex>
                <Flex gap={ 1 } alignItems="center" className="furni-editor-bulk-toolbar">
                    <Text small className="furni-editor-muted" title="Click a word under a row to fill this in">Teach a word:</Text>
                    <WordForm prefill={ wordPrefill } words={ words } onSave={ onSaveWord } />
                </Flex>
                <div className="furni-editor-bulk-table">
                    <div className="bulk-row bulk-head">
                        <input type="checkbox" className="form-check-input" checked={ !!rows.length && rows.every(r => r.checked) } disabled={ running } onChange={ e => setRows(prev => prev.map(r => ({ ...r, checked: e.target.checked }))) } />
                        <span>Classname</span>
                        <span>Current name</span>
                        <span>New name</span>
                        <span></span>
                    </div>
                    <div className="bulk-body">
                        { rows.map(row =>
                            <div key={ row.id } className={ `bulk-row ${ row.checked ? 'ticked' : '' }` }>
                                <input type="checkbox" className="form-check-input" checked={ row.checked } disabled={ running } onChange={ e => update(row.id, { checked: e.target.checked }) } />
                                <span className="cell" title={ `#${ row.id } ${ row.itemName }` }>{ row.itemName }</span>
                                <span className="cell" title={ row.current }>{ row.current }</span>
                                <div className="new-name">
                                    <div className="new-name-line">
                                    <input className="form-control form-control-sm" value={ row.suggestion } disabled={ running }
                                        onChange={ e => update(row.id, { suggestion: e.target.value, auto: false, checked: e.target.value.trim() !== row.current }) } />
                                    <select className="form-select form-select-sm" value="" disabled={ running } title="Names this furni has in other hotels"
                                        onChange={ e => e.target.value && update(row.id, { suggestion: e.target.value, auto: false, checked: e.target.value !== row.current }) }>
                                        <option value="">{ row.options.length } names</option>
                                        { row.options.map(o => <option key={ o.name } value={ o.name }>{ o.name } ({ o.label })</option>) }
                                    </select>
                                    </div>
                                    { row.source && (row.source !== row.suggestion) &&
                                        <div className="hints">
                                            <span title="This hotel's own name">{ row.source }</span>
                                        </div> }
                                    <WordChips name={ row.source || row.current } onPick={ setWordPrefill } />
                                </div>
                                <span className={ `status ${ row.status }` } title={ row.message }>
                                    { (row.status === 'saving') ? '...' : (row.status === 'done') ? '✓' : (row.status === 'error') ? '✗' : '' }
                                </span>
                            </div>) }
                    </div>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
}
