# Brand palette (locked, 2026-08-05)

The client (GM Nasser Nabil) has fixed the site's colour palette. **These three colours,
plus white, are the ONLY colours that may ever be used anywhere on the website.** No other
hues, no tints outside this set, no third-party accent colours. This is a hard rule, not a
starting point.

| Role            | HEX       | RGB           | Notes                                  |
|-----------------|-----------|---------------|----------------------------------------|
| Red             | `#a60006` | 166, 0, 6     | The logo red (used for the hero slogan)|
| Blue            | `#0046a2` | 0, 70, 162    | Primary brand blue                     |
| Orange          | `#f89900` | 248, 153, 0   | Accent                                 |
| White           | `#ffffff` | 255, 255, 255 | Backgrounds / surfaces                 |

Greyscale for text (near-black ink, muted grey) and true black are understood as neutral,
not "colours"; keep them minimal. The intent is: white surfaces, blue as the dominant brand
colour, red and orange as accents, nothing else.

## Migration note (current site does NOT match this yet)

`src/styles/global.css` currently ships the older navy / gold / cream system, which must be
brought onto the locked palette:

- `--navy #16457f`  ->  brand blue `#0046a2`
- `--blue #1a4fa0`  ->  brand blue `#0046a2`
- `--gold #ef8b1f` / `--gold-bright #f7a53c`  ->  orange `#f89900`
- `--paper #faf6ee`, `--cream #f2ebdc`, `--sand #e8ddc8` (warm ivory surfaces)  ->  white
- add a red token `#a60006` (does not exist yet; needed for the hero slogan and accents)

Re-skinning to these tokens is a distinct task, not yet done. Do it in `global.css` at the
`:root` level so it flows through every component, then review each page live.
