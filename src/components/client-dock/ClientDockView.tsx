import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { AddEventLinkTracker, CreateLinkEvent, GetConfiguration, RemoveLinkEventTracker } from '../../api';
import creatorIcon from '../../assets/images/creator/icon_creation.png';
import { BetaInfoView } from './BetaInfoView';

const STORAGE_KEY = 'hcms:client-dock-open';

const readOpen = () =>
{
    try { return window.localStorage.getItem(STORAGE_KEY) !== '0'; }
    catch(e) { return true; }
}

export const ClientDockView: FC<{}> = props =>
{
    const [ open, setOpen ] = useState(readOpen);
    const [ infoOpen, setInfoOpen ] = useState(false);

    useEffect(() =>
    {
        const tracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                if(url.split('/')[1] === 'toggle') setInfoOpen(value => !value);
            },
            eventUrlPrefix: 'beta-info/'
        };

        AddEventLinkTracker(tracker);

        return () => RemoveLinkEventTracker(tracker);
    }, []);
    const site = GetConfiguration<string>('url.prefix', '') || '';
    const logo = (GetConfiguration<string>('hotel.logo.season', '') === 'halloween') ? 'logo_habbo_halloween.png?v=2' : 'logo_habbo.png';

    const toggle = () =>
    {
        setOpen(value =>
        {
            try { window.localStorage.setItem(STORAGE_KEY, value ? '0' : '1'); }
            catch(e) {}

            return !value;
        });
    }

    return (
        <div className="client-dock">
            <button type="button" className={ `client-dock-toggle ${ open ? 'active' : '' }` } aria-label="Menu" onClick={ toggle }>
                <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            { open &&
                <div className="client-dock-bar">
                    <span className="client-dock-logo">
                        <img src={ `${ site }/assets/img/header/logo/${ logo }` } alt="Habbo" />
                        <span className="client-dock-badge">BETA</span>
                    </span>
                    <span className="client-dock-sep" />
                    <button type="button" className="client-dock-item" onClick={ () => CreateLinkEvent('shop/toggle') }>
                        <span className="icon icon-pf-rare" />
                        <span className="client-dock-label">Presence shop</span>
                    </button>
                    <span className="client-dock-sep" />
                    <button type="button" className="client-dock-item client-dock-creator" onClick={ () => CreateLinkEvent('creator/toggle') }>
                        <img src={ creatorIcon } alt="" />
                        <span className="client-dock-label">Creator</span>
                    </button>
                    <span className="client-dock-sep" />
                    <button type="button" className="client-dock-item client-dock-youtube" onClick={ () => CreateLinkEvent('room-youtube/toggle') }>
                        <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                        <span className="client-dock-label">YouTube</span>
                    </button>
                    <span className="client-dock-sep" />
                    <button type="button" className="client-dock-item" onClick={ () => setInfoOpen(value => !value) }>
                        <span className="icon icon-help" />
                        <span className="client-dock-label">Beta info</span>
                    </button>
                </div> }
            { infoOpen && <BetaInfoView onClose={ () => setInfoOpen(false) } /> }
        </div>
    );
}
