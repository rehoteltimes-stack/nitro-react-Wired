import { FC, useEffect } from 'react';
import { GetSessionDataManager, SendMessageComposer } from '../../api';
import { SetShopBubbleAccess } from '../../api/shop/ShopBubbles';
import { SetShopSettings } from '../../api/shop/ShopSettings';
import { RegisterShopMessages, ShopUserComposer, ShopUserEvent } from '../../api/shop/ShopProtocol';
import { useMessageEvent } from '../../hooks';

// Always mounted (renders nothing): asks once after login which chat bubbles are premium and which the player owns, so
// the chat style picker can hide the rest. The server sends it again by itself after a bubble is bought.

export const ShopBubbleSync: FC<{}> = props =>
{
    RegisterShopMessages();

    useEffect(() =>
    {
        let tries = 0;
        let timer: ReturnType<typeof setTimeout> = null;

        // the user id is known only once the session data arrived
        const ask = () =>
        {
            const userId = GetSessionDataManager().userId;

            if(userId > 0) { SendMessageComposer(new ShopUserComposer(userId)); return; }

            if(++tries < 30) timer = setTimeout(ask, 1000);
        }

        ask();

        return () => { if(timer) clearTimeout(timer); };
    }, []);

    useMessageEvent<ShopUserEvent>(ShopUserEvent, event =>
    {
        const decor = event.getParser().data;

        if(!decor || (decor.userId !== GetSessionDataManager().userId)) return;

        if(decor.settings) SetShopSettings(decor.settings);
        if(decor.premiumBubbles) SetShopBubbleAccess(decor.premiumBubbles, decor.ownedBubbles);
    });

    return null;
}
