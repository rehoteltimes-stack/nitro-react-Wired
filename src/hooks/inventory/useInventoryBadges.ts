import { BadgeReceivedEvent, BadgesEvent, RequestBadgesComposer, SetActivatedBadgesComposer } from '@nitrots/nitro-renderer';
import { useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { GetConfiguration, SendMessageComposer, UnseenItemCategory } from '../../api';
import { DeleteBadgeComposer, RegisterInventoryDeleteMessages } from '../../api/inventory/InventoryDeleteProtocol';
import { useMessageEvent } from '../events';
import { useSharedVisibility } from '../useSharedVisibility';
import { useInventoryUnseenTracker } from './useInventoryUnseenTracker';

const useInventoryBadgesState = () =>
{
    const [ needsUpdate, setNeedsUpdate ] = useState(true);
    const [ badgeCodes, setBadgeCodes ] = useState<string[]>([]);
    const [ badgeIds, setBadgeIds ] = useState<Map<string, number>>(new Map<string, number>());
    const maxBadgeCount = GetConfiguration<number>('user.badges.max.slots', 7);
    // Real reference model, confirmed via minified source (jy hook): activeBadgeSlots is a FIXED-SIZE array of
    // length maxBadgeCount, '' marking an empty slot - not a compacting push/splice array. This matters because
    // the reference lets you place a badge into a SPECIFIC slot (drag onto that slot) and removing one leaves a
    // real gap instead of shifting every later badge down into it.
    const [ activeBadgeSlots, setActiveBadgeSlots ] = useState<string[]>(Array(maxBadgeCount).fill(''));
    const [ selectedBadgeCode, setSelectedBadgeCode ] = useState<string>(null);
    const { isVisible = false, activate = null, deactivate = null } = useSharedVisibility();
    const { isUnseen = null, resetCategory = null } = useInventoryUnseenTracker();

    const isWearingBadge = (badgeCode: string) => (activeBadgeSlots.indexOf(badgeCode) >= 0);
    const canWearBadges = () => (activeBadgeSlots.filter(code => (code !== '')).length < maxBadgeCount);

    // Real reference mechanism (toggleBadgeAtSlot / 'S' in the minified jy hook), driven by drag-and-drop onto a
    // specific rack slot and by the Wear/Remove button (which computes the badge's own current slot first): if
    // the badge is already sitting in the target slot, clear it (remove); if it's worn in a DIFFERENT slot, swap
    // the two slots' contents; otherwise place it in the target slot outright (silently replacing whatever was
    // there, exactly like the reference - the caller is responsible for only targeting an empty slot when wearing).
    const toggleBadgeAtSlot = (slotIndex: number, badgeCode: string) =>
    {
        setActiveBadgeSlots(prevValue =>
        {
            const newValue = [ ...prevValue ];
            const previousOccupant = newValue[slotIndex];
            const currentSlotOfBadge = newValue.indexOf(badgeCode);

            if(currentSlotOfBadge === slotIndex) newValue[slotIndex] = '';
            else if(currentSlotOfBadge !== -1)
            {
                newValue[slotIndex] = badgeCode;
                newValue[currentSlotOfBadge] = previousOccupant;
            }
            else
            {
                newValue[slotIndex] = badgeCode;
            }

            const composer = new SetActivatedBadgesComposer();

            for(let i = 0; i < maxBadgeCount; i++) composer.addActivatedBadge(newValue[i] ?? '');

            SendMessageComposer(composer);

            return newValue;
        });
    }

    // Real reference behaviour (the 'v' function in jy): wear-only, via the first empty slot - used for the
    // main grid's own double-click. If the badge is already worn elsewhere and a slot is free, this genuinely
    // just relocates it (confirmed live against the reference) rather than unequipping it - not something to
    // "fix", it's the real, faithfully-reproduced quirk. Does nothing if the rack is already full.
    const toggleBadge = (badgeCode: string) =>
    {
        const emptySlot = activeBadgeSlots.indexOf('');

        if(emptySlot !== -1) toggleBadgeAtSlot(emptySlot, badgeCode);
    }

    const getBadgeId = (badgeCode: string) =>
    {
        const index = badgeCodes.indexOf(badgeCode);

        if(index === -1) return 0;

        return (badgeIds.get(badgeCode) ?? 0);
    }

    useMessageEvent<BadgesEvent>(BadgesEvent, event =>
    {
        const parser = event.getParser();
        const receivedCodes = parser.getAllBadgeCodes();

        setBadgeIds(prevValue =>
        {
            const newValue = new Map(prevValue);

            for(const code of receivedCodes) newValue.set(code, parser.getBadgeId(code));

            return newValue;
        });

        // Real reference behaviour: rebuild the fixed-size slot array from the server's own active-codes list,
        // capped to maxBadgeCount and '' padded - not a straight assignment of whatever length the server sends.
        const activeCodes = parser.getActiveBadgeCodes();
        const newActiveBadgeSlots = Array(maxBadgeCount).fill('');

        for(let i = 0; (i < maxBadgeCount) && (i < activeCodes.length); i++) newActiveBadgeSlots[i] = (activeCodes[i] ?? '');

        setActiveBadgeSlots(newActiveBadgeSlots);
        setBadgeCodes(prevValue =>
        {
            const newValue = [ ...prevValue ];

            for(const code of receivedCodes) if(newValue.indexOf(code) === -1) newValue.push(code);

            return newValue;
        });
    });

    useMessageEvent<BadgeReceivedEvent>(BadgeReceivedEvent, event =>
    {
        const parser = event.getParser();
        const unseen = isUnseen(UnseenItemCategory.BADGE, parser.badgeId);

        setBadgeCodes(prevValue =>
        {
            if(prevValue.indexOf(parser.badgeCode) >= 0) return prevValue;

            const newValue = [ ...prevValue ];

            if(unseen) newValue.unshift(parser.badgeCode)
            else newValue.push(parser.badgeCode);

            return newValue;
        });

        setBadgeIds(prevValue =>
        {
            const newValue = new Map(prevValue);

            newValue.set(parser.badgeCode, parser.badgeId);

            return newValue;
        });
    });

    useEffect(() =>
    {
        if(!badgeCodes || !badgeCodes.length) return;

        setSelectedBadgeCode(prevValue =>
        {
            let newValue = prevValue;

            if(newValue && (badgeCodes.indexOf(newValue) === -1)) newValue = null;

            if(!newValue) newValue = badgeCodes[0];

            return newValue;
        });
    }, [ badgeCodes ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        return () =>
        {
            resetCategory(UnseenItemCategory.BADGE);
        }
    }, [ isVisible, resetCategory ]);

    useEffect(() =>
    {
        if(!isVisible || !needsUpdate) return;

        SendMessageComposer(new RequestBadgesComposer());

        setNeedsUpdate(false);
    }, [ isVisible, needsUpdate ]);

    const removeBadge = (badgeCode: string) =>
    {
        if(!badgeCode) return;

        RegisterInventoryDeleteMessages();
        SendMessageComposer(new DeleteBadgeComposer(badgeCode));
        setBadgeCodes(prevValue => prevValue.filter(code => (code !== badgeCode)));
        setActiveBadgeSlots(prevValue => prevValue.map(code => ((code === badgeCode) ? '' : code)));
    }

    return { badgeCodes, activeBadgeSlots, selectedBadgeCode, setSelectedBadgeCode, isWearingBadge, canWearBadges, toggleBadge, toggleBadgeAtSlot, getBadgeId, activate, deactivate, removeBadge };
}

export const useInventoryBadges = () => useBetween(useInventoryBadgesState);
