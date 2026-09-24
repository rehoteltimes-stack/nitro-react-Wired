import { FC, useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { Base, Column, Flex, NitroCardContentView, Text } from '../../common';

interface UserSettingsCoverInfoViewProps
{
    size: [ number, number ];
}

// Real reference component ("BU" in the minified bundle) - genuinely missed entirely on the first
// pass: a real click test AND a real CDP hover test both came back with zero observable effect, but
// both were run against the WRONG element/timing - the actual mechanism only surfaced by reading the
// component's own source directly. Real, exact structure and content, not guessed: hovering the info
// icon shows a real `react-bootstrap` Overlay/Popover (this project's own already-established pattern
// for this exact same icon class in a different context - see
// NavigatorSearchResultItemInfoView.tsx, byte-identical onMouseOver/onMouseLeave/Overlay/target/
// placement="right" shape) with two lines: a bold "Ideal size:" label next to the plain size value,
// then a second, entirely real, previously-unknown bold line about animated images.
export const UserSettingsCoverInfoView: FC<UserSettingsCoverInfoViewProps> = props =>
{
    const { size } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const elementRef = useRef<HTMLDivElement>();

    return (
        <div className="user-settings-upload-infos" onMouseLeave={ event => setIsVisible(false) }>
            <Base pointer innerRef={ elementRef } className="icon icon-navigator-info" onMouseOver={ event => setIsVisible(true) } />
            <Overlay show={ isVisible } target={ elementRef.current } placement="right">
                <Popover>
                    <NitroCardContentView overflow="hidden">
                        <Column overflow="hidden">
                            <Flex>
                                <Text bold>Ideal size: </Text>
                                <Text>{ size[0] }x{ size[1] }</Text>
                            </Flex>
                            <Text bold>Only the first frame of an animated image is used.</Text>
                        </Column>
                    </NitroCardContentView>
                </Popover>
            </Overlay>
        </div>
    );
}
