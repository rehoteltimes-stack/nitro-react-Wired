import { FC, useState } from 'react';
import { ANIMATION_OPTIONS, DEFAULT_ANIMATION_FPS, DEFAULT_FPS, FPS_OPTIONS, GetAnimationFps, GetFpsLimit, SetAnimationFps, SetFpsLimit } from '../../api/settings/PerformanceSettings';
import { Button, Column, Flex, ScrollContainer, Text } from '../../common';

export const UserSettingsPerformanceView: FC<{}> = props =>
{
    const [ fps, setFps ] = useState(GetFpsLimit());
    const [ animationFps, setAnimationFps ] = useState(GetAnimationFps());

    const chooseFps = (value: number) =>
    {
        SetFpsLimit(value);
        setFps(value);
    }

    const chooseAnimationFps = (value: number) =>
    {
        SetAnimationFps(value);
        setAnimationFps(value);
    }

    const reset = () =>
    {
        chooseFps(DEFAULT_FPS);
        chooseAnimationFps(DEFAULT_ANIMATION_FPS);
    }

    return (
        <Column gap={ 2 } overflow="hidden">
            <ScrollContainer>
                <Text bold fontSize={ 5 }>Performance settings</Text>
                <Column gap={ 4 } className="user-settings-pdb">
                    <Column>
                        <Text bold>{ `Frame rate limit: ${ fps ? `${ fps } FPS` : 'Unlimited' }` }</Text>
                        <Flex gap={ 1 }>
                            { FPS_OPTIONS.map(value =>
                                <Button key={ value } variant={ (fps === value) ? 'primary' : 'dark' } fullWidth onClick={ () => chooseFps(value) }>{ value ? value : 'Max' }</Button>) }
                        </Flex>
                        <Text small variant="muted">How often the hotel is drawn each second. A lower limit uses less CPU, GPU and battery, which helps on older computers, laptops and busy rooms.</Text>
                    </Column>
                    <Column>
                        <Text bold>{ `Furni animations: ${ animationFps } FPS` }</Text>
                        <Flex gap={ 1 }>
                            { ANIMATION_OPTIONS.map(value =>
                                <Button key={ value } variant={ (animationFps === value) ? 'primary' : 'dark' } fullWidth onClick={ () => chooseAnimationFps(value) }>{ (value === DEFAULT_ANIMATION_FPS) ? `${ value } (normal)` : `${ value } (light)` }</Button>) }
                        </Flex>
                        <Text small variant="muted">Animated furni move at half speed on light, which takes work off the computer in rooms full of animations.</Text>
                        <Text small variant="danger">Applies from the next room you enter.</Text>
                    </Column>
                    <Button variant="danger" title="Reset performance settings" onClick={ reset }>Reset</Button>
                </Column>
            </ScrollContainer>
        </Column>
    );
}
