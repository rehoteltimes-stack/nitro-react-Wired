import { FC, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { LocalizeText } from '../../api';
import { Button, Column, Flex, ScrollContainer, Text } from '../../common';
import { useIgnoredUsers } from '../../hooks';

// The reference's real "Modérer" tab is a working ignore-list manager (search + add + a scrollable, removable list,
// header "Liste des utilisateurs ignorés (X/Y)"). Its own header shows a denominator this project's real protocol
// doesn't expose (IgnoredUsersParser only ever gives plain names, no id and no max-count field) - so the header here
// shows a plain count instead of inventing a limit. No LocalizeText key exists yet for this brand-new tab, so its
// labels are literal strings for now; whoever adds real localization for it should replace these.
export const UserSettingsModerateView: FC<{}> = props =>
{
    const { ignoredUsers = [], ignoreUser = null, unignoreUser = null } = useIgnoredUsers();
    const [ searchValue, setSearchValue ] = useState('');

    const filteredUsers = ignoredUsers.filter(name => name.toLowerCase().includes(searchValue.toLowerCase()));

    const addUser = () =>
    {
        if(!searchValue.length) return;

        ignoreUser(searchValue);

        setSearchValue('');
    }

    return (
        <Column gap={ 2 }>
            <Text bold>{ `Ignored users list (${ ignoredUsers.length })` }</Text>
            <Flex shrink gap={ 1 }>
                <input type="text" className="form-control form-control-sm" placeholder={ LocalizeText('generic.search') } value={ searchValue } onChange={ event => setSearchValue(event.target.value) } />
                <Button title="Add user" onClick={ addUser }>Add</Button>
            </Flex>
            <Column overflow="hidden">
                <ScrollContainer>
                    { filteredUsers.map(name =>
                        <Flex key={ name } gap={ 2 } alignItems="center" className="rounded p-1">
                            <Button size="xsm" variant="danger" onClick={ event => unignoreUser(name) }>
                                <FaTimes />
                            </Button>
                            <Text truncate>{ name }</Text>
                        </Flex>) }
                </ScrollContainer>
            </Column>
        </Column>
    );
}
