import { GetConfiguration } from '../nitro';

/**
 * The kinds of feedback bubbles, the same set and icons as the emulator plugin's CommandFeedback
 * (c_images/notifications/feedback_<kind>.png, ui-config "feedback.icon.url").
 */
export type FeedbackKind = 'success' | 'error' | 'not_found' | 'no_permission' | 'cooldown' | 'warning' | 'info' | 'mention' | 'mention_group' | 'system'
    // Builder Mode results, one icon per action (client-only, feedback_build_<action>.png)
    | 'build_place' | 'build_pickup' | 'build_move' | 'build_height' | 'build_copy' | 'build_paste' | 'build_undo' | 'build_brush'
    // room-tools editing-rights toggle: HabboCity's own hand icon, in colour / greyed (feedback_rights_<on|off>.png)
    | 'rights_on' | 'rights_off'
    // chat reactions / replies (feedback_reaction_<name>.png, feedback_reply.png)
    | 'reaction_smile' | 'reaction_like' | 'reaction_heart' | 'reaction_angry' | 'reply'
    // Staff Tools: prison, trade ban, sanctions reset, a staff note, duty (feedback_<kind>.png, from our CDN's own icons)
    | 'prison' | 'trade_ban' | 'sanctions' | 'staff_note' | 'duty'
    | 'moderation' | 'chest';

const has = (text: string, ...parts: string[]) => parts.some(part => text.includes(part));

/** The kind of a message from its wording, the same rules as CommandFeedback.guess on the server. */
export const GuessFeedbackKind = (message: string): FeedbackKind =>
{
    const t = (message || '').toLowerCase();

    // Staff Tools results first: their wording is known
    if(has(t, 'prison', 'let out', 'is free again')) return 'prison';
    if(has(t, 'trade ban', 'can\'t trade', 'can trade again', 'from trading')) return 'trade_ban';
    if(has(t, 'sanctions')) return 'sanctions';
    if(has(t, 'note saved')) return 'staff_note';
    if(has(t, 'on duty', 'off duty')) return 'duty';

    if(has(t, 'permission', 'not allowed', 'switched off', 'only staff', 'staff only', 'no rights', 'don\'t have the rights', 'vip only', 'only for vip')) return 'no_permission';
    if(has(t, 'not found', 'no player', 'does not exist', 'doesn\'t exist', 'nobody called', 'no habbo called', 'no bot called', 'not online', 'no user', 'unknown user', 'could not find', 'couldn\'t find', 'not in a room', 'not in this room')) return 'not_found';
    if(has(t, 'please wait', 'slow down', 'seconds before', 'cooldown', 'wait a little', 'try again in')) return 'cooldown';
    if(has(t, 'confirm', 'again within', 'are you sure')) return 'warning';
    if(t.startsWith('usage') || t.startsWith('type a') || has(t, 'could not', 'couldn\'t', 'cannot', 'can\'t', 'failed', 'invalid', 'nothing to', 'error', 'not enough', 'have enough', 'you need', 'too many', 'too long')) return 'error';
    if(has(t, 'your chest', 'the chest', 'chests for today')) return 'chest';
    if(has(t, 'mention sent to')) return 'mention_group';
    if(has(t, 'mention')) return 'mention';
    if(has(t, 'is offline')) return 'not_found';
    if(has(t, 'sent', 'deleted', 'removed', 'is now', 'are now', 'now gets', 'you mentioned', 'done', 'saved', 'turned on', 'turned off', 'enabled', 'disabled', 'refreshed', 'reloaded', 'updated', 'given', 'received', 'welcome')) return 'success';

    return 'info';
}

export const FeedbackIconUrl = (kind: FeedbackKind): string => (GetConfiguration<string>('feedback.icon.url', '') || '').replace('%kind%', kind) || null;
