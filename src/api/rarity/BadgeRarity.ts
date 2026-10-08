import { GetCommunication, SendMessageComposer } from '../nitro';
import { BadgeRarityDataEvent, BadgeRarityRequestComposer, RegisterRarityMessages } from './RarityProtocol';

export interface IBadgeRarity
{
    count: number;
    level: number;
}

const DATA = new Map<string, IBadgeRarity>();
const PENDING = new Set<string>();
const LISTENERS = new Set<() => void>();
let listening = false;

const listen = () =>
{
    if(listening) return;

    RegisterRarityMessages();
    GetCommunication().registerMessageEvent(new BadgeRarityDataEvent((event: BadgeRarityDataEvent) =>
    {
        const parser = event.getParser();

        PENDING.delete(parser.badgeCode);
        DATA.set(parser.badgeCode, { count: parser.count, level: parser.level });

        for(const listener of LISTENERS) listener();
    }));

    listening = true;
}

export const GetBadgeRarity = (badgeCode: string) => DATA.get(badgeCode) ?? null;

export const RequestBadgeRarity = (badgeCode: string) =>
{
    if(!badgeCode || DATA.has(badgeCode) || PENDING.has(badgeCode)) return;

    listen();
    PENDING.add(badgeCode);
    SendMessageComposer(new BadgeRarityRequestComposer(badgeCode));
}

export const OnBadgeRarity = (listener: () => void) =>
{
    LISTENERS.add(listener);

    return () => LISTENERS.delete(listener);
}
