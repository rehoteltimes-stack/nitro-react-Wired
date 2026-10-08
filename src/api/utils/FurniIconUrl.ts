import { GetConfiguration } from '../nitro';

export const FurniIconUrl = (itemName: string) =>
{
    const template = GetConfiguration<string>('furni.asset.icon.url', '');

    if(!template || !itemName) return null;

    const [ libname, colour ] = itemName.split('*');

    return template.replace('%libname%', libname).replace('%param%', (colour !== undefined) ? ('_' + colour) : '');
}
