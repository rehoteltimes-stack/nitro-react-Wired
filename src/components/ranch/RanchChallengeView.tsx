import { FC } from 'react';
import { IRanchChallenge } from '../../api/games/RanchProtocol';
import { RanchFurniAnchorView } from './RanchAnimalsView';
import { RANCH_CHALLENGE_ICONS, RANCH_COLORS, RanchCounterFx, RanchStripedBarFx } from './RanchFx';

export const RanchChallengeView: FC<{ challenge: IRanchChallenge }> = props =>
{
    const { challenge } = props;

    if(!challenge || (challenge.objectId <= 0) || !RANCH_CHALLENGE_ICONS[challenge.type]) return null;

    const [ icon, color ] = RANCH_CHALLENGE_ICONS[challenge.type];

    return (
        <RanchFurniAnchorView objectId={ challenge.objectId }>
            <div className="ranch-badge-stack is-challenge">
                <RanchStripedBarFx progress={ (challenge.target - challenge.remaining) / Math.max(1, challenge.target) } color={ RANCH_COLORS.green } widthId={ 4 } icon={ null } />
                <RanchCounterFx icon={ icon } value={ challenge.remaining } color={ color } />
            </div>
        </RanchFurniAnchorView>
    );
}
