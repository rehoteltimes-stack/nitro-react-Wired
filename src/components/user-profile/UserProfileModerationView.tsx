import { CallForHelpMessageComposer, ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, Suspense, useEffect, useState } from 'react';
import { AddEventLinkTracker, GetSessionDataManager, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { PROFILE_MODERATION_LEVEL, UserProfileModerationStaffView } from '../mod-tools/ModToolsStaffViews';
import { useChunkLevel } from '../protected/LoadProtected';
import { Button, Column, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useIgnoredUsers, useNotification } from '../../hooks';

interface ModerationTarget
{
    name: string;
    id: number;
    figure: string;
    motto: string;
    banner: string;
}

const REPORTS = [
    { key: 'banner', button: 'Report banner', confirm: 'the banner of', topic: 106, message: 'Invalid banner', field: 'banner' },
    { key: 'username', button: 'Report username', confirm: 'the username of', topic: 13, message: 'Invalid username', field: 'name' },
    { key: 'motto', button: 'Report motto', confirm: 'the motto of', topic: 106, message: 'Invalid motto', field: 'motto' },
    { key: 'figure', button: 'Report look', confirm: 'the look of', topic: 106, message: 'Invalid look', field: 'figure' }
];

export const UserProfileModerationView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ target, setTarget ] = useState<ModerationTarget>(null);
    const { ignoredUsers = [], ignoreUser = null, unignoreUser = null } = useIgnoredUsers();
    const { showConfirm = null } = useNotification();
    const level = useChunkLevel();

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        break;
                    case 'open':
                        setIsVisible(true);
                        break;
                }

                if(parts.length === 7) setTarget({ name: parts[2], id: parseInt(parts[3]), figure: parts[4], motto: parts[5], banner: parts[6] });
            },
            eventUrlPrefix: 'user-profile-moderation/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    if(!isVisible || !target) return null;

    const isIgnored = ignoredUsers.includes(target.name);
    const isModerator = GetSessionDataManager().isModerator;
    const isProfileModerator = (level >= PROFILE_MODERATION_LEVEL);

    const report = (report: typeof REPORTS[number]) =>
    {
        showConfirm(`Are you sure you want to report ${ report.confirm } ${ target.name }?`, () => SendMessageComposer(new CallForHelpMessageComposer(report.message, report.topic, target.id, -1, [ 0, target[report.field] ])), null, 'Yes', 'No', report.button);
    }

    return (
        <NitroCardView uniqueKey="profile-moderation-window" theme="primary-slim">
            <NitroCardHeaderView headerText="Moderate" onCloseClick={ event => setIsVisible(false) } />
            <NitroCardContentView>
                <Column gap={ 1 }>
                    <Button variant={ isIgnored ? 'primary' : 'danger' } onClick={ event => (isIgnored ? unignoreUser(target.name) : ignoreUser(target.name)) }>
                        { isIgnored ? 'Listen to' : 'Ignore' } { target.name }
                    </Button>
                    { !isModerator && REPORTS.map(entry => <Button key={ entry.key } variant="danger" onClick={ event => report(entry) }>{ entry.button }</Button>) }
                    { isModerator && isProfileModerator &&
                        <Suspense fallback={ null }><UserProfileModerationStaffView targetId={ target.id } targetName={ target.name } /></Suspense> }
                </Column>
            </NitroCardContentView>
        </NitroCardView>
    );
}
