import { FC } from 'react';
import { Base } from '../../../../../common/Base';
import { Column } from '../../../../../common/Column';
import { Flex } from '../../../../../common/Flex';
import { HtmlDsl } from '../../../../../common/HtmlDsl';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutPets3View: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    const imageUrl = page.localization.getImage(1);

    return (
        <Column grow className="catalog-layout-background rounded p-2" overflow="hidden">
            <Flex alignItems="center" gap={ 2 }>
                { imageUrl && <img alt="" src={ imageUrl } /> }
                <Base className="fs-5"><HtmlDsl text={ page.localization.getText(1) } /></Base>
            </Flex>
            <Column grow alignItems="center" overflow="hidden">
                <Base><HtmlDsl text={ page.localization.getText(2) } /></Base>
            </Column>
            <Flex alignItems="center">
                <Base className="fw-bold"><HtmlDsl text={ page.localization.getText(3) } /></Base>
            </Flex>
        </Column>
    );
}
