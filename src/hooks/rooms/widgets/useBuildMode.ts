import { useEffect, useRef, useState } from 'react';
import { useBetween } from 'use-between';
import { BuildModeHeightMode, BuildModeSettingsComposer, RegisterBuildModeMessages, SendMessageComposer } from '../../../api';

// Forced values of the reference's build mode (its furni chooser's "build" state): forced furni state(s),
// forced rotation(s), a forced height with a height mode, and whether they apply on move / double click.
// Sent to the hCMS Build Mode plugin 500 ms after the last change (same debounce as the reference sends its
// height options); an all-off packet is sent when build mode closes so the server stops forcing anything.
const useBuildModeState = () =>
{
    // Outgoing composer registration must exist before the first send (same ordering rule as every other
    // custom protocol in this project): synchronously in the hook body.
    RegisterBuildModeMessages();

    const [ active, setActive ] = useState(false);
    const [ furniState, setFurniState ] = useState<number[]>([]);
    const [ furniDirection, setFurniDirection ] = useState<number[]>([]);
    const [ furniZ, setFurniZ ] = useState<number>(null);
    const [ setZOptions, setSetZOptions ] = useState(0);
    const [ buildModeOnClick, setBuildModeOnClick ] = useState(false);
    const [ buildModeOnMove, setBuildModeOnMove ] = useState(false);
    const sentRef = useRef(false);

    const reset = () =>
    {
        setFurniState([]);
        setFurniDirection([]);
        setFurniZ(null);
        setSetZOptions(0);
        setBuildModeOnClick(false);
        setBuildModeOnMove(false);
    }

    useEffect(() =>
    {
        if(!active && !sentRef.current) return;

        const timeout = setTimeout(() =>
        {
            if(active)
            {
                // A height without an explicit mode means absolute, like the reference (mode ||= 1 once a z is set).
                const mode = (furniZ === null) ? BuildModeHeightMode.NONE : (setZOptions || BuildModeHeightMode.ABSOLUTE);

                SendMessageComposer(new BuildModeSettingsComposer(mode, furniZ, furniState, buildModeOnMove, buildModeOnClick));

                sentRef.current = true;

                return;
            }

            SendMessageComposer(new BuildModeSettingsComposer(BuildModeHeightMode.NONE, null, [], false, false));

            sentRef.current = false;
        }, 500);

        return () => clearTimeout(timeout);
    }, [ active, furniState, furniZ, setZOptions, buildModeOnClick, buildModeOnMove ]);

    return { active, setActive, furniState, setFurniState, furniDirection, setFurniDirection, furniZ, setFurniZ, setZOptions, setSetZOptions, buildModeOnClick, setBuildModeOnClick, buildModeOnMove, setBuildModeOnMove, reset };
}

export const useBuildMode = () => useBetween(useBuildModeState);
