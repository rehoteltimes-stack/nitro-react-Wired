import { FC } from 'react';
import { DraggableWindowPosition, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';

export const BetaInfoView: FC<{ onClose: () => void }> = ({ onClose }) =>
    <NitroCardView uniqueKey="beta-info" className="nitro-hotel-card nitro-beta-info" theme="primary-slim" windowPosition={ DraggableWindowPosition.TOP_CENTER } style={ { width: 380 } }>
        <NitroCardHeaderView classNames={ [ 'hotel-card-header' ] } headerText={ <span className="hotel-card-banner"><span className="info-icon" /><span className="name"><b>Habbo Beta</b><span>Open beta</span></span></span> } onCloseClick={ onClose } />
        <NitroCardContentView gap={ 0 }>
            <div className="hotel-card-body">
                <h4>What is the beta?</h4>
                <p>The hotel is in testing until <b>Sunday 11 October</b>. Explore, build your rooms and play. Things can still change, break or be reset while we test.</p>
                <p>Found a bug or have an idea? Tell a staff member in the hotel. Every report helps.</p>
                <hr />
                <h4>Tomorrow (Monday)</h4>
                <ul>
                    <li>The <b>HabboPass</b> season starts</li>
                    <li><b>Achievements</b> and <b>daily quests</b> open</li>
                    <li>The <b>Rares</b> open in the catalog</li>
                    <li><b>Sunset Ranch</b> opens</li>
                </ul>
                <hr />
                <h4>After the beta</h4>
                <ul>
                    <li>The full website: news, community, profiles and forum</li>
                    <li>Center with the Marketplace, values and auctions</li>
                    <li>Events and competitions with prizes</li>
                </ul>
            </div>
        </NitroCardContentView>
    </NitroCardView>;
