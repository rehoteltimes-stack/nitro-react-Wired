export const StaffFeedSubject = (text: string) =>
{
    const match = /^\[[A-Z ]+\] (?:Staff login: )?([^\s:']+)/.exec(text || '');

    return match ? match[1] : null;
}

const STAFF_FEED_TAG_KEYS: Record<string, string> = {
    'NEW USER': 'new', 'MODERATION': 'moderation', 'WORDFILTER': 'wordfilter', 'REPORT': 'report', 'STAFF': 'staff',
    'COMMAND': 'command', 'COMMANDS': 'command', 'SECURITY': 'security', 'WATCH': 'watch', 'ECONOMY': 'economy', 'ALERT': 'alert'
};

export const StaffFeedTagKey = (text: string) =>
{
    const match = /^\[([A-Z ]+)\]/.exec(text || '');

    return match ? (STAFF_FEED_TAG_KEYS[match[1]] ?? '') : '';
}
