import { GetRoomEngine } from '../../api';
import { EnglishWords } from './FurniNames';

// Measures a furni from its loaded .nitro asset, the same way sodaho.tel's Furni Editor does (read from their
// minified client 2026-09-27): modes = visualization (size 64) animations that are NOT transitions
// (no transitionTo / transitionFrom); length = logic.model.dimensions.y, width = .x, height = .z.
// Height from the asset is only a suggestion: it equals the real stack height only ~40% of the time.

export interface IFurniMeasure
{
    states: number;
    width: number;
    length: number;
    height: number | null;
}

export const MeasureFurni = (itemName: string): IFurniMeasure =>
{
    const collection = GetRoomEngine().roomContentLoader.getCollection(itemName.split('*')[0]);
    const data: any = collection && collection.data;

    if(!data) return null;

    const visualizations: any[] = (data.visualizations || []);
    const visualization = visualizations.find(v => v.size === 64) || visualizations.find(v => !!v.animations);
    const animations = (visualization && visualization.animations) || {};
    const states = Object.values(animations).filter((a: any) => (a.transitionTo === undefined) && (a.transitionFrom === undefined)).length || 1;
    const dims = data.logic && data.logic.model && data.logic.model.dimensions;

    return {
        states,
        width: dims ? (dims.x || 1) : null,
        length: dims ? (dims.y || 1) : null,
        height: (dims && (dims.z !== undefined)) ? Number(dims.z) : null
    };
}

// Name rules for sit / lay / walk. The classname and the public name are split into words (on _ - * space digits and
// camelCase), so "lit" never matches "light" and "bedside" never counts as a bed. Words are English plus the French /
// Portuguese / Spanish / German words the imported furni use (HabboCity, LTD and Brazilian retro classnames).
const LAY_WORDS = [ 'bed', 'beds', 'lit', 'cama', 'camas', 'bett', 'futon', 'hammock', 'hamac', 'rede', 'hamaca', 'sleepingbag', 'couchette', 'berco', 'cradle', 'crib', 'mattress', 'matelas', 'colchao' ];
const LAY_SUFFIXES = [ 'bed' ];            // sunbed, daybed, waterbed, bunkbed...
const SIT_WORDS = [ 'chair', 'chairs', 'sofa', 'sofas', 'couch', 'bench', 'stool', 'seat', 'seats', 'throne', 'armchair', 'pouf', 'pouffe', 'ottoman', 'tabouret', 'chaise', 'fauteuil', 'canape', 'banc', 'trone', 'cadeira', 'poltrona', 'banco', 'banquinho', 'sofa', 'trono', 'silla', 'sillon', 'stuhl', 'sessel', 'bank', 'lounger', 'swing', 'saddle', 'deckchair', 'beanbag' ];
const SIT_SUFFIXES = [ 'chair', 'sofa', 'bench', 'stool', 'seat', 'throne' ];
const WALK_WORDS = [ 'carpet', 'rug', 'rugs', 'doormat', 'mat', 'tile', 'tiles', 'floor', 'tapis', 'tapete', 'dalle', 'plancher', 'sol', 'piso', 'grass', 'herbe', 'grama', 'sand', 'sable', 'areia', 'path', 'road', 'puddle', 'flaque', 'teppich', 'boden' ];
const WALK_SUFFIXES = [ 'carpet', 'rug', 'mat', 'tile', 'floor' ];
// a furni named after one of these is decor or a table, even if a seat / bed word appears too ("bedside table")
const NOT_WORDS = [ 'table', 'tables', 'mesa', 'tisch', 'lamp', 'light', 'lampe', 'luminaria', 'shelf', 'shelves', 'etagere', 'poster', 'wall', 'mur', 'parede', 'statue', 'sign', 'window', 'fenetre', 'janela', 'door', 'porte', 'porta', 'cabinet', 'wardrobe', 'armoire', 'closet', 'bedside', 'nightstand', 'frame', 'cadre', 'quadro', 'plant', 'rack', 'box', 'caixa' ];

const words = (text: string) => (text || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/)
    .filter(w => w.length > 1);

const matches = (list: string[], exact: string[], suffixes: string[]) => list.some(w => exact.includes(w) || suffixes.some(s => (w.length > s.length) && w.endsWith(s)));

// Name-based sit / lay / walk (one vote in the pose test; decides alone when there is no reference data).
export const SuggestFlags = (itemName: string, publicName: string) =>
{
    // own word lists plus every language the name translator knows (FurniNames: FR/PT/ES/IT/DE/NL/FI/TR/SV)
    const list = [ ...words(itemName), ...words(publicName), ...EnglishWords(itemName), ...EnglishWords(publicName) ];

    if(matches(list, NOT_WORDS, [])) return { sit: false, lay: false, walk: false };

    const lay = matches(list, LAY_WORDS, LAY_SUFFIXES);
    const sit = !lay && matches(list, SIT_WORDS, SIT_SUFFIXES);
    const walk = !sit && !lay && matches(list, WALK_WORDS, WALK_SUFFIXES);

    return { sit, lay, walk };
}
