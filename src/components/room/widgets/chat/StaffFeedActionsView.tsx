import { FC } from 'react';
import { FaFlag, FaInfo, FaSignInAlt, FaTerminal } from 'react-icons/fa';
import { CreateLinkEvent, SendMessageComposer } from '../../../../api';
import { StaffFeedCard } from '../../../../api/stafffeed/StaffFeedCardStore';
import { RegisterStaffFeedMessages, StaffFeedActionComposer } from '../../../../api/stafffeed/StaffFeedProtocol';
import { useUserIdentityByName } from '../../../../hooks/session/useUserIdentityByName';

/**
 * On a staff feed line (hcms-emulator-plugin stafffeed), shown like the chat reactions when the bubble is hovered: open
 * the player's Mod Tools info, go to their room, flag them (everything they do shows under [WATCH]) and list their last
 * commands. Sent as Staff Settings actions (9621), not as chat commands, so using them never shows up in the feed.
 */
export const StaffFeedActionsView: FC<{ name: string }> = props =>
{
    const { name } = props;
    const { webId } = useUserIdentityByName(name);

    RegisterStaffFeedMessages();

    const act = (event: React.MouseEvent, action: string) =>
    {
        event.stopPropagation();
        SendMessageComposer(new StaffFeedActionComposer(action, name));
    }

    return (
        <div className="reactions-box staff-feed-actions">
            <button type="button" className="reaction-button" disabled={ !webId } title={ `Info: ${ name }` } onClick={ event => { event.stopPropagation(); CreateLinkEvent(`mod-tools/open-user-info/${ webId }`); } }><FaInfo /></button>
            <button type="button" className="reaction-button" title={ `Go to ${ name }` } onClick={ event => act(event, 'goto') }><FaSignInAlt /></button>
            <button type="button" className="reaction-button" title={ `Flag / unflag ${ name } (everything they do shows under [WATCH])` } onClick={ event => act(event, 'watch') }><FaFlag /></button>
            <button type="button" className="reaction-button" title={ `Last commands of ${ name }` } onClick={ event => { event.stopPropagation(); StaffFeedCard.focusOn('command', name); } }><FaTerminal /></button>
        </div>
    );
}
