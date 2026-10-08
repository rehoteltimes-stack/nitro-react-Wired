import { Filter } from '@pixi/core';

// hCMS Shop aura effect: one filter, eight effects, driven entirely by the aura row in the database (effect, two
// colours, speed, intensity). It draws around the avatar's own silhouette, so the filter gets padding to have room
// outside the figure.
//   1 glow      soft pulsing outline
//   2 sparkles  twinkling points near the figure
//   3 flames    flames rising from the outline
//   4 mist      slow smoke drifting up
//   5 orbit     small lights circling the avatar
//   6 rainbow   colours sweeping over the figure, with a thin rim
//   7 frost     icy rim with crystal glints
//   8 electric  flickering arcs along the outline
//   9 streak    a band of light climbing the outline
//  10 void      darkness eating into the figure, dark smoke
//  11 shine     a pearly shine sweeping across the figure
//  12 power     tall spiky energy around the body (power-up)
//  13 halo      a glowing ring above the head
//  14 bubbles   little bubbles rising around the avatar

const FRAGMENT = `
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
// same precision as Pixi's default filter vertex shader declares them, or the program won't link
uniform highp vec4 inputSize;
uniform highp vec4 outputFrame;

uniform float time;
uniform float effect;
uniform vec3 colorA;
uniform vec3 colorB;
uniform float speed;
uniform float intensity;
uniform float zoom;

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float alphaAt(vec2 px)
{
    return texture2D(uSampler, px * inputSize.zw).a;
}

// how much figure is within radius r of this pixel (0 = none, 1 = inside the figure)
float near(vec2 px, float r)
{
    float total = 0.0;

    for(int i = 0; i < 12; i++)
    {
        float a = float(i) * 0.5235988;
        vec2 d = vec2(cos(a), sin(a));

        total = max(total, alphaAt(px + d * r));
        total = max(total, alphaAt(px + d * r * 0.5) * 0.9);
    }

    return total;
}

vec3 hue(float h)
{
    return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}

void main(void)
{
    vec4 base = texture2D(uSampler, vTextureCoord);
    vec2 px = vTextureCoord * inputSize.xy;
    vec2 size = outputFrame.zw;
    vec2 uv = px / size;
    float t = time * speed;
    float s = zoom;
    vec3 add = vec3(0.0);
    float addAlpha = 0.0;
    int mode = int(effect + 0.5);

    if(mode == 1)
    {
        float glow = near(px, 6.0 * s) * (1.0 - base.a);
        float pulse = 0.65 + 0.35 * sin(t * 2.5);

        add = mix(colorA, colorB, 0.5 + 0.5 * sin(t * 1.3 + uv.y * 6.0));
        addAlpha = glow * pulse;
    }
    else if(mode == 2)
    {
        vec2 cell = floor(px / (5.0 * s));
        float star = hash(cell);
        float twinkle = pow(max(0.0, sin(t * (2.0 + star * 3.0) + star * 40.0)), 12.0);
        float area = near(px, 10.0 * s) * (1.0 - base.a * 0.6);

        add = mix(colorA, colorB, star);
        addAlpha = step(0.82, star) * twinkle * area * 1.4;
    }
    else if(mode == 3)
    {
        vec2 q = vec2(px.x / (6.0 * s), px.y / (9.0 * s) + t * 2.2);
        float n = noise(q) * 0.6 + noise(q * 2.1) * 0.4;
        float below = near(px + vec2(0.0, 7.0 * s), 7.0 * s);
        float flame = smoothstep(0.35, 0.85, n * below) * (1.0 - base.a);

        add = mix(colorB, colorA, smoothstep(0.4, 0.9, n));
        addAlpha = flame * 1.2;
    }
    else if(mode == 4)
    {
        vec2 q = vec2(px.x / (10.0 * s) + sin(t * 0.4) * 0.5, px.y / (10.0 * s) + t * 0.9);
        float n = noise(q) * 0.5 + noise(q * 2.3) * 0.3 + noise(q * 4.7) * 0.2;
        float area = near(px, 12.0 * s);

        add = mix(colorA, colorB, n);
        addAlpha = smoothstep(0.45, 0.8, n) * area * 0.75 * (1.0 - base.a * 0.7);
    }
    else if(mode == 5)
    {
        vec2 center = size * vec2(0.5, 0.55);
        vec2 radius = vec2(size.x * 0.34, size.y * 0.07);
        float best = 0.0;
        vec3 col = colorA;

        for(int i = 0; i < 4; i++)
        {
            float a = t * 1.6 + float(i) * 1.5708;
            vec2 p = center + vec2(cos(a) * radius.x, sin(a) * radius.y - float(i) * size.y * 0.1);
            float d = length(px - p) / (2.2 * s);
            float light = exp(-d * d);

            if(light > best) { best = light; col = mix(colorA, colorB, float(i) / 3.0); }
        }

        // lights passing behind the avatar are hidden by it
        add = col;
        addAlpha = best * (1.0 - base.a * 0.85);
    }
    else if(mode == 6)
    {
        vec3 rainbow = hue(fract(uv.y * 0.8 + uv.x * 0.3 - t * 0.25));
        float rim = near(px, 3.0 * s) * (1.0 - base.a);

        base.rgb = mix(base.rgb, base.rgb * 0.55 + rainbow * 0.6, base.a * 0.55);
        add = mix(rainbow, mix(colorA, colorB, 0.5), 0.3);
        addAlpha = rim * 0.9;
    }
    else if(mode == 7)
    {
        float rim = near(px, 4.0 * s) * (1.0 - base.a);
        vec2 cell = floor(px / (3.0 * s));
        float crystal = step(0.9, hash(cell)) * (0.5 + 0.5 * sin(t * 3.0 + hash(cell) * 30.0));

        add = mix(colorA, colorB, hash(cell + 3.0));
        addAlpha = rim * 0.75 + crystal * near(px, 7.0 * s) * (1.0 - base.a) * 0.9;
        base.rgb = mix(base.rgb, base.rgb + colorB * 0.25, base.a * 0.4);
    }
    else if(mode == 8)
    {
        float flicker = step(0.35, fract(sin(floor(t * 12.0)) * 43758.5453));
        vec2 q = vec2(px.x / (4.0 * s), px.y / (4.0 * s) + floor(t * 12.0) * 7.3);
        float arc = 1.0 - abs(noise(q) * 2.0 - 1.0);
        float area = near(px, 6.0 * s) * (1.0 - base.a);

        add = mix(colorA, colorB, arc);
        addAlpha = pow(arc, 14.0) * area * flicker * 1.8 + near(px, 3.0 * s) * (1.0 - base.a) * 0.25;
    }

    else if(mode == 9)
    {
        // a band of light climbing the outline from the feet to the head
        float rim = near(px, 3.0 * s) * (1.0 - base.a);
        float head = 1.0 - fract(t * 0.45);
        float band = exp(-pow((uv.y - head) * 9.0, 2.0));

        add = mix(colorA, colorB, band);
        addAlpha = rim * (band * 1.6 + 0.15);
        base.rgb += colorA * band * base.a * 0.25;
    }
    else if(mode == 10)
    {
        // darkness that eats into the figure, with dark smoke coming off it
        vec2 q = vec2(px.x / (8.0 * s), px.y / (8.0 * s) + t * 0.8);
        float n = noise(q) * 0.6 + noise(q * 2.2) * 0.4;
        float pulse = 0.5 + 0.5 * sin(t * 1.5);

        base.rgb = mix(base.rgb, base.rgb * 0.35 + colorA * 0.2 * base.a, base.a * (0.45 + 0.2 * pulse));
        add = mix(colorA, colorB, smoothstep(0.55, 0.9, n) * 0.6);
        addAlpha = smoothstep(0.4, 0.8, n) * near(px, 9.0 * s) * (1.0 - base.a) * 0.9;
    }
    else if(mode == 11)
    {
        // a pearly shine sweeping across the figure
        float sweep = fract(t * 0.35) * 2.2 - 0.6;
        float shine = exp(-pow((uv.x * 0.7 + uv.y * 0.5 - sweep) * 7.0, 2.0));

        base.rgb += mix(colorA, colorB, uv.y) * shine * base.a * 0.75;
        add = colorA;
        addAlpha = near(px, 2.0 * s) * (1.0 - base.a) * (0.2 + shine * 0.6);
    }
    else if(mode == 12)
    {
        // power-up: tall spiky energy around the whole body, pulsing fast
        vec2 q = vec2(px.x / (5.0 * s), px.y / (12.0 * s) + t * 3.0);
        float n = noise(q) * 0.55 + noise(q * 2.4) * 0.45;
        float aura = near(px + vec2(0.0, 5.0 * s), 11.0 * s) * (1.0 - base.a);
        float pulse = 0.75 + 0.25 * sin(t * 9.0);
        float flame = smoothstep(0.3, 0.75, n * aura * 1.25) * pulse;

        add = mix(colorA, colorB, smoothstep(0.55, 0.95, n));
        addAlpha = flame * 1.3 + near(px, 3.0 * s) * (1.0 - base.a) * 0.35;
    }
    else if(mode == 13)
    {
        // a glowing ring floating above the head
        vec2 c = vec2(0.5, 0.13 + sin(t * 1.4) * 0.01);
        vec2 r = vec2(0.17, 0.035);
        float ring = exp(-pow((length((uv - c) / r) - 1.0) * 5.0, 2.0));
        float glow = near(px, 3.0 * s) * (1.0 - base.a) * 0.2;

        add = mix(colorA, colorB, 0.5 + 0.5 * sin(t * 2.0));
        addAlpha = ring * (0.85 + 0.15 * sin(t * 3.0)) + glow;
    }
    else if(mode == 14)
    {
        // little bubbles rising around the avatar
        float best = 0.0;

        for(int i = 0; i < 6; i++)
        {
            float seed = float(i) * 1.37;
            float rise = fract(t * (0.18 + hash(vec2(seed, 1.0)) * 0.12) + hash(vec2(seed, 2.0)));
            vec2 p = size * vec2(0.2 + hash(vec2(seed, 3.0)) * 0.6 + sin(rise * 6.0 + seed) * 0.04, 1.0 - rise);
            float d = length(px - p);
            float radius = (1.6 + hash(vec2(seed, 4.0)) * 1.6) * s;
            float bubble = smoothstep(radius + 0.8, radius, d) - smoothstep(radius - 0.2, radius - 1.2, d) * 0.7;

            best = max(best, bubble * smoothstep(0.0, 0.15, rise) * smoothstep(1.0, 0.8, rise));
        }

        add = mix(colorA, colorB, 0.5);
        addAlpha = best * (1.0 - base.a * 0.9);
    }

    addAlpha = clamp(addAlpha * intensity, 0.0, 1.0);

    // additive light on top of the avatar (premultiplied colour)
    gl_FragColor = vec4(base.rgb + add * addAlpha, max(base.a, addAlpha));
}
`;

export interface IAuraVisual
{
    id: number;
    effect: number;
    colorA: string;
    colorB: string;
    speed: number;
    intensity: number;
}

const toRgb = (hex: string): Float32Array =>
{
    const value = parseInt((hex || '#ffffff').replace('#', ''), 16) || 0;

    return new Float32Array([ ((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255 ]);
}

export class AuraFilter extends Filter
{
    constructor(visual: IAuraVisual)
    {
        super(undefined, FRAGMENT, {
            time: 0,
            effect: visual.effect || 1,
            colorA: toRgb(visual.colorA),
            colorB: toRgb(visual.colorB),
            speed: (visual.speed > 0) ? visual.speed : 1,
            intensity: (visual.intensity > 0) ? visual.intensity : 1,
            zoom: 1
        });

        // room to draw outside the figure (flames, mist and orbits reach furthest)
        this.padding = [ 3, 4, 5, 10, 12, 14 ].includes(visual.effect) ? 16 : 10;
    }

    public tick(time: number, scale: number): void
    {
        this.uniforms.time = (time / 1000);
        this.uniforms.zoom = (scale < 48) ? 0.5 : 1;
    }
}
