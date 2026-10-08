import { FC, useMemo } from 'react';
import { AvatarInfoName, GetSessionDataManager } from '../../../../../api';
import { ShopNameOrnament } from '../../../../shop/ShopInfostandBorder';
import { ShopStyledName } from '../../../../shop/ShopStyledName';
import { ContextMenuView } from '../../context-menu/ContextMenuView';

interface AvatarInfoWidgetNameViewProps
{
    nameInfo: AvatarInfoName;
    onClose: () => void;
}

export const AvatarInfoWidgetNameView: FC<AvatarInfoWidgetNameViewProps> = props =>
{
    const { nameInfo = null, onClose = null } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'name-only' ];

        if(nameInfo.isFriend) newClassNames.push('is-friend');

        return newClassNames;
    }, [ nameInfo ]);

    return (
        <ContextMenuView objectId={ nameInfo.roomIndex } category={ nameInfo.category } userType={ nameInfo.userType } fades={ (nameInfo.id !== GetSessionDataManager().userId) } classNames={ getClassNames } onClose={ onClose }>
            { /* hCMS Shop: this player's ornament behind their name */ }
            <div className="text-shadow shop-name-bordered">
                { (nameInfo.id > 0) && <ShopNameOrnament userId={ nameInfo.id } /> }
                { (nameInfo.id > 0)
                    ? <ShopStyledName userId={ nameInfo.id } name={ nameInfo.name } className="shop-name-text" />
                    : <span className="shop-name-text">{ nameInfo.name }</span> }
            </div>
        </ContextMenuView>
    );
}
