// The rows of HabboCity's ":commands" window, read from the client's own component (a static list in its bundle). Order, sections
// and notes are theirs; the text is translated to English. `prefix` defaults to ":" like in the reference, `params` are shown as <param>.
export interface IHelpCommand
{
    command: string;
    description: string;
    params?: string[];
    prefix?: string;
}

export interface IHelpCommandSection
{
    title: string;
    note?: string;
    commands: IHelpCommand[];
}

export const HELP_COMMAND_SECTIONS: IHelpCommandSection[] = [
    {
        title: 'Chat commands',
        commands: [
            { command: 'Hold the SHIFT key and press Enter', description: 'writes in bold.', prefix: '' },
            { command: 'shout', description: 'shouts a message so everyone in the room hears it.', params: [ 'message' ] },
            { command: 'whisper', description: 'whispers privately to the target user.', params: [ 'username', 'message' ] },
            { command: 'speak', description: 'sends a normal chat message.', params: [ 'message' ] },
            { command: 'noreactions', description: 'stops the bubbles telling you who reacted to or replied to your messages. Type it again to turn them back on.' },
            { command: 'noemoji', description: 'keeps codes like :skull: as text instead of turning them into emoji. Type it again to turn them back on.' }
        ]
    },
    {
        title: 'Smiley commands',
        note: 'These commands play an animation on your avatar for a short moment.',
        commands: [
            { command: 'o/', description: 'your avatar waves.', prefix: '' },
            { command: '_b', description: 'your avatar gives a thumbs up.', prefix: '' },
            { command: ':)', description: 'your avatar smiles.', prefix: '' },
            { command: '>:(', description: 'your avatar is angry.', prefix: '' },
            { command: ':O', description: 'your avatar is surprised.', prefix: '' },
            { command: ':D', description: 'your avatar is happy.', prefix: '' },
            { command: ' x', description: 'when clicking an entity at the same time, quotes their name in a flash.' }
        ]
    },
    {
        title: 'Posture commands',
        note: 'These commands change the posture of your avatar.',
        commands: [
            { command: 'sit', description: 'your avatar sits down.' },
            { command: 'lay', description: 'your avatar lies down.' },
            { command: 'stand', description: 'your avatar stands up.' },
            { command: 'jump', description: 'your avatar jumps.' },
            { command: 'idle', description: 'your avatar falls asleep.' },
            { command: 'sign', description: 'your avatar holds up a sign.', params: [ '0 to 17' ] },
            { command: 'kiss', description: 'your avatar blows a kiss.' },
            { command: 'moonwalk', description: 'your avatar walks backwards.' }
        ]
    },
    {
        title: 'Tool commands',
        note: 'These commands give extra features to manage your experience in the room. You need rights in the room to use most of them.',
        commands: [
            { command: 'chooser', description: 'shows the list of entities in the room.' },
            { command: 'furni', description: 'shows the list of furniture in the room.' },
            { command: 'build', description: 'opens a complete building tool.' },
            { command: 'buildmode', description: 'same command as [build].' },
            { command: 'buildertool', description: 'opens the builder tool to move, stack and rotate furni precisely.' },
            { command: 'ss', description: 'changes the default state of the next furniture placed or moved (also [forceact], [setstate]).', params: [ 'number' ] },
            { command: 'ss stop', description: 'stops the [ss] command.' },
            { command: 'sr', description: 'changes the rotation of the next furniture placed or moved (also [forcerot], [setrotation]).', params: [ '0 to 7' ] },
            { command: 'sr stop', description: 'stops the [sr] command.' },
            { command: 'sh', description: 'changes the height of the next furniture placed or moved (also [setz], [bh], [buildheight]).', params: [ 'number' ] },
            { command: 'sh stop', description: 'stops the [sh] command.' },
            { command: 'pyramid', description: 'opens or closes every pyramid in the room at once (also [pyramids]).' },
            { command: 'floor', description: 'opens the floor editing menu.' },
            { command: 'alldeleteitem', description: 'removes all furniture on your tile.' },
            { command: 'pickall', description: 'picks up all the furniture in the room.' },
            { command: 'ejectall', description: 'removes all of YOUR furniture in a room where you have rights. If you own the room, it removes all furniture that does not belong to you instead. Staff count as the owner of every room.' },
            { command: 'wired', description: 'shows or hides the wired in the room.' },
            { command: 'diagonal', description: 'removes diagonal walking in your room, type the command again to cancel this mode.' },
            { command: 'lock', description: 'puts a doorbell on your room, removes it if there already was one.' },
            { command: 'setmax', description: 'sets the number of users allowed in your room.', params: [ '1 to 200' ] },
            { command: 'setspeed', description: 'sets the speed of the rollers in the room. The smaller the number, the faster the roller.', params: [ '1 to 500' ] },
            { command: 'zoom', description: 'zooms the room.', params: [ 'number' ] },
            { command: 'screenshot', description: 'takes a screenshot of the room.' },
            { command: 'eventsoff', description: 'turns event alerts off, type the command again to turn them back on.' },
            { command: 'settings', description: 'opens the room settings menu.' }
        ]
    },
    {
        title: 'Notification commands',
        note: 'These commands send a message to your friends or to the members of a group.',
        commands: [
            { command: 'invite', description: 'sends a message to all your friends.', params: [ 'message' ] },
            { command: 'groupnotif', description: 'sends a message to all members of the group who are in your room.', params: [ 'message' ] },
            { command: 'nomention', description: 'turns received mentions on or off.' },
            { command: '', description: 'sends a mention to the target of this command.', params: [ 'username', 'message' ], prefix: '@' }
        ]
    },
    {
        title: 'Deletion commands',
        commands: [
            { command: 'empty', description: 'clears your furniture inventory.' },
            { command: 'emptypets', description: 'clears your pet inventory.' },
            { command: 'emptybots', description: 'clears your bot inventory.' },
            { command: 'emptyfriends', description: 'removes all your friends.' },
            { command: 'deletegroup', description: 'deletes the group of the current room.' }
        ]
    },
    {
        title: 'Moderation commands',
        note: 'These commands let you moderate a room. You need rights to use most of them.',
        commands: [
            { command: 'kick', description: 'removes the targeted player from the room.', params: [ 'username' ] },
            { command: 'roomkick', description: 'removes every player from the room, except those with rights.' },
            { command: 'freeze', description: 'freezes the targeted player. They can no longer move. Type the command again to unfreeze.', params: [ 'username' ] },
            { command: 'roomfreeze', description: 'freezes all players in the room, except those with rights. They can no longer move. Type the command again to unfreeze them.' },
            { command: 'warp', description: 'teleports the targeted player to your position.', params: [ 'username' ] },
            { command: 'warproom', description: 'teleports all players in the room to your position, except those with rights.' },
            { command: 'facepalm', description: 'sends the target to the door, where they have to wait 15 seconds.', params: [ 'username' ] },
            { command: 'teleport', description: 'turns on instant teleportation to every tile you click.' },
            { command: 'tele', description: 'same as [teleport].' },
            { command: 'noenable', description: 'removes the effect from the target.' }
        ]
    },
    {
        title: 'Bot commands',
        note: 'These commands let you manage the bots in your room. You need rights to use them.',
        commands: [
            { command: 'botenable', description: 'gives an effect to the bot.', params: [ 'number', 'username' ] },
            { command: 'bothanditem', description: 'gives an item to the bot.', params: [ 'number', 'username' ] },
            { command: 'botsit', description: 'makes the bot sit down.', params: [ 'username' ] },
            { command: 'botlay', description: 'makes the bot lie down.', params: [ 'username' ] },
            { command: 'botfollow', description: 'the bot follows you.', params: [ 'username' ] },
            { command: 'botfollow stop', description: 'the bot stops following you.' },
            { command: 'botsmute', description: 'mutes the bots. Type the command again to unmute.' },
            { command: 'mimicbot', description: 'copies the look of the bot.', params: [ 'username' ] }
        ]
    },
    {
        title: 'Help commands',
        note: 'These commands give you help.',
        commands: [
            { command: 'help', description: 'opens the help center.' },
            { command: 'help enable', description: 'opens the list of effects.' },
            { command: 'help handitem', description: 'opens the list of hand items.' },
            { command: 'commands', description: 'opens the list of commands.' },
            { command: 'info', description: 'shows the hotel information card: version, users online, active rooms and more. [about] works too.' },
            { command: 'onduty', description: 'shows which staff are on duty right now, to ask for help (also [staffonduty]).' }
        ]
    },
    {
        title: 'Fun commands',
        note: 'These commands let you do fun things.',
        commands: [
            { command: 'punch', description: 'your avatar punches the target.', params: [ 'username' ] },
            { command: 'slap', description: 'your avatar slaps the target. Stand next to them.', params: [ 'username' ] },
            { command: 'hug', description: 'hugs a friend standing next to you.', params: [ 'username' ] },
            { command: 'kiss', description: 'kisses a friend standing next to you.', params: [ 'username' ] },
            { command: 'airkiss', description: 'sends an air kiss to a friend anywhere in the room. Type [airkiss all] for every friend in the room.', params: [ 'username' ] },
            { command: 'airhug', description: 'sends an air hug to a friend anywhere in the room. Type [airhug all] for every friend in the room.', params: [ 'username' ] },
            { command: 'love', description: 'shows a friend in the room some love. [airlove] works too. Type [love all] or [airlove all] for every friend in the room.', params: [ 'username' ] },
            { command: 'like', description: 'gives a friend in the room a thumbs up. Type [like all] for every friend in the room.', params: [ 'username' ] },
            { command: 'slime', description: 'throws slime at a friend in the room. It misses if they are walking. Type [slime all] for every friend in the room.', params: [ 'username' ] },
            { command: 'push', description: 'pushes the target. Needs [pushmode] to be on.', params: [ 'username' ] },
            { command: 'pull', description: 'pulls the target. Needs [pushmode] to be on.', params: [ 'username' ] },
            { command: 'spull', description: 'pulls the target from a distance. Needs [pushmode] to be on.', params: [ 'username' ] },
            { command: 'enable', description: 'turns on an effect. See the list of effects with [help enable].', params: [ 'number' ] },
            { command: 'enable stop', description: 'turns off the active effect.' },
            { command: 'enable freeze', description: 'keeps the active effect even after changing room.' },
            { command: 'handitem', description: 'gives an item to your player. See the list of items with [help handitem].', params: [ 'number' ] },
            { command: 'cars', description: 'your avatar takes the car. It moves twice as fast. Type the command again to turn it off.' },
            { command: 'mimic', description: 'copies the look of a player.', params: [ 'username' ] },
            { command: 'follow', description: 'joins a player who is in another room.', params: [ 'username' ] },
            { command: 'shake', description: 'shakes the room.' },
            { command: 'iddqd', description: 'flips the room upside down. Similar to [zoom -1], use [zoom 1] to put the room back.' },
            { command: 'flip', description: 'same as [iddqd].' },
            { command: 'bail', description: 'in prison: pay to get out early (the price depends on the time left). Staff can turn bail off for a sentence.', params: [] },
            { command: 'buylotto', description: 'buys lotto tickets for the next draw. [lotto] shows the jackpot, your tickets and when the draw is.', params: [ 'amount' ] },
            { command: 'rw', description: 'guesses the Random Word. Without a word it shows the scrambled letters.', params: [ 'word' ] },
            { command: 'norw', description: 'hides the hotel-wide Random Word messages. Type it again to see them.' },
            { command: 'nolotto', description: 'hides the hotel-wide lotto messages. Type it again to see them.' },
            { command: 'nogames', description: 'hides the hotel-wide messages of every game. Type it again to see them.' },
            { command: 'nobubbles', description: 'hides room chat bubbles for you. Type it again to see them.' },
            { command: 'play', description: 'plays a YouTube video for the whole room (needs rights). [play own link] plays it just for you, [play stop] stops the room video.', params: [ 'link' ] },
            { command: 'faceless', description: 'your avatar loses its face. Type the command again to get it back.' },
            { command: 'togglefps', description: 'lowers the number of frames per second. Type the command again to go back.' }
        ]
    },
    {
        title: 'Casino and dice commands',
        note: 'Stand next to a casino dealer bot. You play against the house with Diamonds or Emeralds.',
        commands: [
            { command: 'casino', description: 'shows the games, payouts and limits.' },
            { command: 'bet', description: 'starts a game: hl (high/low), tri, poker, 21 or 13.', params: [ 'game', 'amount', 'diamonds|emeralds', 'high|low' ] },
            { command: 'roll', description: 'rolls your next dice in a 21 or 13 game.' },
            { command: 'stand', description: 'stops rolling in a 21 or 13 game.' },
            { command: 'rd', description: 'rolls the dice next to you.' },
            { command: 'cd', description: 'closes the open dice next to you.' }
        ]
    },
    {
        title: 'Friend commands',
        note: 'These commands reach every friend of yours who is in the same room. They are the same as typing all after an air command.',
        commands: [
            { command: 'hugfriends', description: 'hugs all your friends in the room at once. Same as [airhug all].' },
            { command: 'kissfriends', description: 'blows a kiss to all your friends in the room. Same as [airkiss all].' },
            { command: 'lovefriends', description: 'shows all your friends in the room some love. Same as [love all] and [airlove all].' },
            { command: 'likefriends', description: 'gives all your friends in the room a thumbs up. Same as [like all].' },
            { command: 'slimefriends', description: 'covers all your friends in the room in slime. Same as [slime all].' }
        ]
    },
    {
        title: 'Presence commands',
        note: 'For the auras, spawns, borders and ornaments from Presence.',
        commands: [
            { command: 'presence', description: 'opens Presence (:shop works too).' },
            { command: 'spawn', description: 'plays your equipped spawn for the room.' },
            { command: 'nospawn', description: "hides everyone's spawn animations for you. Type the command again to see them." },
            { command: 'noentryspawn', description: 'your spawn no longer plays by itself when you enter a room. Type the command again to undo.' },
            { command: 'noaura', description: "hides everyone's auras for you. Type the command again to see them." },
            { command: 'noornaments', description: "hides other Habbos' ornaments for you. Type the command again to see them." }
        ]
    },
    {
        title: 'VIP commands',
        note: 'These commands are for VIP members only.',
        commands: [
            { command: 'enable vip', description: 'turns on the VIP effect. Type the command again to turn it off.' },
            { command: 'userstats', description: "shows a player's public stats: rank, motto, online, member since, respects and achievement score.", params: [ 'username' ] },
            { command: 'smack', description: 'smacks the target across the face.', params: [ 'username' ] },
            { command: 'kill', description: 'kills the target player.', params: [ 'username' ] },
            { command: 'hit', description: 'hits the target on the head.', params: [ 'username' ] }
        ]
    }
];
