# Assets we need from Printopack

Everything the site is waiting on, in one place. Kept current as we build: when an asset
arrives, tick it and note where it went. Counts are exact, not estimates.

Last updated: 2026-08-03

---

## 1. Photographs

### 1.1 Product group photos — 2 needed
Twenty of the twenty-two groups already have their real photo from Printopack's own API. Two
are brand new in Amal's approved taxonomy and have never had one. Both currently show
`pouch.png` as an obvious stand-in.

| Group | Arabic | Status |
|---|---|---|
| Medical Applications | التطبيقات الطبية | **needed**, 1600px wide or more |
| Food Powder | المساحيق الغذائية | **needed**, 1600px wide or more |
| Frozen Food | الأطعمة المجمّدة | covered for now by the photo freed when Nuts was removed, a real one would be better |

This is question 6 of the drafted clarifications email.

### 1.2 Product sub-item photos — up to 73
Each of the 73 sections inside the group pages has a photo slot. **None are filled.** The
pages render as clean named sections without them, so these are an improvement rather than a
blocker, and they can arrive a group at a time.

Two of the 73 are not product shots but **measurement charts**, and Bader has confirmed the
measurements are supplied as a photo rather than a typed table:

| Item | Sits inside | What it is | Status |
|---|---|---|---|
| Yoghurt Lids Measurements | Lids | lid size chart | **needed** |
| Ice Cream Measurements | Ice Cream | ice cream size chart | **needed** |
| Bags Measurements | its own group, no sub-items | bag size chart | have one, **too low-resolution** |

**Resolution matters more than usual for these three.** A size chart is read, not admired, so
the pages now show it at the full width of the page. The Bags Measurements chart we hold is
only **1000 x 752**, which at full width is stretched about 1.33x beyond its own pixels and
goes soft exactly where the millimetre figures are. Ask for **2000px wide or more**, or the
original PDF or vector, for all three charts.

Full per-group counts: Chips & Snacks 6 · Chocolates 3 · Bakery Products 4 · Candy 2 ·
Breads 4 · PET & Glass Bottle Labels 4 · Lids 6 · Ice Cream 4 · Chilled Foods 3 ·
Frozen Food 6 · Rice and Detergents 4 · Pasta 2 · Spices 1 · Coffee and Tea 3 ·
Hot Filling Liquid 4 · Jar and Bottle Sleeves 4 · Pet Foods 1 · Tissues 2 ·
Medical Applications 3 · Bags Measurements 0 · Sugar 2 · Food Powder 5.

### 1.3 Office manager photos — 12 needed
One per Regional & Export office, square, 420 x 420px or larger. Four currently carry
**test images** (cropped factory photos, not portraits) purely so the layout could be
reviewed; those must be replaced or cleared. The remaining eight show the manager's initials,
which is the intended empty state.

Tunisia · Libya · Kuwait · Algeria (currently test images) · Yemen · Morocco ·
International Sales · Egypt · Sudan · Jordan · Iraq · Syria (currently initials).

### 1.4 Home page — 8 needed
- **Cover image**, the full-bleed photograph behind "Where technology meets vision".
- **Seven section cover photos**, one per card in the contents index. They currently reuse
  factory photos as stand-ins.
- Bader has a **Google Drive** from the client plus voice notes naming which images to use.
  Those have not reached the repo yet.

### 1.5 Team — names and photos
The team page shows roles with initials, no invented names. Manager names and portraits are
still client-gated.

### 1.6 Gallery
Real photographs, video links (YouTube or Vimeo, never files) and the advertisements. The
sample items in place now are placeholders and are listed for removal in `PRODUCTION_TODO.md`.

---

## 2. Brand assets

- **Logos: DONE, in the repo and live. Do not ask for these again.**
  `printopack-logo.png` (header), `printopack-logo-white.png` (footer) and `logo.png` are
  committed in `public/images/` and serving on printopack1.pages.dev. The palette was
  already locked to the logo colours in `BRAND.md`. Nothing here is outstanding.
- **The approved fonts: a decision is needed, not a file.** The client named **GE Flow Regular**
  (Arabic) and **Narkisim** (English). Researched 2026-08-12:
  - **Narkisim is a Hebrew typeface**, not an English one. Microsoft's own font data lists its
    design language as Hebrew, it ships as a single weight with no bold or italic, and MyFonts
    now says "no longer available for purchase". It cannot be bought or used as the Latin face.
  - **GE Flow** is a Boutros International face from 2005, free for personal use only. It is not
    on the Boutros retail site; comparable GE-range fonts there are **GBP 80 per weight, GBP 190
    per family**, and web-font licensing is quoted separately on request. A web licence is the
    one we would actually need, and self-hosting it in a public repo is a redistribution risk.
  - Recommended instead: an open-licence (SIL OFL) pairing that covers Arabic and Latin, free
    for commercial use and safe to self-host. See the note in `CLIENT_NOTES.md` (G4).
- **Mr Printo**, the mascot artwork.
- **The QR code target**, whatever URL the unified QR should open.

---

## 3. Certificates and documents

- Full ISO and BRCGS certificate scans, to replace the badge images currently shown.
- Any further quality or social-responsibility certificates the client wants published.

---

## 4. Text still owed

- **Arabic sign-off on the 73 sub-item names.** Drafted in natural fusha on our side and
  awaiting Amal's approval, question 7 of the clarifications email.
- Arabic sign-off on the drafted vision and mission text.
- Company history and the owners' section.
- Per-department descriptions for the factory pages.
- Real partner names: all 20 are "Partner 01" to "Partner 20" today, and those placeholders
  now show on the home page. Countries are real.
- Office manager names: 12 of 15 read "Name Name". Three are real (Kuwait: Nader Bilal,
  Tunisia and Libya: Sami Monser, Algeria: Elhaoues Chemseddine).

---

## 5. Answers, not assets

- **Is Nuts deliberately gone?** It is absent from Amal's approved taxonomy and has been
  removed, but it exists on their current site. Worth confirming.
- **Does Printopack have a YouTube channel?** The gallery's video tiles need links.
- The email addresses for the split Libya and Iraq offices, if they should differ from the
  Tunisia and Jordan ones they currently share.
