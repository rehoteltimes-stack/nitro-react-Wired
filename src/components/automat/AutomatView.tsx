import { FC, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { AutomatActionComposer, AutomatStateEvent, IAutomatState, RegisterAutomatMessages } from '../../api/games/AutomatProtocol';
import { Button, Column, Flex, LayoutCurrencyIcon, LayoutFurniIconImageView, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useMessageEvent } from '../../hooks';

export const AutomatView: FC<{}> = props =>
{
    RegisterAutomatMessages();

    const [ state, setState ] = useState<IAutomatState>(null);
    const [ isVisible, setIsVisible ] = useState(false);

    useMessageEvent<AutomatStateEvent>(AutomatStateEvent, event =>
    {
        const next = event.getParser().state;

        if(!next) return;

        setState(next);
        setIsVisible(true);
    });

    if(!isVisible || !state) return null;

    return (
        <NitroCardView uniqueKey="automat" className="nitro-automat" theme="primary-slim" style={ { width: 360 } }>
            <NitroCardHeaderView headerText="Swap-o-Matic" onCloseClick={ () => setIsVisible(false) } />
            <NitroCardContentView gap={ 2 }>
                <Text small>Collect seasonal furni when it spawns in busy rooms, then trade it in here for currency.</Text>
                { !state.enabled && <Text small bold className="automat-warning">The Swap-o-Matic is closed right now.</Text> }
                { state.enabled && !state.machineHere && <Text small bold className="automat-warning">Walk back to the Swap-o-Matic machine to trade in.</Text> }
                { !!state.message && <Text small bold className="automat-message">{ state.message }</Text> }
                <Column gap={ 1 }>
                    { !state.offers.length && <Text small>Nothing to trade in this season.</Text> }
                    { state.offers.map(offer =>
                    {
                        const ready = state.enabled && state.machineHere && (offer.have >= offer.need);

                        return (
                            <Flex key={ offer.id } alignItems="center" gap={ 2 } className="automat-offer">
                                <div className="automat-offer-icon"><LayoutFurniIconImageView productType="s" productClassId={ offer.spriteId } /></div>
                                <Column gap={ 0 } className="automat-offer-text">
                                    <Text small bold truncate>{ offer.need } × { offer.name }</Text>
                                    <Text small className={ (offer.have >= offer.need) ? 'automat-have ready' : 'automat-have' }>You have { offer.have }</Text>
                                </Column>
                                <Button variant={ ready ? 'success' : 'dark' } disabled={ !ready } onClick={ () => ready && SendMessageComposer(new AutomatActionComposer('exchange', offer.id)) }>
                                    <Flex alignItems="center" gap={ 1 }>{ offer.amount } <LayoutCurrencyIcon type={ offer.currency } /></Flex>
                                </Button>
                            </Flex>
                        );
                    }) }
                </Column>
            </NitroCardContentView>
        </NitroCardView>
    );
}
