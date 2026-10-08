import { FC, useEffect, useState } from 'react';
import { Button, Column, Flex, Text } from '../../../../../common';
import { HtmlDsl } from '../../../../../common/HtmlDsl';
import { useCatalog } from '../../../../../hooks';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogFurniDescriptionWidgetView } from '../widgets/CatalogFurniDescriptionWidgetView';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutTrophiesView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const [ trophyText, setTrophyText ] = useState<string>('');
    const { currentOffer = null, setPurchaseOptions = null } = useCatalog();

    useEffect(() =>
    {
        if(!currentOffer) return;

        setPurchaseOptions(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.extraData = trophyText;

            return newValue;
        });
    }, [ currentOffer, trophyText, setPurchaseOptions ]);

    // Same structural fix as CatalogLayoutDefaultView.tsx (2026-09-22/23 pass) - see that file's own comment.
    return (
        <>
            <Flex fullHeight overflow="hidden">
                <Column size={ 7 } overflow="hidden" className="catalog-layout-furniture-view">
                    <CatalogItemGridWidgetView />
                </Column>
                <Column center={ !currentOffer } size={ 5 } overflow="hidden">
                    { !currentOffer &&
                        <>
                            { !!page.localization.getImage(1) && <img alt="" src={ page.localization.getImage(1) } /> }
                            <Text center><HtmlDsl text={ page.localization.getText(0) } /></Text>
                        </> }
                    { currentOffer &&
                        <>
                            <CatalogViewProductWidgetView />
                            <CatalogFurniDescriptionWidgetView title={ currentOffer.localizationName } description={ currentOffer.localizationDescription } />
                        </> }
                </Column>
            </Flex>
            { /* reference (Pk): the engraving textarea is a full-width row BELOW the grid/preview row, and the
                 purchase footer is always rendered (same as the default layout) */ }
            <textarea className="flex-grow-1 form-control w-100" defaultValue={ trophyText || '' } onChange={ event => setTrophyText(event.target.value) } />
            <Flex gap={ 2 } classNames={ [ 'flex-fill', 'catalog-purchase-widget' ] }>
                { !currentOffer &&
                    <Button grow variant="danger" disabled>No furni selected</Button> }
                { currentOffer &&
                    <CatalogPurchaseWidgetView /> }
            </Flex>
        </>
    );
}
