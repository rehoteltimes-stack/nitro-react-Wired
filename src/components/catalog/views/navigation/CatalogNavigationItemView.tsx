import { FC } from 'react';
import { FaCaretDown, FaCaretUp } from 'react-icons/fa';
import { ICatalogNode } from '../../../../api';
import { Base, Flex, LayoutGridItem, Text } from '../../../../common';
import { useCatalog } from '../../../../hooks';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationItemViewProps
{
    node: ICatalogNode;
    child?: boolean;
}

export const CatalogNavigationItemView: FC<CatalogNavigationItemViewProps> = props =>
{
    const { node = null, child = false } = props;
    const { activateNode = null } = useCatalog();

    return (
        <Base className="nitro-catalog-navigation-section">
            <LayoutGridItem gap={ 1 } column={ false } itemActive={ node.isActive } onClick={ event => activateNode(node) } className={ child ? 'inset' : '' }>
                <Flex className={ `nitro-catalog-navigation-item ${ (node.isOpen && !node.isBranch) ? 'active' : '' }` } alignItems="center" gap={ 2 } fullWidth overflow="hidden">
                    <CatalogIconView icon={ node.iconId } />
                    <Text small grow truncate textTransform="uppercase">{ node.localization }</Text>
                </Flex>
                { node.isBranch &&
                    <>
                        { node.isOpen && <FaCaretUp className="fa-icon" /> }
                        { !node.isOpen && <FaCaretDown className="fa-icon" /> }
                    </> }
            </LayoutGridItem>
            { node.isOpen && node.isBranch &&
                <CatalogNavigationSetView node={ node } child={ true } /> }
        </Base>
    );
}
