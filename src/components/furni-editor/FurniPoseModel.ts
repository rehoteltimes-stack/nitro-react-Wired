import { GetConfiguration } from '../../api';
import { TestPose } from './FurniEditorPreview';

// Walk / sit / lay / none from the furni's own picture: k nearest neighbours over furni whose flags four hotels agree on
// (trained by scratchpad pose_train.py on the pixel features the scan records, served from the CDN like the word
// suggestions: ui-config "furni-editor.pose.model.url"). Only used as one more vote, and only when it is sure: at 80%+
// it was right 90% of the time in leave-one-out tests.

interface IPoseModel
{
    names: string[];
    mean: number[];
    std: number[];
    weights: number[];
    k: number;
    prototypes: number[][];
    labels: string[];
}

export interface IPoseGuess
{
    pose: TestPose;
    confidence: number;
}

export interface IPoseFeatures
{
    top: number[];
    fill: number[];
    floorCover: number;
    legsGap: number;
    flatTop: number;
    low: number;
    backRest: number;
    surface: number;
    max: number;
    seat: number;
    sitSeat: number;
    footprintW: number;
    imageH: number;
}

const LABEL_TO_POSE: Record<string, TestPose> = { walk: 'std', sit: 'sit', lay: 'lay', none: 'none' };

export const POSE_MODEL_SURE = 0.8;

let model: IPoseModel = null;
let loading = false;
const listeners: (() => void)[] = [];

/** Loads the model once (the editor calls it when it opens); onReady runs when it is there. */
export const LoadPoseModel = (onReady?: () => void) =>
{
    if(model) { onReady?.(); return; }
    if(onReady) listeners.push(onReady);
    if(loading) return;

    const url = GetConfiguration<string>('furni-editor.pose.model.url', '');

    if(!url) return;

    loading = true;

    fetch(url).then(response => response.json()).then((data: IPoseModel) =>
    {
        if(data && data.prototypes && data.labels) model = data;
        listeners.splice(0).forEach(listener => listener());
    }).catch(() => (loading = false));
}

/** The same numbers as pose_train.py's vector(), in the same order. */
const vector = (f: IPoseFeatures, width: number, length: number): number[] =>
{
    const top = f.top;
    const meanTop = top.reduce((sum, value) => sum + value, 0) / top.length;
    const spread = Math.sqrt(top.reduce((sum, value) => sum + ((value - meanTop) ** 2), 0) / top.length);
    const back = (top[6] + top[7] + top[8] + top[9]) / 4;
    const sides = (top[0] + top[1] + top[2] + top[top.length - 3] + top[top.length - 2] + top[top.length - 1]) / 6;

    return [
        ...top, ...f.fill,
        f.floorCover, f.legsGap, f.flatTop, f.low, f.backRest,
        f.surface, f.max, f.seat, f.sitSeat,
        f.footprintW, f.imageH,
        meanTop, spread, back - sides,
        width, length, width * length
    ];
}

/** The model's guess for a scanned furni, or null (no model yet, or features missing). */
export const GuessPose = (features: IPoseFeatures, width: number, length: number): IPoseGuess =>
{
    if(!model || !features || !features.top || !features.fill) return null;

    const raw = vector(features, width || 1, length || 1);

    if(raw.length !== model.mean.length || raw.some(value => !Number.isFinite(value))) return null;

    const z = raw.map((value, j) => (value - model.mean[j]) / (model.std[j] || 1));
    const nearest: [ number, string ][] = [];

    for(let i = 0; i < model.prototypes.length; i++)
    {
        const p = model.prototypes[i];
        let sum = 0;

        for(let j = 0; j < z.length; j++) sum += model.weights[j] * ((z[j] - p[j]) ** 2);

        nearest.push([ Math.sqrt(sum), model.labels[i] ]);
    }

    nearest.sort((a, b) => a[0] - b[0]);

    const votes = new Map<string, number>();

    for(const [ distance, label ] of nearest.slice(0, model.k || 7)) votes.set(label, (votes.get(label) || 0) + (1 / (distance + 0.05)));

    const total = [ ...votes.values() ].reduce((sum, value) => sum + value, 0);
    const [ label, weight ] = [ ...votes.entries() ].sort((a, b) => b[1] - a[1])[0];

    return { pose: LABEL_TO_POSE[label] || 'none', confidence: weight / total };
}
