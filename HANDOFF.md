# Handoff, 2026-08-05

> **Update 2026-08-23 — accessibility controls added.** Every page now carries a fixed
> accessibility toolbar (`src/components/Accessibility.astro`, rendered from `Base.astro`) with two
> controls: an "increase text size" button (uniform root `zoom` at 100/115/130%, so it enlarges the
> whole site without breaking layout) and a "colorless" grayscale toggle (`filter:grayscale(1)` on the
> root element, which is the one place a filter does not trap `position:fixed`). Choices persist in
> `localStorage` (`a11yFont`, `a11yGray`) and are applied pre-paint by the inline script in Base's
> `<head>`, next to the existing lang/dir script. Bilingual labels via `Bi`, RTL-aware placement.

You are picking up a live client project mid-flight. Read this, then `CLIENT_NOTES.md`. Those
two are enough to start; `STATUS.md`, `BACKEND_MIGRATION_PLAN.md` and `db/README.md` cover the
Cloudflare backend, which has not moved in this stretch of work.

Working copy `/Users/bader/printopack-v2`, repo `Heath114/printopack1`, live at
`printopack1.netlify.app`, which rebuilds on every push to `main`.

## What this round of work was

The client (GM Nasser Nabil, marketing Amal Al Zahrani) sent a long list of notes. Every one is
in **`CLIENT_NOTES.md`**, sorted onto the page it touches, with what was done and how it was
verified. That file is the source of truth for this workstream. Roughly 35 of ~50 items are
closed; the rest are listed below.

Three companion documents were produced and are worth knowing about:

- **`ASSETS_NEEDED.md`** - every photograph, logo, font and piece of text still owed by the
  client, with exact counts. Keep it current: when something arrives, tick it.
- **`db/CAPS.md`** - the per-section record limits and the storage reasoning behind them.
- **`PRODUCTION_TODO.md`** - things that must not ship, including test data introduced here.

## Read this before designing anything

`CLIENT_NOTES.md` opens with **"House layout: photo + description"**. The client has asked for
that layout repeatedly and by name. Use it for any list of things that each have a picture and
some words. A grid of small cards was tried and sent back.

## Conventions that will get you corrected

- **No em-dashes or en-dashes.** Anywhere. Hyphens, colons, commas.
- **Arabic must read as Arabic**, natural fusha, never literal translation.
- **Verify, do not assert.** Every claim in `CLIENT_NOTES.md` was checked against a running
  system. Bader notices the difference, and has caught several of my errors this session.
- **Report specifically:** "I did X in page Y, as per the note '...'". He asked for this.
- **Check the admin side of every change.** A page change that leaves the dashboard unable to
  edit the thing you changed is half a change. I was pulled up on this once and it was fair.

## State of the work

**Done this round, briefly:** navigation order and site-wide ordering consistency · counter
pacing and the 1997 ease-in · home news wired to the content store and made responsive · the
seven-section index · navbar logo size · total and average experience counters · the home
partner wall · Tunisia/Libya and Jordan/Iraq split · International in both map selectors ·
per-job careers routing · the map offices moved onto the collection · country toggles for 20
Arab countries with map geometry for 8 new ones · partner `featured` flag with the exactly-20
rule · the map as the partner filter · office manager photos · Amal's 22-group taxonomy with
all 73 sub-sections · measurement sections as their own kind · per-section caps · a
client-settable picture-size limit.

**Nothing is deployed beyond this push.** The admin dashboard still runs in localStorage demo
mode: Cloudflare Pages is not connected, so the Publish button cannot work yet. Bader's
instruction was to leave it until the client notes are finished.

## What is left

### Blocked on the client, chase these
- **The logo file** (or its exact blue and yellow). Blocks G3 colour unification and G5.
- **The font.** Blocks G4.
- **The Google Drive link and voice notes**, for the home cover and the seven section images.
- **Mr Printo** artwork. Approved by Bader as a deliberate gift to the GM; keep it unobtrusive
  so it does not fight the GM's own no-motion rule.
- **Photographs**: see `ASSETS_NEEDED.md`. Headline gaps are 2 product group photos, 3
  measurement charts (one of which we hold but at too low a resolution), 12 office manager
  portraits, 8 home page images.
- **Real partner names.** All 20 read "Partner 01" and those placeholders are on the home page.

### Two decisions waiting on Bader
- **`statOffices` is 10, the regional office list is now 12** after the Tunisia/Libya and
  Jordan/Iraq splits, so the counter contradicts the list beneath it on three pages. Either set
  it to 12 or derive it from the collection, which is what departments and partners already do.
- **Nuts was deleted** because it is absent from Amal's approved taxonomy, but it exists on
  their current site. Worth confirming with her. Recoverable from git.

### Unblocked work, ready to pick up
- **G8**, repeatable photo + description blocks, on the **certificate pages** (3a) and factory
  departments (2b). Note the boundary: Bader corrected an earlier over-generalisation, so this
  goes only on sections he names, one at a time. Not a bulk schema migration.
- **9i**, the home page's seven section cards are hardcoded in `index.astro`, every href, image
  and description. This blocks handing the new home images to the client rather than pasting
  them in ourselves.
- **Pre-production cleanup**: the visitor-facing "added through the site's admin" helper notes
  on quality, partners, careers, news, gallery and contact (3b, 6c, 7b, 8g), plus the test
  office photos. All listed in `PRODUCTION_TODO.md`.
- **Page furniture**, if the client wants it: section headings and button labels across the
  site are still in the pages. Worth doing as one settings panel in a single pass, not
  scattered page by page.

### Deferred by Bader, do not start without asking
- "Make the new automation system" and "unify the databases": too vague to act on, and he said
  to revisit later.
- The Cloudflare backend: connect Pages, bind D1, set `CONTENT_URL` and `DEPLOY_HOOK_URL`.
  This is what makes the Publish button real. Deliberately parked until the notes are done.

## Traps worth knowing

- **A JSX comment cannot sit inside a `.map()` before the returned element.** It makes two
  expressions and the build fails, pointing at a line 200 away from the cause.
- **Astro adds a scoping attribute between the class and `>`.** Verification regexes that
  assume `class="x">` silently match nothing. I reported a false zero twice this way.
- **The preview browser is unreliable for screenshots after scrolling** and throttles
  `requestAnimationFrame`, so animation timing cannot be observed there. DOM measurement is
  reliable; the camera is not.
- **`db/seed.json` is one record per line on purpose.** Rewriting it through a JSON parser
  reflows the whole file into a 1,200-line diff. Edit it as text.
- **The admin has its own demo seed** in `admin.js`, separate from `db/seed.json`. Change one
  and the other drifts. New collections must also be added to `COLLECTIONS`, or they are never
  loaded or saved and the section silently shows empty.
- Bump `KEY` in `admin.js` whenever the demo data shape changes, or existing browsers keep the
  old data.
