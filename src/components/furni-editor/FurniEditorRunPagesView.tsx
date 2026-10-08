import { FC, useMemo, useState } from 'react';
import { Button, Flex, Text } from '../../common';

export interface IRunPage { pageId: number, caption: string, depth: number }

interface Props
{
    pages: IRunPage[];   // every visible catalog page, in the catalog tree's order
    busy: boolean;
    onRun: (pageIds: number[]) => void;
    onClose: () => void;
}

// Auto run over chosen catalog pages, docked in the editor like the review panel (same classes). Ticking a category
// ticks every page under it; the run goes through the ticked pages in catalog order and stops after the last one.
export const FurniEditorRunPagesView: FC<Props> = props =>
{
    const { pages, busy, onRun, onClose } = props;
    const [ ticked, setTicked ] = useState<Set<number>>(() => new Set());
    const [ filter, setFilter ] = useState('');

    // the page itself and every page under it (the rows after it that are deeper)
    const branch = (index: number) =>
    {
        const ids = [ pages[index].pageId ];

        for(let i = index + 1; (i < pages.length) && (pages[i].depth > pages[index].depth); i++) ids.push(pages[i].pageId);

        return ids;
    }

    const toggle = (index: number) => setTicked(prev =>
    {
        const next = new Set(prev);
        const on = !prev.has(pages[index].pageId);

        for(const id of branch(index)) on ? next.add(id) : next.delete(id);

        return next;
    });

    const shown = useMemo(() =>
    {
        const text = filter.trim().toLowerCase();

        return pages.map((page, index) => ({ page, index })).filter(({ page }) => !text || page.caption.toLowerCase().includes(text));
    }, [ pages, filter ]);

    const run = pages.filter(page => ticked.has(page.pageId)).map(page => page.pageId);

    return (
        <div className="furni-editor-review-dock furni-editor-run-pages">
            <Flex alignItems="center" justifyContent="between" gap={ 1 }>
                <Text small bold>Auto run pages: { run.length } ticked</Text>
                <Button variant="dark" onClick={ onClose } title="Close">✕</Button>
            </Flex>
            <Flex gap={ 1 } className="flex-wrap">
                <Button variant="warning" disabled={ busy || !run.length } title="Auto run the ticked pages, in catalog order" onClick={ () => (!busy && run.length) && onRun(run) }>Run ticked ({ run.length })</Button>
                <Button variant="warning" disabled={ busy || !pages.length } title="Auto run the whole catalog, from the first page" onClick={ () => (!busy && pages.length) && onRun(pages.map(page => page.pageId)) }>Run all ({ pages.length })</Button>
                <Button variant="dark" disabled={ !ticked.size } onClick={ () => setTicked(new Set()) }>None</Button>
            </Flex>
            <input className="form-control form-control-sm" placeholder="Filter pages..." value={ filter } onChange={ e => setFilter(e.target.value) } />
            <div className="review-list">
                { !shown.length && <Text small className="furni-editor-muted p-1">No pages.</Text> }
                { shown.map(({ page, index }) =>
                    <label key={ page.pageId } className="run-page" style={ { paddingLeft: 4 + (filter ? 0 : page.depth * 12) } } title={ `Page #${ page.pageId }` }>
                        <input type="checkbox" className="form-check-input flex-shrink-0 m-0" checked={ ticked.has(page.pageId) } onChange={ () => toggle(index) } />
                        <span className="run-page-caption">{ page.caption }</span>
                    </label>) }
            </div>
        </div>
    );
}
