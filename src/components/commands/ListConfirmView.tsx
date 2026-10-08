import { FC, useMemo, useState } from 'react';
import { IListConfirmItem, ListConfirmAnswerComposer, ListConfirmAskEvent, RegisterListConfirmMessages, SendMessageComposer } from '../../api';
import { Button, Column, DraggableWindowPosition, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView, ScrollContainer, Text } from '../../common';
import { useMessageEvent } from '../../hooks';

// A deletion with several real things in it (friends, furniture on your tile, ...): every item is listed, searchable,
// each with its own checkbox (all ticked by default, matching the old "delete everything" behaviour) - untick what
// you want to KEEP, then confirm. Only the ticked ids are sent back.
export const ListConfirmView: FC<{}> = () =>
{
    // Registered in the body, before useMessageEvent subscribes, so the message header is already known.
    RegisterListConfirmMessages();

    const [ token, setToken ] = useState<string>(null);
    const [ title, setTitle ] = useState('');
    const [ text, setText ] = useState('');
    const [ items, setItems ] = useState<IListConfirmItem[]>([]);
    const [ checked, setChecked ] = useState<Set<number>>(new Set());
    const [ search, setSearch ] = useState('');

    useMessageEvent<ListConfirmAskEvent>(ListConfirmAskEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        setToken(parser.token);
        setTitle(parser.title);
        setText(parser.text);
        setItems(parser.items);
        setChecked(new Set(parser.items.map(item => item.id)));
        setSearch('');
    });

    const answer = (accepted: boolean) =>
    {
        SendMessageComposer(new ListConfirmAnswerComposer(token, accepted, accepted ? Array.from(checked) : []));
        setToken(null);
    }

    const toggle = (id: number) =>
    {
        setChecked(previous =>
        {
            const next = new Set(previous);

            if(next.has(id)) next.delete(id);
            else next.add(id);

            return next;
        });
    }

    const shown = useMemo(() => search ? items.filter(item => item.label.toLowerCase().includes(search.toLowerCase())) : items, [ items, search ]);

    if(token === null) return null;

    return (
        <NitroCardView uniqueKey="list-confirm" className="list-confirm-window" windowPosition={ DraggableWindowPosition.CENTER } theme="primary">
            <NitroCardHeaderView headerText={ title } onCloseClick={ () => answer(false) } />
            <NitroCardContentView gap={ 2 }>
                <Text>{ text }</Text>
                <Flex gap={ 2 } alignItems="center">
                    <input type="text" className="form-control form-control-sm" placeholder="Search" value={ search } onChange={ event => setSearch(event.target.value) } />
                    <Button variant="secondary" onClick={ () => setChecked(new Set(items.map(item => item.id))) }>All</Button>
                    <Button variant="secondary" onClick={ () => setChecked(new Set()) }>None</Button>
                </Flex>
                <Flex overflow="hidden" className="rounded list-container p-2">
                    <ScrollContainer fullWidth fullHeight gap={ 1 }>
                        { shown.map(item => (
                            <Flex key={ item.id } gap={ 2 } alignItems="center">
                                <input className="form-check-input" type="checkbox" checked={ checked.has(item.id) } onChange={ () => toggle(item.id) } />
                                <Text noWrap>{ item.label }</Text>
                            </Flex>
                        )) }
                    </ScrollContainer>
                </Flex>
                <Text small variant="muted">{ checked.size } of { items.length } selected</Text>
                <Flex gap={ 2 }>
                    <Button variant="danger" disabled={ !checked.size } onClick={ () => answer(true) }>Confirm</Button>
                    <Button variant="secondary" onClick={ () => answer(false) }>Cancel</Button>
                </Flex>
            </NitroCardContentView>
        </NitroCardView>
    );
}
