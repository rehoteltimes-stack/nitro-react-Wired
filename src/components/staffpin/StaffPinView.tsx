import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, FormEvent, useEffect, useRef, useState } from 'react';
import { AddEventLinkTracker, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { RegisterStaffPinMessages, StaffPinSetComposer, StaffPinStateEvent, StaffPinVerifyComposer } from '../../api/staffpin/StaffPinProtocol';
import { Base, Button, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useMessageEvent } from '../../hooks';

// Staff login PIN (server: hcms-emulator-plugin staffpin/StaffPin.java). Like the "Connection lost" card: while a
// staff account hasn't entered its PIN, the whole client is dimmed behind this card and nothing else can be used
// (user, 2026-09-30: "admin shouldn't be able to do anything before"); no close button, not draggable.
export const StaffPinView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ locked, setLocked ] = useState(false);
    const [ hasPin, setHasPin ] = useState(true);
    const [ attemptsLeft, setAttemptsLeft ] = useState(3);
    const [ message, setMessage ] = useState('');
    const [ pin, setPin ] = useState('');
    const [ confirm, setConfirm ] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    RegisterStaffPinMessages();

    useMessageEvent<StaffPinStateEvent>(StaffPinStateEvent, event =>
    {
        const parser = event.getParser();

        setLocked(parser.locked);
        setHasPin(parser.hasPin);
        setAttemptsLeft(parser.attemptsLeft);
        setMessage(parser.message);
        setPin('');
        setConfirm('');

        setIsVisible(parser.locked);
    });

    useEffect(() =>
    {
        const tracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                if(url.split('/')[1] !== 'open') return;

                setIsVisible(true);
                SendMessageComposer(new StaffPinVerifyComposer(''));
            },
            eventUrlPrefix: 'staffpin/'
        };

        AddEventLinkTracker(tracker);

        return () => RemoveLinkEventTracker(tracker);
    }, []);

    useEffect(() =>
    {
        if(isVisible) inputRef.current?.focus();
    }, [ isVisible, hasPin ]);

    const submit = (event?: FormEvent) =>
    {
        event?.preventDefault();

        if(!/^\d{4,8}$/.test(pin)) return setMessage('Your PIN is 4 to 8 digits.');

        SendMessageComposer(new StaffPinVerifyComposer(pin));
    }

    const create = (event?: FormEvent) =>
    {
        event?.preventDefault();

        if(!/^\d{4,8}$/.test(pin)) return setMessage('Your PIN must be 4 to 8 digits.');
        if(pin !== confirm) return setMessage('The PINs do not match.');

        SendMessageComposer(new StaffPinSetComposer(pin, confirm));
    }

    if(!isVisible || !locked) return null;

    return (
        <Base fit position="absolute" className="staff-pin-overlay top-0 start-0 d-flex align-items-center justify-content-center">
        <NitroCardView uniqueKey="staff-pin" theme="primary-slim" className="staff-pin-card" disableDrag={ true }>
            <NitroCardHeaderView headerText="Staff PIN" noCloseButton={ true } onCloseClick={ null } />
            <NitroCardContentView gap={ 2 }>
                { hasPin
                    ? <form className="staff-pin-form" onSubmit={ submit }>
                        <p className="staff-pin-text">Enter your staff PIN to continue.</p>
                        <input ref={ inputRef } id="staff-pin-input" className="staff-pin-input" type="password" inputMode="numeric" autoComplete="off"
                            maxLength={ 8 } value={ pin } placeholder="PIN" onChange={ event => setPin(event.target.value.replace(/\D/g, '')) } />
                        { !!message && <p className="staff-pin-message">{ message }</p> }
                        <p className="staff-pin-muted">{ attemptsLeft } { attemptsLeft === 1 ? 'try' : 'tries' } left. After 3 wrong PINs you are disconnected.</p>
                        <Button variant="success" onClick={ submit }>Unlock staff tools</Button>
                    </form>
                    : <form className="staff-pin-form" onSubmit={ create }>
                        <p className="staff-pin-text">You are staff now. Set a staff PIN: the game asks for it before your staff tools work.</p>
                        <input ref={ inputRef } id="staff-pin-new" className="staff-pin-input" type="password" inputMode="numeric" autoComplete="off"
                            maxLength={ 8 } value={ pin } placeholder="New PIN" onChange={ event => setPin(event.target.value.replace(/\D/g, '')) } />
                        <input id="staff-pin-repeat" className="staff-pin-input" type="password" inputMode="numeric" autoComplete="off"
                            maxLength={ 8 } value={ confirm } placeholder="Repeat PIN" onChange={ event => setConfirm(event.target.value.replace(/\D/g, '')) }
                            onKeyDown={ event => (event.key === 'Enter') && create() } />
                        { !!message && <p className="staff-pin-message">{ message }</p> }
                        <p className="staff-pin-muted">4 to 8 digits, not a row or repeat like 1234 or 5555. You can change it later on the website with your current PIN.</p>
                        <Button variant="success" onClick={ create }>Save PIN</Button>
                    </form> }
            </NitroCardContentView>
        </NitroCardView>
        </Base>
    );
}
