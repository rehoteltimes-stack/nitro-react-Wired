# Branding and localization of adapted content

Applies when external content (furni, catalog images, promo art, texts) is prepared for Habbo.nz.

## Our identity
Hotel **Habbo.nz**, domain **habbo.nz**. Brand assets found 2026-10-01:
| File | What | Used in |
|---|---|---|
| `hCMS/public/assets/img/header/logo/logo_habbo.png` | yellow "HABBO" word mark (VERIFIED: user, 2026-10-01) | `partials/navbar.blade.php`, `index.blade.php`, `hotel/client.blade.php` |
| `hCMS/public/assets/img/header/logo/logo_habbo_h.png` | yellow "H" icon (VERIFIED: user, 2026-10-01, called "logo_habbo_icon") | the brand icon |
Seasonal variants (2026-10-04, user: keep it gold): `logo_habbo_halloween.png` (website, picked by `App\Support\Branding::logo()` from `config('hcms.logo.months')`) and `cdn/c_images/icons/logo_habbo_icon_toolbar_halloween[@2x].png` (client toolbar, `hotel.logo.season` in ui-config). No dedicated brand kit with a ".nz" mark was found (UNKNOWN). Leftovers that are **not** our brand: `logo_city_*`,
`img/index/logo_habbocity.png`, `logo_loader*_jv_*`, `articles/logo_habboworld.png`.

## Images from another hotel
Change only the other hotel's identity (logo, name, domain, watermark) to Habbo.nz. Keep dimensions, resolution,
composition, furni, layout, shadows, effects, colours and quality. Don't crop, resize, redraw, recolour or redesign
anything else. Legitimate campaign or furni artwork that merely contains text stays as it is. Keep the untouched
source file next to the adapted one (e.g. `<name>.source.png` or a backup folder) for traceability, and record which
files were rebranded in the task's `docs/PROJECT_STATE.md` entry. Pixel-art icons: edit pixels, never scale (see the
Diamond icon fix, 2026-10-01). Never put branding on raw furni renders (nitro2png/swf2png previews).

## Text
| Localise / adapt | Never change |
|---|---|
| UI text, promo header/body, descriptions, campaign text, catalog page captions, furni display names | classnames, ids, `sprite_id`, asset/library names, protocol headers and keys, DB identifiers, `furniline` |
Player-facing text is English (our hotel). Official English names come from Habbo.com furnidata; other hotels' names
are in their language (HabboCity French, habbo.st German) and need translating, which the Furni Editor words/bulk
rename already supports. Our own currency names replace external ones in adapted text (Diamonds, Emeralds,
Snowflakes, HabboCash), and external prices are never copied.
