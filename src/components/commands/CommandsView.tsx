import { FC, Fragment, useState } from 'react';
import { CommandListCategory, CommandListDataEvent, RegisterCommandListMessages } from '../../api';
import { Base, Column, CustomSelect, DraggableWindowPosition, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useMessageEvent } from '../../hooks';

// habbo.st "Deine Befehle" window: opened by the server's reply to :commands, one section per category with a
// category filter select above the list (styled with our own theme, see CommandsView.scss).
export const CommandsView: FC<{}> = props =>
{
    // Registered synchronously, before useMessageEvent subscribes: the subscription resolves the header at subscribe time.
    RegisterCommandListMessages();

    const [ isVisible, setIsVisible ] = useState(false);
    const [ categories, setCategories ] = useState<CommandListCategory[]>([]);
    const [ selectedCategory, setSelectedCategory ] = useState('');

    useMessageEvent<CommandListDataEvent>(CommandListDataEvent, event =>
    {
        setCategories(event.getParser().categories);
        setSelectedCategory('');
        setIsVisible(true);
    });

    if(!isVisible) return null;

    return (
        <NitroCardView uniqueKey="commands" className="command-window" windowPosition={ DraggableWindowPosition.CENTER } theme="primary">
            <NitroCardHeaderView className="command-header" headerText="Your commands" onCloseClick={ event => setIsVisible(false) } />
            <NitroCardContentView className="command-window-content">
                <Base className="headerImage">
                    <CustomSelect fullWidth className="commands-accordion" value={ selectedCategory } onChange={ value => setSelectedCategory(value) } noInvalid items={ [ { value: '', text: 'All commands' }, ...categories.map(category => ({ value: category.name, text: category.name })) ] } />
                </Base>
                <Base className="command-section">
                    { categories.map(category => ((selectedCategory === '') || (selectedCategory === category.name)) &&
                        <Fragment key={ category.name }>
                            <Base className="command-section-head">
                                <Base className="command-section-separator">
                                    <Text className="seperator-text">{ category.name }</Text>
                                </Base>
                            </Base>
                            <Column className="command-section-body">
                                { category.commands.map((entry, index) =>
                                    <Base key={ index } className="command-list-entry">
                                        <h2>{ entry.command }</h2>
                                        <h3>{ entry.description }</h3>
                                    </Base>) }
                            </Column>
                        </Fragment>) }
                </Base>
            </NitroCardContentView>
        </NitroCardView>
    );
}
