import { FC } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { Button } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';

const MIN_VALUE: number = 1;
const MAX_VALUE: number = 100;

export const CatalogSpinnerWidgetView: FC<{}> = props =>
{
    const { currentOffer = null, purchaseOptions = null, setPurchaseOptions = null } = useCatalog();
    const { quantity = 1 } = purchaseOptions;

    const updateQuantity = (value: number) =>
    {
        if(isNaN(value)) value = 1;

        value = Math.max(value, MIN_VALUE);
        value = Math.min(value, MAX_VALUE);

        if(value === quantity) return;

        setPurchaseOptions(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.quantity = value;

            return newValue;
        });
    }

    if(!currentOffer || !currentOffer.bundlePurchaseAllowed) return null;

    // Real reference markup (verified via CDP outerHTML on a live bundle-purchasable offer): a single
    // .controls-input-number.form-control box containing exactly a minus button (btn-danger btn-xsm, FaMinus,
    // disabled at the min quantity), a plain text input (.custom-input-number), and a plus button (btn-success
    // btn-xsm, FaPlus, disabled at the max) - no separate "select amount" text label anywhere in the real DOM.
    // Ours previously rendered a Text label + a separate Flex(caret icons + number input) as two independent
    // top-level fragments, which (a) doesn't match the real markup/icons at all (FaCaretLeft/Right vs the real
    // FaMinus/FaPlus in square colored buttons) and (b) made this a 2-flex-item block instead of 1, crushing the
    // Buy/Gift buttons in the parent footer row down from their real 150px to ~124px each.
    // .controls-input-number's own CSS (src/assets/styles/holo/_28-controls.scss) is already the verbatim
    // ported reference rule - no new CSS needed here, only the real DOM/classnames.
    return (
        <div className="d-flex align-items-center justify-content-between controls-input-number form-control">
            <Button variant="danger" size="xsm" classNames={ [ 'button-right' ] } disabled={ (quantity <= MIN_VALUE) } onClick={ event => updateQuantity(quantity - 1) }>
                <FaMinus className="fa-icon" />
            </Button>
            <input type="text" className="custom-input-number custom-color" maxLength={ 100 } value={ quantity } onChange={ event => updateQuantity(parseInt(event.target.value, 10)) } />
            <Button variant="success" size="xsm" classNames={ [ 'button-left' ] } disabled={ (quantity >= MAX_VALUE) } onClick={ event => updateQuantity(quantity + 1) }>
                <FaPlus className="fa-icon" />
            </Button>
        </div>
    );
}
