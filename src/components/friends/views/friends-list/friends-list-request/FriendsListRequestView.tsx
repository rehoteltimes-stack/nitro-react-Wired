import { FC } from 'react';
import { LocalizeText, MessengerRequest } from '../../../../../api';
import { Button, Column, Flex, ScrollContainer } from '../../../../../common';
import { useFriends } from '../../../../../hooks';
import { FriendsListRequestItemView } from './FriendsListRequestItemView';

interface FriendsListRequestViewProps
{
    requests: MessengerRequest[];
}

// Real reference tab ("Requêtes"): a plain scrollable list (the same real .scroll-container this
// tab's siblings use) plus a "dismiss all" button - no accordion involved, matching the fix to this
// tab's own parent (FriendsListView.tsx) that replaced the whole accordion shell with the real
// search-bar + tabs structure.
export const FriendsListRequestView: FC<FriendsListRequestViewProps> = props =>
{
    const { requests = [] } = props;
    const { requestResponse = null } = useFriends();

    return (
        <ScrollContainer>
            <Column gap={ 0 }>
                { requests.map((request, index) => <FriendsListRequestItemView key={ index } request={ request } />) }
            </Column>
            { (requests.length > 0) &&
                <Flex justifyContent="center" className="px-2 py-1">
                    <Button onClick={ event => requestResponse(-1, false) }>
                        { LocalizeText('friendlist.requests.dismissall') }
                    </Button>
                </Flex> }
        </ScrollContainer>
    );
}
