import { CSSProperties, FC } from 'react';
import { GetConfiguration } from '../../api';

export const LayoutCenterLoaderView: FC<{ overlay?: boolean, text?: string }> = ({ overlay = true, text = '' }) =>
{
    const style = { '--center-loader-image': `url(${ GetConfiguration<string>('url.prefix', '') }/assets/img/loader/logo_loader_black.png)` } as CSSProperties;

    return (
        <div className={ `layout-center-loader${ overlay ? ' is-overlay' : '' }` } style={ style }>
            <div className="layout-center-loader-spinner" />
            { text && <div className="layout-center-loader-text">{ text }</div> }
        </div>
    );
}
