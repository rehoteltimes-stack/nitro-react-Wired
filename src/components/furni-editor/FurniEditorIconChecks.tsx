import { FC, useEffect, useState } from 'react';
import { FurniIconUrl, GetConfiguration, ICatalogNode } from '../../api';
import { IFurniEditorOffer } from '../../api/furni-editor/FurniEditorProtocol';
import { Text } from '../../common';

type IconState = 'loading' | 'ok' | 'missing';

/** Loads an image for real and says whether it exists (a 404 or a broken file = missing). */
const useIconState = (url: string): IconState =>
{
    const [ state, setState ] = useState<IconState>('loading');

    useEffect(() =>
    {
        if(!url) { setState('missing'); return; }

        let alive = true;
        const image = new Image();

        setState('loading');
        image.onload = () => alive && setState((image.naturalWidth > 0) ? 'ok' : 'missing');
        image.onerror = () => alive && setState('missing');
        image.src = url;

        return () => { alive = false; };
    }, [ url ]);

    return state;
}

const IconRow: FC<{ url: string, label: string }> = ({ url, label }) =>
{
    const state = useIconState(url);

    return (
        <div className="furni-editor-icon-check" title={ url }>
            <span className="icon-box">{ (state === 'ok') && <img src={ url } alt="" /> }</span>
            <Text small className={ (state === 'ok') ? 'furni-editor-match' : (state === 'missing') ? 'furni-editor-warn' : 'furni-editor-muted' }>
                { (state === 'ok') ? '✓' : (state === 'missing') ? '✗ missing' : '...' } { label }
            </Text>
        </div>
    );
}

const findNode = (node: ICatalogNode, pageId: number): ICatalogNode =>
{
    if(!node) return null;

    for(const child of (node.children || []))
    {
        if(child.pageId === pageId) return child;

        const found = findNode(child, pageId);

        if(found) return found;
    }

    return null;
}

/**
 * Asset data: is the furni's icon there, and the icon of every catalog page that sells it (catalog_pages.icon_image,
 * shown in the catalog tree as catalogue/icon_<id>.png). Pages the catalog tree doesn't list (hidden, higher rank) say so.
 */
export const FurniEditorIconChecks: FC<{ itemName: string, offers: IFurniEditorOffer[], rootNode: ICatalogNode }> = props =>
{
    const { itemName, offers = [], rootNode = null } = props;
    const iconTemplate = GetConfiguration<string>('catalog.asset.icon.url', '');
    const pages = offers.filter((offer, index) => offers.findIndex(o => o.pageId === offer.pageId) === index);

    return (
        <>
            <IconRow url={ FurniIconUrl(itemName) } label="furni icon" />
            { pages.map(offer =>
            {
                const node = findNode(rootNode, offer.pageId);

                if(!node) return <Text key={ offer.pageId } small className="furni-editor-muted">{ offer.pageName } (page #{ offer.pageId }): not in your catalog tree, icon not checked</Text>;

                return <IconRow key={ offer.pageId } url={ iconTemplate.replace('%name%', String(node.iconId)) } label={ `page icon ${ node.iconId }: ${ offer.pageName } (page #${ offer.pageId })` } />;
            }) }
        </>
    );
}
