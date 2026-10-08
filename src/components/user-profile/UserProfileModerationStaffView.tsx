import { FC } from 'react';
import { CreateLinkEvent, ProfileDeleteContentComposer, ProfileModerationContentType, RegisterProfileModerationMessages, SendMessageComposer } from '../../api';
import { Button } from '../../common';
import { useNotification } from '../../hooks';

export const UserProfileModerationStaffView: FC<{ targetId: number, targetName: string }> = props =>
{
    const { targetId, targetName } = props;
    const { showConfirm = null } = useNotification();

    RegisterProfileModerationMessages();

    const deleteContent = (type: ProfileModerationContentType, label: string) =>
    {
        showConfirm(`Are you sure you want to delete the ${ label } of ${ targetName }?`, () => SendMessageComposer(new ProfileDeleteContentComposer(targetId, type)), null, 'Yes', 'No', 'Delete');
    }

    return (
        <>
            <Button variant="danger" onClick={ event => deleteContent(ProfileModerationContentType.BANNER, 'banner') }>Delete banner</Button>
            <Button variant="danger" onClick={ event => deleteContent(ProfileModerationContentType.MOTTO, 'motto') }>Delete motto</Button>
            <Button variant="danger" onClick={ event => deleteContent(ProfileModerationContentType.FIGURE, 'avatar') }>Delete avatar</Button>
            <Button variant="danger" onClick={ event => CreateLinkEvent(`mod-tools/toggle-user-info/${ targetId }`) }>Open mod tools</Button>
        </>
    );
}
