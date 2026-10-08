import { FriendlyTime, GetModeratorUserInfoMessageComposer, ModeratorUserInfoData, ModeratorUserInfoEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { CreateLinkEvent, GetUserProfile, LocalizeText, SendMessageComposer } from '../../../../api';
import { Button, DraggableWindowPosition, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView, ScrollContainer } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import { ModToolsUserModActionView } from './ModToolsUserModActionView';
import { ModToolsUserRoomVisitsView } from './ModToolsUserRoomVisitsView';
import { ModToolsUserSendMessageView } from './ModToolsUserSendMessageView';

interface ModToolsUserViewProps
{
    userId: number;
    onCloseClick: () => void;
}

export const ModToolsUserView: FC<ModToolsUserViewProps> = props =>
{
    const { onCloseClick = null, userId = null } = props;
    const [ userInfo, setUserInfo ] = useState<ModeratorUserInfoData>(null);
    const [ sendMessageVisible, setSendMessageVisible ] = useState(false);
    const [ modActionVisible, setModActionVisible ] = useState(false);
    const [ roomVisitsVisible, setRoomVisitsVisible ] = useState(false);

    const userProperties = useMemo(() =>
    {
        if(!userInfo) return null;

        return [
            {
                localeKey: 'modtools.userinfo.userName',
                value: userInfo.userName,
                showOnline: true
            },
            {
                localeKey: 'modtools.userinfo.cfhCount',
                value: userInfo.cfhCount.toString()
            },
            {
                localeKey: 'modtools.userinfo.abusiveCfhCount',
                value: userInfo.abusiveCfhCount.toString()
            },
            {
                localeKey: 'modtools.userinfo.cautionCount',
                value: userInfo.cautionCount.toString()
            },
            {
                localeKey: 'modtools.userinfo.banCount',
                value: userInfo.banCount.toString()
            },
            {
                localeKey: 'modtools.userinfo.lastSanctionTime',
                value: userInfo.lastSanctionTime
            },
            {
                localeKey: 'modtools.userinfo.tradingLockCount',
                value: userInfo.tradingLockCount.toString()
            },
            {
                localeKey: 'modtools.userinfo.tradingExpiryDate',
                value: userInfo.tradingExpiryDate
            },
            {
                localeKey: 'modtools.userinfo.minutesSinceLastLogin',
                value: FriendlyTime.format(userInfo.minutesSinceLastLogin * 60, '.ago', 2)
            },
            {
                localeKey: 'modtools.userinfo.primaryEmailAddress',
                value: userInfo.primaryEmailAddress
            },
            {
                localeKey: 'modtools.userinfo.identityRelatedBanCount',
                value: userInfo.identityRelatedBanCount.toString()
            },
            {
                localeKey: 'modtools.userinfo.registrationAgeInMinutes',
                value: FriendlyTime.format(userInfo.registrationAgeInMinutes * 60, '.ago', 2)
            },
            {
                localeKey: 'modtools.userinfo.userClassification',
                value: userInfo.userClassification
            }
        ];
    }, [ userInfo ]);

    useMessageEvent<ModeratorUserInfoEvent>(ModeratorUserInfoEvent, event =>
    {
        const parser = event.getParser();
    
        if(!parser || parser.data.userId !== userId) return;
    
        setUserInfo(parser.data);
    });

    useEffect(() =>
    {
        SendMessageComposer(new GetModeratorUserInfoMessageComposer(userId));
    }, [ userId ]);

    if(!userInfo) return null;

    return (
        <>
            <NitroCardView className="nitro-mod-tools-user" theme="primary-slim" windowPosition={ DraggableWindowPosition.TOP_LEFT }>
                <NitroCardHeaderView headerText={ LocalizeText('modtools.userinfo.title', [ 'username' ], [ userInfo.userName ]) } onCloseClick={ () => onCloseClick() } />
                <NitroCardContentView>
                    <Flex overflow="hidden" fullHeight column gap={ 1 }>
                        <Flex gap={ 1 } shrink className="mod-tools-group-button">
                            <Button onClick={ event => CreateLinkEvent(`mod-tools/open-user-chatlog/${ userId }`) }>Room Chat</Button>
                            <Button onClick={ event => setSendMessageVisible(!sendMessageVisible) }>Send Message</Button>
                            <Button onClick={ event => setRoomVisitsVisible(!roomVisitsVisible) }>Room Visits</Button>
                            <Button onClick={ event => setModActionVisible(!modActionVisible) }>Mod Action</Button>
                            <Button onClick={ event => GetUserProfile(userId) }>Profile</Button>
                        </Flex>
                        <ScrollContainer>
                            <table className="table table-striped table-sm table-text-small m-0">
                                <tbody>
                                    { userProperties.map( (property, index) =>
                                    {

                                        return (
                                            <tr key={ index }>
                                                <th scope="row">{ LocalizeText(property.localeKey) }</th>
                                                <td>
                                                    { property.value }
                                                    { property.showOnline &&
                                                    <i className={ `icon icon-pf-${ userInfo.online ? 'online' : 'offline' } ms-2` } /> }
                                                </td>
                                            </tr>
                                        );
                                    }) }
                                </tbody>
                            </table>
                        </ScrollContainer>
                    </Flex>
                </NitroCardContentView>
            </NitroCardView>
            { sendMessageVisible &&
                <ModToolsUserSendMessageView user={ { userId: userId, username: userInfo.userName } } onCloseClick={ () => setSendMessageVisible(false) } /> }
            { modActionVisible &&
                <ModToolsUserModActionView user={ { userId: userId, username: userInfo.userName } } onCloseClick={ () => setModActionVisible(false) } /> }
            { roomVisitsVisible &&
                <ModToolsUserRoomVisitsView userId={ userId } onCloseClick={ () => setRoomVisitsVisible(false) } /> }
        </>
    );
}
