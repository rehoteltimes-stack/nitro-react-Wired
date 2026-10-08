import { useEffect, useState } from 'react';
import { IStaffFeedLine } from './StaffFeedProtocol';

/**
 * The Staff feed card's lines (newest first). Lines arrive from the server all the time (StaffFeedLineEvent, listened
 * to by the always-mounted StaffFeedCardView), so the card shows everything even if it was closed. Opening the card
 * also loads the last lines of the log once. `unread` = lines that came in while the card was closed (the badge on
 * the Mod Tools icon).
 */
const MAX_LINES = 300;

let lines: (IStaffFeedLine & { id: number })[] = [];
let unread = 0;
let open = false;
let historyLoaded = false;
let nextId = 1;
let focus = { tag: '', search: '', history: false, seq: 0 };
const listeners = new Set<() => void>();

const changed = () => listeners.forEach(listener => listener());

const key = (line: IStaffFeedLine) => `${ line.time }|${ line.tag }|${ line.text }`;

export const StaffFeedCard = {
    add(line: IStaffFeedLine)
    {
        lines = [ { ...line, id: nextId++ }, ...lines ].slice(0, MAX_LINES);

        if(!open) unread++;

        changed();
    },

    /** The log's last lines (newest first): merged under the live ones, duplicates dropped. */
    history(rows: IStaffFeedLine[])
    {
        const seen = new Set(lines.map(key));
        const older = rows.filter(row => !seen.has(key(row))).map(row => ({ ...row, id: nextId++ }));

        lines = [ ...lines, ...older ].sort((a, b) => (b.time - a.time) || (b.id - a.id)).slice(0, MAX_LINES);
        historyLoaded = true;
        changed();
    },

    setOpen(value: boolean)
    {
        open = value;

        if(open) unread = 0;

        changed();
    },

    toggle() { this.setOpen(!open); },

    focusOn(tag: string, search: string, history: boolean = true)
    {
        focus = { tag, search, history, seq: (focus.seq + 1) };
        this.setOpen(true);
    },

    clear()
    {
        lines = [];
        changed();
    },

    get historyLoaded() { return historyLoaded; },
    get isOpen() { return open; }
};

export const useStaffFeedCard = () =>
{
    const [ , setVersion ] = useState(0);

    useEffect(() =>
    {
        const listener = () => setVersion(value => value + 1);

        listeners.add(listener);

        return () => { listeners.delete(listener); };
    }, []);

    return { lines, unread, open, focus };
}
