import { UserCurrentBadgesComposer, UserCurrentBadgesEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetConfiguration, GetSessionDataManager, ProfileBannerDataEvent, ProfileBannerRequestComposer, RegisterProfileBannerMessages, SendMessageComposer } from '../../api';
import { IShopBorderVisual } from '../../api/shop/ShopProtocol';
import { Column, Flex, LayoutAvatarImageView, LayoutBadgeRackView } from '../../common';
import { useMessageEvent } from '../../hooks';
import { ShopBorderFrame } from './ShopBorderFrame';

// The player's own avatar stand exactly like the one on their profile (UserProfileView: .profile-infostand >
// .body-image with the equipped player banner + the avatar, then the badge rack), with a border drawn around it the
// way the profile draws it (ShopBorderFrame at scale 0.55). Banner and badges are asked the same way the profile asks.
export const ShopProfileStand: FC<{ border: IShopBorderVisual, baseUrl: string }> = ({ border, baseUrl }) =>
{
    RegisterProfileBannerMessages();

    const userId = GetSessionDataManager().userId;
    const [ badges, setBadges ] = useState<string[]>([]);
    const [ bannerUrl, setBannerUrl ] = useState<string>(null);

    useEffect(() =>
    {
        SendMessageComposer(new UserCurrentBadgesComposer(userId));
        SendMessageComposer(new ProfileBannerRequestComposer(userId));
    }, [ userId ]);

    useMessageEvent<UserCurrentBadgesEvent>(UserCurrentBadgesEvent, event =>
    {
        const parser = event.getParser();

        if(parser.userId === userId) setBadges(parser.badges);
    });

    useMessageEvent<ProfileBannerDataEvent>(ProfileBannerDataEvent, event =>
    {
        const parser = event.getParser();

        if(parser.userId === userId) setBannerUrl(parser.imageFilename ? `${ GetConfiguration<string>('banner.url') }/${ parser.imageFilename }` : '');
    });

    return (
        <div className="shop-profile-stand">
            <Flex className="profile-infostand" gap={ 1 }>
                { border && <ShopBorderFrame border={ border } baseUrl={ baseUrl } scale={ 0.55 } outset={ 4 } centered /> }
                <Column fullWidth className="body-image" style={ bannerUrl ? { backgroundImage: `url(${ bannerUrl })` } : undefined }>
                    <LayoutAvatarImageView figure={ GetSessionDataManager().figure } direction={ 2 } />
                </Column>
                <LayoutBadgeRackView badgeCodes={ badges } showInfo />
            </Flex>
        </div>
    );
}
