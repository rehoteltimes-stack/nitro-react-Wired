export const CHAT_EMOJIS: [ string, string ][] = [
    [ 'joy', '😂' ], [ 'rofl', '🤣' ], [ 'smile', '😄' ], [ 'grin', '😁' ], [ 'sweat_smile', '😅' ], [ 'wink', '😉' ],
    [ 'blush', '😊' ], [ 'innocent', '😇' ], [ 'heart_eyes', '😍' ], [ 'star_struck', '🤩' ], [ 'kiss', '😘' ], [ 'yum', '😋' ],
    [ 'tongue', '😛' ], [ 'crazy', '🤪' ], [ 'hug', '🤗' ], [ 'think', '🤔' ], [ 'shush', '🤫' ], [ 'neutral', '😐' ],
    [ 'expressionless', '😑' ], [ 'smirk', '😏' ], [ 'unamused', '😒' ], [ 'eyeroll', '🙄' ], [ 'grimace', '😬' ], [ 'relieved', '😌' ],
    [ 'pensive', '😔' ], [ 'sleepy', '😪' ], [ 'sleeping', '😴' ], [ 'mask', '😷' ], [ 'sick', '🤢' ], [ 'hot', '🥵' ],
    [ 'cold', '🥶' ], [ 'dizzy', '😵' ], [ 'mindblown', '🤯' ], [ 'cowboy', '🤠' ], [ 'party', '🥳' ], [ 'cool', '😎' ],
    [ 'nerd', '🤓' ], [ 'confused', '😕' ], [ 'worried', '😟' ], [ 'open_mouth', '😮' ], [ 'astonished', '😲' ], [ 'flushed', '😳' ],
    [ 'pleading', '🥺' ], [ 'cry', '😢' ], [ 'sob', '😭' ], [ 'scream', '😱' ], [ 'angry', '😠' ], [ 'rage', '😡' ],
    [ 'cursing', '🤬' ], [ 'imp', '😈' ], [ 'skull', '💀' ], [ 'poop', '💩' ], [ 'clown', '🤡' ], [ 'ghost', '👻' ],
    [ 'alien', '👽' ], [ 'robot', '🤖' ], [ 'pumpkin', '🎃' ], [ 'heart', '❤️' ], [ 'orange_heart', '🧡' ], [ 'yellow_heart', '💛' ],
    [ 'green_heart', '💚' ], [ 'blue_heart', '💙' ], [ 'purple_heart', '💜' ], [ 'black_heart', '🖤' ], [ 'broken_heart', '💔' ], [ 'sparkling_heart', '💖' ],
    [ 'fire', '🔥' ], [ 'sparkles', '✨' ], [ 'star', '⭐' ], [ 'boom', '💥' ], [ 'zzz', '💤' ], [ 'wave', '👋' ],
    [ 'ok', '👌' ], [ 'v', '✌️' ], [ 'fingers_crossed', '🤞' ], [ 'thumbsup', '👍' ], [ 'thumbsdown', '👎' ], [ 'clap', '👏' ],
    [ 'raised_hands', '🙌' ], [ 'pray', '🙏' ], [ 'muscle', '💪' ], [ 'eyes', '👀' ], [ 'crown', '👑' ], [ 'gem', '💎' ],
    [ 'moneybag', '💰' ], [ 'dice', '🎲' ], [ 'trophy', '🏆' ], [ 'gift', '🎁' ], [ 'tada', '🎉' ], [ 'balloon', '🎈' ],
    [ 'music', '🎵' ], [ 'rose', '🌹' ], [ 'sunflower', '🌻' ], [ 'sun', '☀️' ], [ 'moon', '🌙' ], [ 'rainbow', '🌈' ],
    [ 'pizza', '🍕' ], [ 'burger', '🍔' ], [ 'fries', '🍟' ], [ 'cake', '🎂' ], [ 'cookie', '🍪' ], [ 'coffee', '☕' ],
    [ 'cat', '🐱' ], [ 'dog', '🐶' ], [ 'duck', '🦆' ], [ 'unicorn', '🦄' ], [ 'bat', '🦇' ], [ 'spider', '🕷️' ],
    [ 'check', '✅' ], [ 'x', '❌' ], [ 'warning', '⚠️' ], [ 'question', '❓' ], [ 'exclamation', '❗' ], [ '100', '💯' ]
];

const EMOJI_BY_CODE = new Map(CHAT_EMOJIS);

export const ReplaceEmojiCodes = (text: string) =>
{
    if(!text || (text.indexOf(':') === -1)) return text;

    return text.replace(/:([a-z0-9_]+):/gi, (match: string, code: string) => (EMOJI_BY_CODE.get(code.toLowerCase()) ?? match));
};

const EMOJI_CODES_KEY = 'hcms.chat.emojicodes';

export const AreEmojiCodesEnabled = () =>
{
    try
    {
        return (window.localStorage.getItem(EMOJI_CODES_KEY) !== 'off');
    }
    catch
    {
        return true;
    }
};

export const SetEmojiCodesEnabled = (enabled: boolean) =>
{
    try
    {
        window.localStorage.setItem(EMOJI_CODES_KEY, (enabled ? 'on' : 'off'));
    }
    catch
    {
        return;
    }
};
