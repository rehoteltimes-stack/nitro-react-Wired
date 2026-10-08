import { FC, Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import { FaReply } from 'react-icons/fa';
import { AddEventLinkTracker, CreateLinkEvent, RemoveLinkEventTracker } from '../../api';
import { CollapsibleArea, Column, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView, ScrollContainer, Text } from '../../common';
import { HELP_COMMAND_SECTIONS, IHelpCommand } from './HelpCommandData';
import { HelpAvatarListView } from './HelpAvatarListView';

// HabboCity's help windows: one component listening to "cmdhelp/<window>" links and showing the help center, the command list, ...
// (its "yU" component). Only windows that exist here are switched to; the others fall back to the help center.
type HelpWindow = 'help' | 'command' | 'enable' | 'handitem';

// A description may hold "[command <param>]" pieces which are shown like a command entry (the reference's "wU").
const renderDescription = (text: string): ReactNode[] =>
{
    const parts: ReactNode[] = [];
    const pattern = /\[([^\]]+)\]/g;
    let last = 0;
    let match: RegExpExecArray;

    while((match = pattern.exec(text)) !== null)
    {
        if(match.index > last) parts.push(text.slice(last, match.index));

        const params = [ ...match[1].matchAll(/<([^>]+)>/g) ].map(entry => entry[1]);

        parts.push(<CommandEntry key={ match.index } command={ match[1].replace(/<[^>]+>/g, '').trim() } params={ params.length ? params : undefined } description="" />);

        last = pattern.lastIndex;
    }

    if(last < text.length) parts.push(text.slice(last));

    return parts;
}

const CommandEntry: FC<IHelpCommand> = props =>
{
    const { command = null, description = null, params = null, prefix = ':' } = props;

    return (
        <span className="help-command-entry">
            <Text bold select="all" className="help-command-entry-command">{ prefix }{ command }</Text>
            { params && (params.length > 0) &&
                <>
                    { params.map((param, index) =>
                        <span key={ index }>
                            <Text className="help-command-entry-chevron">{ (command !== '') ? ' ' : '' }&lt;</Text>
                            <Text className="help-command-entry-param">{ param }</Text>
                            <Text className="help-command-entry-chevron">&gt;</Text>
                        </span>) }
                </> }
            { description &&
                <Text className="help-command-entry-description"> - { renderDescription(description) }</Text> }
        </span>
    );
}

const CommandListView: FC<{ onOpenChange: (open: boolean) => void }> = props =>
{
    const { onOpenChange = null } = props;

    return (
        <NitroCardView uniqueKey="help-commands" className="nitro-help-menu" theme="primary-slim" overflow="hidden" resize="none">
            <NitroCardHeaderView headerText="Command list" buttonList={ [ { iconElement: <FaReply />, onClick: () => CreateLinkEvent('cmdhelp/help') } ] } onCloseClick={ () => onOpenChange(false) } />
            <NitroCardContentView overflow="hidden" gap={ 2 }>
                <ScrollContainer>
                    <Column gap={ 3 }>
                        <Text variant="muted" textTransform="uppercase">Command list</Text>
                        <Text variant="muted">There are many ways to improve your chat in the hotel. Learn all the commands or just two or three of them: here they all are, grouped together in this handy list.</Text>
                        <div className="horizontal-separator" />
                        { HELP_COMMAND_SECTIONS.map((section, index) =>
                            <Fragment key={ section.title }>
                                { (index > 0) && <div className="horizontal-separator" /> }
                                <CollapsibleArea defaultExpanded={ true } header={
                                    section.note
                                        ? <Column gap={ 1 }>
                                            <Text variant="warning" textTransform="uppercase">{ section.title }</Text>
                                            <Text variant="warning" small>{ section.note }</Text>
                                        </Column>
                                        : <Text variant="warning" textTransform="uppercase">{ section.title }</Text> }>
                                    <Column gap={ 1 }>
                                        { section.commands.map((entry, entryIndex) => <CommandEntry key={ entryIndex } { ...entry } />) }
                                    </Column>
                                </CollapsibleArea>
                            </Fragment>) }
                    </Column>
                </ScrollContainer>
            </NitroCardContentView>
        </NitroCardView>
    );
}

const HelpCenterView: FC<{ onOpenChange: (open: boolean) => void, onOpen: (window: HelpWindow) => void }> = props =>
{
    const { onOpenChange = null, onOpen = null } = props;

    return (
        <NitroCardView uniqueKey="help-center" className="nitro-help-menu help-menu-base" theme="primary-slim" overflow="hidden" resize="none">
            <NitroCardHeaderView headerText="Help center" onCloseClick={ () => onOpenChange(false) } />
            <NitroCardContentView>
                <Column gap={ 3 }>
                    <Text variant="muted">Find all the general help of the hotel here. Click the help you want, or type its command directly in the chat.</Text>
                    <Flex gap={ 1 } alignItems="center">
                        <Text className="help-clickable" variant="warning" onClick={ () => onOpen('command') }>Command list</Text>
                        <Text variant="muted" small>or type directly</Text>
                        <Text variant="muted" small bold select="all">:commands</Text>
                    </Flex>
                    <Flex gap={ 1 } alignItems="center">
                        <Text className="help-clickable" variant="warning" onClick={ () => onOpen('enable') }>Effect list</Text>
                        <Text variant="muted" small>or type directly</Text>
                        <Text variant="muted" small bold select="all">:help enable</Text>
                    </Flex>
                    <Flex gap={ 1 } alignItems="center">
                        <Text className="help-clickable" variant="warning" onClick={ () => onOpen('handitem') }>Hand item list</Text>
                        <Text variant="muted" small>or type directly</Text>
                        <Text variant="muted" small bold select="all">:help handitem</Text>
                    </Flex>
                </Column>
            </NitroCardContentView>
        </NitroCardView>
    );
}

export const HelpMenuView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ view, setView ] = useState<HelpWindow>('help');
    const current = useRef<HelpWindow>('help');

    useEffect(() =>
    {
        const linkTracker = {
            linkReceived: (url: string) =>
            {
                const target = (url.split('/')[1] || 'help') as string;
                const next: HelpWindow = ([ 'command', 'enable', 'handitem' ].includes(target) ? target : 'help') as HelpWindow;

                // Opening a different window replaces the visible one; opening the same one while it is showing closes it.
                setIsVisible(visible => (visible ? (next !== current.current) : true));
                current.current = next;
                setView(next);
            },
            eventUrlPrefix: 'cmdhelp/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    if(!isVisible) return null;

    if(view === 'command') return <CommandListView onOpenChange={ setIsVisible } />;

    if((view === 'enable') || (view === 'handitem')) return <HelpAvatarListView kind={ view } onOpenChange={ setIsVisible } />;

    return <HelpCenterView onOpenChange={ setIsVisible } onOpen={ next => CreateLinkEvent('cmdhelp/' + next) } />;
}
