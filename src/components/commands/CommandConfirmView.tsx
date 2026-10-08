import { FC } from 'react';
import { CommandConfirmAnswerComposer, CommandConfirmAskEvent, RegisterCommandConfirmMessages, SendMessageComposer } from '../../api';
import { useMessageEvent, useNotification } from '../../hooks';

// A command that cannot be undone (:emptyfriends, :deletegroup) opens a confirm window; the server runs it only after the answer.
export const CommandConfirmView: FC<{}> = () =>
{
    // Registered in the body, before useMessageEvent subscribes, so the message header is already known.
    RegisterCommandConfirmMessages();

    const { showConfirm = null } = useNotification();

    useMessageEvent<CommandConfirmAskEvent>(CommandConfirmAskEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        showConfirm(parser.text,
            () => SendMessageComposer(new CommandConfirmAnswerComposer(parser.token, true)),
            () => SendMessageComposer(new CommandConfirmAnswerComposer(parser.token, false)),
            null, null, parser.title);
    });

    return null;
}
