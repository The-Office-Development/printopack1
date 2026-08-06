# Printopack - Design Standard

The rules every page and component follows, so the site stays coherent as the admin and
future work add to it. The colour palette itself is locked in `BRAND.md`; this file is how
those colours are *used*, especially for anything a visitor can click.

All of it is enforced through the tokens in `src/styles/global.css` `:root`. Reference the
tokens, never the raw hex, so a single edit still flows everywhere.

## 1. Palette (from the client, locked)

Only these colours, plus white and neutral greys for text. No other hues, no tints outside
this set.

| Role   | HEX       | Token                | Used for                                    |
|--------|-----------|----------------------|---------------------------------------------|
| Blue   | `#0046a2` | `--blue` / `--navy`  | Brand blue. Clickable elements, dark bands.  |
| Yellow | `#f89900` | `--gold`             | Accent. The hover colour for clickables.     |
| Red    | `#a60006` | (hero only)          | Reserved for the hero slogan / rare accents. |
| White  | `#ffffff` | `--white`            | Surfaces.                                    |

Neutrals (`--ink`, `--muted`, `--faint`) carry body text and are treated as non-colours.
Warm surface tokens (`--paper`, `--cream`, `--sand`) are the ivory backgrounds.

Blue is the dominant brand colour, yellow and red are accents. Red is not an interaction
colour: it belongs to the hero slogan and must not leak into buttons, links or the map.

## 2. The interaction rule (the important one)

**A clickable thing is client blue, and turns client yellow on hover.** One rule, whole site.

| Surface            | At rest (clickable) | On hover              | Token pair                              |
|--------------------|---------------------|-----------------------|-----------------------------------------|
| Light (ivory)      | Blue `#0046a2`      | Yellow `#f89900`      | `--link` -> `--link-hover`              |
| Dark (navy / photo)| Yellow `#f89900`    | White `#ffffff`       | `--link-on-dark` -> `--link-on-dark-hover` |

Blue disappears on a blue band, so dark surfaces invert: yellow reads as the clickable
colour there, and hover lifts to white. Never hand-pick a hover colour on an element;
point it at these tokens.

Yellow is therefore the **unified hover colour** across the site. Existing hovers that flip
an ink, white or muted element to yellow (nav, header icons, "read more", map countries)
already obey this and stay as they are.

### Buttons

Filled buttons are the exception to "text goes yellow": they swap their whole fill.
- `.btn-solid` / `.btn-gold`: blue and yellow trade places on hover (fill + text invert).
This is the same blue/yellow relationship, expressed as a fill instead of a text colour.

### The action link (`.link-line`)

The shared component for in-content links ("Read more", "Become a partner", "Show all
partners"). It carries a static 1px underline and blue text at rest; on hover the text turns
yellow (instant, no motion) and the underline follows the text colour. On dark surfaces add
`.on-dark`.

```html
<a class="link-line">Read more</a>              <!-- light band -->
<a class="link-line on-dark">Become a partner</a> <!-- navy / photo band -->
```

## 3. Motion

The client asked for a still site: `global.css` ships a global kill switch
(`*{transition:none!important;animation:none!important}`). Nothing moves anywhere, with **no
exceptions**. Hover feedback is always an instant colour change, never a transition or a
wipe.

No auto-playing motion, carousels, parallax, or reveal-on-scroll. `data-reveal` attributes
in the markup are intentionally inert.

## 4. Applying this to new work

- Use `--link` / `--link-hover` (and the `-on-dark` pair) for anything clickable. Do not
  reintroduce `--gold-bright` as a hover on an already-yellow element: yellow-on-yellow is
  invisible, which is the bug this standard fixes.
- New action links use `.link-line`. Add `.on-dark` on navy or photo backgrounds.
- Keep red out of interactions.
- Match hairline dividers to the partner-grid pattern (per-card borders, not a line-coloured
  background showing through gaps) so partial rows never leave a grey block.

### Known deviation to decide on

Primary navigation (`Header.astro`) currently uses `--ink` at rest with a yellow hover,
rather than blue, for editorial calm. If the "clickable = blue" rule should extend to the
top nav as well, that is a deliberate, separate change (it repaints every page's header) and
should be confirmed before making it.
