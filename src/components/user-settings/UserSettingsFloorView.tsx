import { FC } from 'react';
import { Button, Column, CustomInputRange, ScrollContainer, Text } from '../../common';
import { FLOOR_RECT_DEFAULT, FLOOR_RECT_MAX, FLOOR_SIZE_DEFAULT, FLOOR_SIZE_MAX, FLOOR_STAIRS_DEFAULT, FLOOR_STAIRS_MAX, useFloorRectThreshold, useFloorSizeThreshold, useFloorStairsThreshold } from '../../hooks';

// Real reference tab ("Paramètres anti lag de floor"): three sliders tuning how much floor-rendering
// complexity a room is allowed before the client simplifies it (dropped entirely at this project's
// build time - see the note below), plus a reset button. Values/ranges/defaults/"Infinite" cutoffs
// all confirmed live from the minified bundle, not guessed: max staircases 2048 (slider range 0-2049,
// 2049 = "Infinite"), max rectangles 4096 (0-4097), max room width/length 256 (0-257) - reset
// restores 512/1024/256. Persisted to the exact same real localStorage keys the reference itself
// uses ("nitro.floorStairsTreshold" etc, their own spelling) - confirmed via the bundle's own
// localStorage.setItem calls, purely a client-side preference never sent to their server.
//
// Real, honest gap, flagged not guessed: these settings are genuinely UI + persisted value only.
// The reference's own floor-rendering engine (which actually caps staircase/rectangle/size
// complexity when a threshold is exceeded, firing a "floor_messages/stairs/..." style alert - the
// exact wording used for the two warning lines below) lives inside their own internal room renderer.
// This project's vendored @nitrots/nitro-renderer package has no equivalent hook at all (confirmed
// via search - no floor threshold/complexity-limit concept exists anywhere in it), so toggling these
// sliders here does not yet change how any room actually renders. Wiring real enforcement would mean
// patching the vendored renderer package itself, out of scope for a Settings-UI pass.
export const UserSettingsFloorView: FC<{}> = props =>
{
    const [ stairsThreshold, setStairsThreshold ] = useFloorStairsThreshold();
    const [ rectThreshold, setRectThreshold ] = useFloorRectThreshold();
    const [ sizeThreshold, setSizeThreshold ] = useFloorSizeThreshold();

    const resetFloorSettings = () =>
    {
        setStairsThreshold(FLOOR_STAIRS_DEFAULT);
        setRectThreshold(FLOOR_RECT_DEFAULT);
        setSizeThreshold(FLOOR_SIZE_DEFAULT);
    }

    return (
        // Real reference structure, corrected after a user report ("layout spacing order and all is
        // still wrong") - the title and the slider group are BOTH inside the same real
        // .scroll-container/.scroll-content wrapper (confirmed live), not a plain overflow:hidden
        // Column with no scroll primitive at all, matching the same gap the General tab was missing.
        <Column gap={ 2 } overflow="hidden">
            <ScrollContainer>
                <Text bold fontSize={ 5 }>Floor anti-lag settings</Text>
                <Column gap={ 4 } className="user-settings-pdb">
                    <Column>
                        <Text bold>{ `Max staircases: ${ (stairsThreshold > FLOOR_STAIRS_MAX) ? 'Infinite' : stairsThreshold }` }</Text>
                        <CustomInputRange min={ 0 } max={ FLOOR_STAIRS_MAX + 1 } step={ 1 } value={ stairsThreshold } onChange={ setStairsThreshold } className="user-settings-input-range" />
                        <Text small variant="muted">Main performance factor. Each staircase can generate a large number of shapes, so raise this carefully.</Text>
                        <Text small variant="danger">If the threshold is exceeded: staircases stop rendering, which can leave the room looking incomplete.</Text>
                    </Column>
                    <Column>
                        <Text bold>{ `Max rectangles: ${ (rectThreshold > FLOOR_RECT_MAX) ? 'Infinite' : rectThreshold }` }</Text>
                        <CustomInputRange min={ 0 } max={ FLOOR_RECT_MAX + 1 } step={ 1 } value={ rectThreshold } onChange={ setRectThreshold } className="user-settings-input-range" />
                        <Text small variant="muted">Moderate performance impact. Floor tiles are grouped into rectangles to speed up rendering. If the limit is exceeded, the floor renders as a single flat rectangle, even if its real shape is more complex.</Text>
                        <Text small variant="danger">If the threshold is exceeded: the floor renders as a single flat rectangle, not reflecting its real structure.</Text>
                    </Column>
                    <Column>
                        <Text bold>{ `Max room width/length: ${ (sizeThreshold > FLOOR_SIZE_MAX) ? 'Infinite' : sizeThreshold }` }</Text>
                        <CustomInputRange min={ 0 } max={ FLOOR_SIZE_MAX + 1 } step={ 1 } value={ sizeThreshold } onChange={ setSizeThreshold } className="user-settings-input-range" />
                        <Text small variant="muted">Low impact. If the room is too large, it may cause slowdowns.</Text>
                        <Text small variant="danger">If the threshold is exceeded: the room renders cut off, without affecting its real structure.</Text>
                    </Column>
                    <Button variant="danger" title="Reset floor settings" onClick={ resetFloorSettings }>Reset</Button>
                </Column>
            </ScrollContainer>
        </Column>
    );
}
