import { FC, useEffect, useState } from 'react';
import { IFurniEditorItem } from '../../api/furni-editor/FurniEditorProtocol';
import { Button, Flex, Text } from '../../common';

/** One furni Auto run changed: the values before, what changed, and what the admin decided. */
export interface IAutoRunChange
{
    id: number;
    itemName: string;
    before: IFurniEditorItem;
    changes: string[];
    diffs?: { field: string, old: string, current: string }[];   // Old -> Current per changed field
    unsure?: string[];   // things Auto run was not sure about (flagged for a look, not applied)
    status: 'pending' | 'accepted' | 'reverting' | 'reverted' | 'error';
    message?: string;
}

interface Props
{
    rows: IAutoRunChange[];
    currentId: number;   // the furni open in the editor next to this panel
    onAccept: (ids: number[]) => void;
    onRevert: (ids: number[]) => void;
    onOpen: (id: number) => void;
    onClose: () => void;
}

// Review after an Auto run, docked inside the editor window (in place of the catalog tree), so a change and the furni
// it belongs to are seen side by side. Click a row to open that furni; Accept keeps the change, Revert saves the values
// from before the run again (logged like any edit). Deciding on the open furni moves the editor on to the next one to
// check (the editor does that, see acceptChanges / revertChanges).
export const FurniEditorReviewView: FC<Props> = props =>
{
    const { rows, currentId, onAccept, onRevert, onOpen, onClose } = props;
    const [ onlyOpen, setOnlyOpen ] = useState(true);
    const [ onlyUnsure, setOnlyUnsure ] = useState(false);
    const [ unticked, setUnticked ] = useState<Set<number>>(() => new Set());   // rows the admin unticked before accepting

    const pending = rows.filter(r => r.status === 'pending');
    const shown = rows.filter(r => (!onlyOpen || (r.status === 'pending') || (r.id === currentId)) && (!onlyUnsure || r.unsure?.length));
    const ticked = pending.filter(r => !unticked.has(r.id));
    const toggleTick = (id: number) => setUnticked(prev => { const next = new Set(prev); if(next.has(id)) next.delete(id); else next.add(id); return next; });
    const setAllTicks = (on: boolean) => setUnticked(on ? new Set() : new Set(pending.map(r => r.id)));
    const nextToCheck = pending.find(r => r.id !== currentId) || null;
    const statusLabel = (row: IAutoRunChange) => (row.status === 'accepted') ? '✓ kept' : (row.status === 'reverted') ? '↩ reverted' : (row.status === 'reverting') ? '...' : (row.status === 'error') ? '✗' : '';

    // the open furni stays in view in the list
    useEffect(() =>
    {
        document.querySelector(`.furni-editor-review-dock [data-review-id="${ currentId }"]`)?.scrollIntoView({ block: 'nearest' });
    }, [ currentId ]);

    return (
        <div className="furni-editor-review-dock">
            <Flex alignItems="center" justifyContent="between" gap={ 1 }>
                <Text small bold>Review: { pending.length } to check of { rows.length }</Text>
                <Button variant="dark" onClick={ onClose } title="Close the review (reopen it with the Review button)">✕</Button>
            </Flex>
            <Flex gap={ 1 } className="flex-wrap">
                <Button variant="primary" disabled={ !nextToCheck } onClick={ () => nextToCheck && onOpen(nextToCheck.id) }>Next to check</Button>
                <Button variant="success" disabled={ !ticked.length } title="Keep the changes of the ticked rows" onClick={ () => onAccept(ticked.map(r => r.id)) }>Accept ticked ({ ticked.length })</Button>
                <Button variant="danger" disabled={ !ticked.length } title="Save the values from before the run for the ticked rows" onClick={ () => onRevert(ticked.map(r => r.id)) }>Revert ticked ({ ticked.length })</Button>
            </Flex>
            <Flex gap={ 2 } className="flex-wrap">
                <label className="d-flex align-items-center gap-1 small"><input type="checkbox" className="form-check-input" checked={ !!pending.length && !unticked.size } onChange={ e => setAllTicks(e.target.checked) } /> tick all</label>
                <label className="d-flex align-items-center gap-1 small"><input type="checkbox" className="form-check-input" checked={ onlyOpen } onChange={ e => setOnlyOpen(e.target.checked) } /> only to check</label>
                <label className="d-flex align-items-center gap-1 small"><input type="checkbox" className="form-check-input" checked={ onlyUnsure } onChange={ e => setOnlyUnsure(e.target.checked) } /> only unsure ({ rows.filter(r => r.unsure?.length).length })</label>
            </Flex>
            <div className="review-list">
                { !shown.length && <Text small className="furni-editor-muted p-1">Nothing left to check.</Text> }
                { shown.map(row =>
                    <div key={ row.id } data-review-id={ row.id } className={ `review-item is-${ row.status } ${ (row.id === currentId) ? 'is-current' : '' }` }>
                        <Flex alignItems="center" justifyContent="between" gap={ 1 }>
                            { (row.status === 'pending') && <input type="checkbox" className="form-check-input flex-shrink-0 m-0" title="Untick to leave this row out of Accept / Revert ticked" checked={ !unticked.has(row.id) } onChange={ () => toggleTick(row.id) } /> }
                            <span className="review-name" title={ `#${ row.id } ${ row.itemName } - click to open it` } onClick={ () => onOpen(row.id) }>{ row.itemName }</span>
                            { (row.status === 'pending')
                                ? <Flex gap={ 1 } shrink>
                                    <Button variant="success" title="Keep this change" onClick={ () => onAccept([ row.id ]) }>✓</Button>
                                    <Button variant="danger" title="Revert: save the values from before the run" onClick={ () => onRevert([ row.id ]) }>↩</Button>
                                </Flex>
                                : <Text small className={ (row.status === 'accepted') ? 'furni-editor-match' : 'furni-editor-muted' } title={ row.message }>{ statusLabel(row) }</Text> }
                        </Flex>
                        { row.diffs?.length
                            ? row.diffs.map(d => <div key={ d.field } className="review-diff"><b>{ d.field }</b> <span className="review-old" title="Old">{ d.old || '-' }</span> → <span className="review-current" title="Current">{ d.current || '-' }</span></div>)
                            : <div className="review-diff furni-editor-muted">{ row.changes.length ? row.changes.join(', ') : 'no change' }</div> }
                        { !!row.unsure?.length && <div className="review-unsure">⚠ { row.unsure.join('; ') }</div> }
                    </div>) }
            </div>
        </div>
    );
}
