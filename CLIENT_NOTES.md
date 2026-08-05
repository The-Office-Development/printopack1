# Client notes, round 2 (2026-08-02)

Every note from the client's list, sorted onto the page it touches. Work top to bottom:
the global section changes shared components and the content schema, so the page sections
below assume it is already done.

Status key: `[x]` done · `[ ]` to do · `[?]` blocked on an answer · `[!]` conflicts with an earlier decision

## House layout: photo + description (READ THIS BEFORE INVENTING A LAYOUT)

**When a section shows a list of things that each have a picture and some words, use the
photo-and-description row.** The client has asked for this format repeatedly and by name. It
is the default; do not design a third variant because a grid of small cards seemed tidier.

The pattern, as built on the factory departments page and now on the product sub-sections:

- alternating full-width rows, `grid-template-columns: 1.1fr 1fr`, `align-items: center`
- photograph on one side, `aspect-ratio: 4/3`, sides swapping every other row via `.reverse`
- beside it: a gold two-digit number, the name as an `h3`, then the description
- when there is no photograph yet, a dashed placeholder holds its shape rather than the row
  collapsing, so a half-filled section still reads as finished
- one column below 820px, with the alternation switched off

Reference implementations: `src/pages/factory.astro` (`.dept-row`) and
`src/pages/products/[slug].astro` (`.range-row`).

## Done so far (2026-08-03)

Nav order and site-wide consistency · counter pacing and the 1997 ease-in · home latest-news
made responsive and wired to the content store · the seven-section shelf became a 4-over-3
index · navbar logo 46px to 62px · total and average experience counters on home, company and
team · the home partner wall wired to the collection with names and countries · Tunisia/Libya
and Jordan/Iraq split · International added to both map selectors · admin demo offices brought
back in step.

Two structural problems surfaced while doing it, both logged below: the map offices are
hardcoded and duplicated (**8h**), and the home page's seven cards are hardcoded (**9i**).

## Bugs reported by Bader and fixed, 2026-08-03

- **Kuwait was drawn as a circle.** The first pass chose click dots by bounding-box *area*,
  which is the wrong measure: Kuwait is a small area but a perfectly clickable 17 x 15 pixels.
  Recomputed on the **narrow axis in real pixels** at the map's desktop size (700px wide,
  ~10px per unit, measured in the browser). Only Bahrain (1.5px across) and Qatar (7.7px) are
  genuinely unhittable and keep a dot. Kuwait, Lebanon, Palestine and Djibouti are 12px or
  wider and stand on their own outlines.
- **Clicking a country sometimes scrolled the page down.** Caused by the new wall filter: the
  partner wall sits above the map, so narrowing 20 cards to 3 removed **971px of page height
  from above the viewport**, measured. Browsers paper over this with scroll anchoring, which is
  best-effort and picks its own anchor, hence "sometimes". The filter now pins the map: note
  its position, mutate, put it back. Verified at 0px movement across select, re-select, an
  empty result and clear.

## Audit: what is admin-editable on the product pages (2026-08-03)

Asked to confirm "everything on every product page is changeable". It was not. Findings and
what was done:

**Two real defects, fixed.** `slug` and `filter` existed in the data but had no admin field,
so a group created in the dashboard would have had no slug and its page would have built to
`/products/undefined`. Slugs are now derived from the English name when missing (verified: a
group with no slug built to `test-group-and-co`), and "Browse family" is now a field.

**Two bands of real copy were hardcoded, now collections:** `formats` (the 6 bag and pouch
formats) and `standard` (the 3 "What every order includes" points on every group page). Text
was lifted verbatim, nothing reworded.

**Corrected after review.** I had also made "How we work" editable. Bader reverted it: how
Printopack takes an order is static, and making it editable only adds something for the client
to look after. It is back in the page and the collection is deleted.
**The scope of the question was the group pages**, not the products listing, so listing-page
furniture is out of scope unless asked for. `formats` is the one listing item still editable,
because the formats Printopack produces genuinely can change; say the word and it goes back
into the page too.

**Editable now:** group name, description, photo, type, browse family and order · sub-item
name, description, photo, type, group, visibility and order · the three bands above · every
counter number.

**Still hardcoded, deliberately for now:** page furniture, meaning section headings and
button labels ("Price on request", "View & enquire", "In this range", "Keep browsing", the
page headline and lede, the catalogue PDF link, the meta description). These are interface
wording rather than content. If the client wants them too, the clean way is one "Products
page" settings panel rather than scattering them, and it is worth doing in one pass across
all pages rather than only this one.

## Answers from Bader, 2026-08-03

- **Photo + description blocks are NOT site-wide.** Only selected sections get them, decided one
  at a time as we reach each section. Do not bulk-migrate the schema.
- **Partners keep one image each.** The cap belongs on the *number of partners*, not on images
  per partner.
- **"The slider" is the seven-section shelf** on the home page, not the hero.
- **Total Experience is calculated**, not typed, and sits last in the counter row.
- **New counters appear on Team, About and the home page.**
- **Arab countries to add:** Qatar, Bahrain, Oman, Lebanon, UAE, Palestine, Djibouti, Mauritania.
  Somalia and Comoros are out.
- **Tunisia/Libya and Jordan/Iraq:** split now, reuse the existing email on both halves.
- **International office:** it exists; it is missing from the selector beside the map.
  Add it to the selector only, it does not need to appear on the map.
- **Careers:** the point is that no single address should collect every application.
  Each job's recipient is chosen in the admin.
- **Mr Printo:** approved as a deliberate gift to the GM, who asked for it himself.
  Keep it unobtrusive so it does not fight his no-motion rule.
- **Automation system** and **unify the databases**: deferred, revisit later.

---

## G. Global (shared components + schema)

These are not one page. Each one changes something every page renders.

- [x] **G1. Navigation order.** DONE 2026-08-03. Client's order: About Us · Quality System · Products ·
      Success Partners · News & Gallery · Careers · Contact.
      Today it is About · **Products · Quality System** · Partners · **Careers · News & Gallery** ·
      Contact, so Products and Quality swap, and Careers moves after News & Gallery.
      `src/components/Header.astro:19` (`nav`, drives both desktop and the mobile panel).
- [x] **G2b. Sub-section order on the hub pages.** DONE 2026-08-03. Audited every place on the
      site where two or more section links appear together, against the header as the single
      source of truth. **One mismatch found:** the About hub listed The Company, *Social
      Responsibility*, Factory Departments, Our Team, while the nav says The Company, Factory
      Departments, Our Team, Social Responsibility. Fixed.
      Everything else already agreed: the Quality hub, the News & Gallery hub, the three
      Quality sub-pages' sibling links, the home cards, the mobile panel and both footer
      columns. Verified from the built HTML, not by reading source.
- [x] **G2. The same order everywhere.** DONE 2026-08-03. The footer was reorganised as well:
      the Company column is now the About Us group in mega-menu order, and Explore is the
      remaining main sections in navigation order. Success Partners was missing from the footer
      entirely and has been added. "Be consistent in the ordering of all the pages."
      Three other places repeat the section list and must match G1:
      `src/pages/index.astro:46` (the seven cover cards), `src/components/Footer.astro`
      (Explore column), and the mobile nav (already derives from G1, verify).
- [ ] **G3. Colours: only the logo palette.** Retokenise `src/styles/global.css`
      (`--navy`, `--gold`, `--gold-bright`, `--cream`, `--paper`) to the exact logo blue and
      logo yellow, then sweep for hardcoded colours. Explicitly named by the client for the
      **map** (`.rc-served` / `.rc-ctx` fills in `contact.astro` and `partners.astro`).
      Needs the logo file or its hex values first.
- [ ] **G4. Fonts.** Currently Jost (display) + Inter (body) + IBM Plex Sans Arabic,
      loaded in `src/layouts/Base.astro`. Client says edit them. Needs to know which font.
- [~] **G5. Logo.** Two halves. **Larger in the navbar: DONE 2026-08-03**, 46px to 62px inside
      the 82px bar (10px breath each side, the most it takes without the bar growing), and
      36px to 46px on mobile. The "Saudi Modern Packaging Factory Co. Ltd." strapline is
      legible at this size where it was not before.
      **Still to do:** swap in the new logo file itself, in the header, the footer and the
      favicon. Blocked on the file.
- [x] **G6. Counters: slow them down, the 1997 one especially.** DONE 2026-08-03. Duration now
      scales with the distance travelled (~150ms per step, floor 2.6s, cap 6s), so the year
      counter runs 4.35s instead of 2.8s while short counts are unchanged in feel.
      Counters that start from a real number also **ease in** rather than out: 1997 now holds
      for 1.13s before the first tick, then accelerates, covering the last 16 years in the
      final second. Zero-based counters keep the ease-out, since nobody reads the 0. `src/components/Counter.astro`
      uses a flat `dur = 2800` for every counter. The year counter runs 1997 to 2026 in that
      same 2.8s, so four digits churn the whole time. Fix: scale duration to the distance
      travelled, or give `from`-counters their own longer duration.
- [x] **G7. Two new counters: total experience, and average employee experience.**
      DONE 2026-08-03 on all three pages: home, `company.astro` (the About Us content page,
      `about.astro` is a hub with no counters) and `team.astro`. Each row went from four
      counters to six and from four columns to three, so they make two even rows.
      `stats.totalExp` is derived as employees x average, so it can never contradict the two
      numbers the client already maintains, and needs no third admin field. On the home page
      the counter row went from four to six and from four columns to three, so it makes two
      even rows, with combined experience last as asked. Current figures: 400 x 14 = 5,600.
- [ ] **G8. Repeatable photo + description blocks, on selected sections only.**
      Every collection today has exactly one `image` plus one description. Some sections need
      several: a repeatable `blocks: [{ image, caption, captionAr }]` array on the record, a
      repeater field type in the admin drawer, and a renderer component.
      **Which sections is decided section by section as we reach them, not up front.**
      Confirmed so far: product group pages (4a) and the certificate pages (3a).
      Confirmed NOT included: partners, which stay at one image each.
- [x] **G9. Per-section limits.** DONE 2026-08-03. Fourteen limits, one per collection, each
      with its reasoning written up in `db/CAPS.md` rather than picked as a round number:
      News 500 (the client's own figure), Products 300, Gallery 250, Partners 200, Team 60,
      Offices 40, Product Groups 40, Quality 40, Responsibility 40, Careers 40, Factory 30,
      Formats 20, Values 12, Standard 10.
      **The storage maths, which is what actually constrains it:** pictures live in the 500 MB
      D1 database. Every upload is re-encoded to WebP in the browser, measured at ~65 KB for a
      4.6 MB phone photo, with a 400 KB hard reject. If every limit were filled that is 1,500
      pictures: ~98 MB at the measured size, ~600 MB at the absolute worst case. The limits are
      not shrunk to solve the worst case, because it assumes 1,500 worst-case uploads; the
      dashboard's storage meter is the global backstop, and the cheapest fix if it ever nears
      the ceiling is lowering the 400 KB threshold, not deleting content.
      Enforced in the admin: a section warns when it is within 10% of its limit, and a create
      at the limit is refused with "Delete one before adding another", leaving the drawer open
      so nothing typed is lost. Verified by filling Values to 12 and being refused the 13th.
      **Revised on Bader's instruction:** Gallery 250 to 500, Partners 200 to **1,000**, because
      a customer is a partner in the client's book and Printopack has roughly a thousand
      customers. Partner logos are transparent PNGs at roughly 30 KB rather than 65 KB photos,
      so the realistic total across all 2,550 picture slots is ~131 MB of the 500 MB.
- [x] **G9b. A picture-size limit the client controls.** DONE 2026-08-03. The 400 KB ceiling was
      a constant in the code; it is now **Settings > Pictures > Largest picture (KB)**, clamped
      to 40-600. The browser compressor steps quality down to reach it and **refuses** anything
      that still will not fit, naming its actual size, instead of letting it through. The same
      setting is re-read and enforced in `functions/api/upload.js`, so a browser cannot be
      bypassed, and the limit is not duplicated as a second number that could drift.
      Verified with one identical 10.9 MB image: refused at a 40 KB limit ("That picture is 41 KB
      and will not compress under the 40 KB limit"), accepted at 95 KB once the limit was 400.
      This is the release valve for the storage maths above: if the meter climbs, lower the
      picture limit rather than delete content.
- [x] **G9c. Bug found and fixed while testing.** `formats` and `standard` were never added to
      the admin's `COLLECTIONS` registry when I created them, so neither was loaded into the
      cache or persisted, and both new sections would have shown as empty. Registered, verified
      at 6 and 3 records.
---

## 1. Home (`src/pages/index.astro`)

- [x] **1a. The seven-card shelf: show all seven properly.** DONE 2026-08-03, pending review.
      The side-scroll shelf became a twelve-column grid: four cards of span 3 over three of
      span 4, both rows flush to the page edges. Card height dropped from 420-520px to
      300-380px so two rows do not run to a thousand pixels. Two up below 1140px with the
      seventh full width, one up below 640px. The arrows, the drag-to-scroll script, the
      snap logic and the "swipe to see all seven" hint are all gone, and the lede no longer
      tells the visitor to move sideways.
- [x] **1b. Card order** follows G1 (Careers and News & Gallery swap). DONE 2026-08-03.
- [ ] **1c. Cover image.** Replace `/images/hero.jpg` with the client's new image.
- [?] **1d. New slider images** from the client, or from the Google Drive he sent, cross-referenced
      against the images he named in the voice notes. Neither the Drive link nor the voice notes
      are in the repo. Needed before this can start.
- [x] **1e. Latest news section.** DONE 2026-08-03. Two fixes:
      the grid was `repeat(3,1fr)` with a hard `1fr` override from 1000px down, so tablets got one
      enormous card per row; it is now `auto-fit minmax(290px,1fr)` and measures 3 / 2 / 1 columns
      at 1440 / 820 / 414 with no horizontal overflow.
      Separately the three posts were **hardcoded** and did not come from the content store, so
      publishing a post never changed the home page. They now read the three most recent records
      from the `news` collection, with each post's own category label rather than a fixed one.
- [x] **1f. Main partners strip.** DONE 2026-08-03. It was a hardcoded `Array.from({length:20})`
      over `client-N.png`, so a partner added or removed in the admin never reached the home
      page. It now reads the `partners` collection and uses the **same card as the Success
      Partners page**: logo, then name and country, with the meta block collapsing when both
      are empty. Four across instead of five, since the name and country need the width.
      Verified: home and `/partners` render the same 20 records with identical names and
      countries.
      **Two things still open on it:** the `featured` flag (5c) is not built, so the home page
      currently shows every partner rather than a chosen 20; and see the placeholder-names
      warning in section 10.

---

## 2. About Us (`about.astro`, `company.astro`, `factory.astro`, `team.astro`, `responsibility.astro`)

- [ ] **2a. Counters** on these pages pick up the two new stats (G7).
- [ ] **2b. Photo + description blocks** on factory departments (G8), so a department can carry
      several photos rather than one.

---

## 3. Quality System (`quality.astro`, `quality/certificates`, `quality/assurance`, `quality/lab`)

- [ ] **3a. Certificates take many photos with descriptions.** Named explicitly by the client.
      The `quality` and `responsibility` collections both have a single `image` field today.
      This is G8 applied to the two certificate collections, plus the admin fields for it.

      > **Audit + decision, 2026-08-05.** Asked to make sure every certificate is admin-wired
      > and uniform. **They already are, verified against the code:** every certificate on the
      > site renders from a collection through the one shared `.cert-card` grid, nothing is
      > hardcoded. Quality certificates come from `collection('quality')` filtered to
      > `kind==='Certificate'` (`quality/certificates.astro:33`, qual-01 BRCGS, qual-02 ISO
      > 22000); the six Social-Responsibility certificates come from `collection('responsibility')`
      > (`responsibility.astro:61`, resp-01..06). The grid is "any number, any shape", so adding a
      > certificate in the admin adds another identical card.
      >
      > **Bader's steer:** keep exactly this layout, nothing different, no per-certificate photo
      > gallery. So 3a's "many photos" is met at the section level (add more certificate cards),
      > not by a per-record repeater. **The G8 repeater is therefore NOT being built for
      > certificates.** If the client later wants several images inside a single certificate card,
      > revisit then.
      >
      > **One real inconsistency found and left as-is on Bader's instruction:** the `quality`
      > collection also holds `qual-03` (kind `Assurance`) and `qual-04` (kind `Lab`), and the
      > admin lets you edit both, but no page reads them: `quality/assurance.astro` and
      > `quality/lab.astro` render hardcoded 4-step process lists and ignore the collection. Same
      > "admin edits something the page ignores" class as the old careers/products bugs. Not fixed
      > now because the hardcoded pages carry richer copy than the single record, so reconciling it
      > is a design choice, not a rote wiring. Logged here for whoever picks it up.
- [ ] **3b.** Remove the visitor-facing `.qnote` helper line (already tracked in
      `PRODUCTION_TODO.md`).

---

## 4. Products (`products.astro`, `products/[slug].astro`)

The 22-group taxonomy from Amal's 2026-07-27 email is a separate, already-analysed workstream.
These notes settle two open questions from it.

- [x] **4a. Sub-items live inside the group page.** DONE 2026-08-03.
      All **73** of Amal's sub-items are in the `products` collection and render as sections
      inside their group page, in her order: her 71, plus the two measurement pages her closing
      note nests inside their parents (Yoghurt Lids Measurements under Lids, Ice Cream
      Measurements under Ice Cream). Bags Measurements correctly has none, being standalone.
      Verified from the built HTML on all 22 pages: 73 rendered, group by group, in order.
      Each section has a photo and description slot the client fills from the admin; until then
      it renders as a clean named card rather than an empty frame. Arabic names are drafted
      natural fusha and still need Amal's sign-off (question 7 of the clarifications draft).
- [x] **8d-layout. Office manager photo repositioned** after Bader's review: it was a 42px
      circle tucked beside the manager's name, which read as an afterthought. It is now a
      square (84 to 104px, flush right) filling the empty space beside the office details, top
      aligned with them.
- [x] **4b + 4c. Measurements get their own design, and the Bags chart is enlarged.**
      DONE 2026-08-03. Measurement content is now a **kind**, not something detected from its
      name: `products.kind` and `productGroups.kind` take "Measurements", both settable in the
      admin, so the client can mark any future chart without touching code. Naming detection
      would have broken the moment someone renamed a section or worked in Arabic.
      **Sub-section charts** (Ice Cream Measurements, Yoghurt Lids Measurements) drop out of
      the alternating photo row into their own full-width block: a "Measurements" pill, a
      larger heading, the chart shown whole rather than cropped, and an "Open full size" link.
      Empty ones say the chart is being prepared instead of showing a photo placeholder.
      **The Bags Measurements group page** puts the details column below the chart so the
      drawing takes the full page width: 1326px rendered against roughly 610px before, and it
      opens at full size. `aspect-ratio` and the inner padding come off so nothing is wasted.
      **Limit worth knowing:** the chart we hold is only 1000 x 752, so at full width it is
      upscaled 1.33x and softens exactly where the millimetre figures are. Logged in
      `ASSETS_NEEDED.md`: ask for 2000px or wider, or the original PDF.
- [x] **4d. The 22-group taxonomy is applied.** DONE 2026-08-03, from Amal's approved email of
      2026-07-27 ("يرجى اعتماد هذا الترتيب عند تصميم صفحات المنتجات").
      22 groups in her numbered order, which is now the site order. 3 new (Frozen Food, Medical
      Applications, Food Powder), 7 renamed (Rice to Rice and Detergents, Custom Bag Sizes to
      Bags Measurements, Pet Food Bags to Pet Foods, Soft & Wet Tissues to Tissues, plus wording
      on Coffee and Tea, Hot Filling Liquid, Jar and Bottle Sleeves). Slugs follow the new names,
      so `/products/rice` is now `/products/rice-and-detergents`.
      The filter rail's "Snacks & Nuts" became "Snacks". All eight filters still populate
      (1+2+2+6+3+4+4 = 22), verified in the browser.
      **Two things need the client:**
      1. **Nuts is deleted.** It is absent from her approved list, and her list is the
         instruction, but it is a section that exists on their current site. Recoverable from
         git if the GM objects. **Worth confirming with Amal.**
      2. **Medical Applications and Food Powder have no photograph** and both currently show
         `pouch.png` as an obvious stand-in. Frozen Food took the image freed by Nuts. These are
         question 6 of the clarifications draft: three section photos at 1600px or wider.

---

## 5. Success Partners (`partners.astro`)

- [x] **5a. Admin-managed partners: already built, verified 2026-08-03, nothing to write.**
      Exercised in the running dashboard rather than read: created a test partner (list went
      8 to 9), then deleted it (back to 8). The drawer offers Logo upload, Client name EN and
      AR, Country EN and AR, and Website, and every row has edit, delete and reorder.
      The remaining partner work is 5b, 5c, 5d and the cap in G9.
- [ ] **5e. The admin demo database disagrees with the site.** Its localStorage seed holds
      **8** partners where the content store holds 20, and its demo partners have `name` set
      equal to `country` ("Saudi Arabia / Saudi Arabia"). Demo-mode only, so it disappears once
      the dashboard points at D1, but until then the dashboard misrepresents the live site.
- [x] **5b + 5d. The map is the filter.** DONE 2026-08-03. Bader's clarification folded these
      into one: "sort by country" IS the map. Selecting a market on the map or its chips now
      narrows the partner wall to that country as well as showing the office. A bar appears
      above the wall reading "3 in Kuwait" with a "Show all partners" reset; a country with an
      office but no partners says so rather than showing an empty grid; International is a
      catch-all, so it shows its office and leaves the wall whole.
      Verified in the browser: 20 to start, Kuwait 3, Saudi 3, Libya 0 with the empty message,
      International 20, reset back to 20.
- [x] **5c. Main partners.** DONE 2026-08-03. A `featured` flag on the collection, a new
      `src/data/partners.ts` shared by the home strip and the wall, and the exactly-20 rule in
      the admin: a 21st is refused with "Already 20 main partners. Turn one off first.", and
      the list view carries a tally that stays amber until the count is exactly right.
      **A bug surfaced while testing this and was fixed:** a newly created partner never set
      the flag at all, so it bypassed the cap and the site still counted it as main. New
      partners now normalise to "false" on save, the select defaults to "false", and the site
      treats a missing flag as not-main. `mainPartners` tops the strip up from the client's
      own order if fewer than 20 are ever flagged, so the home page cannot go short.

---

## 6. News & Gallery (`news.astro`, `gallery.astro`, `news-gallery.astro`)

- [x] **6a. News cap of 500 posts.** DONE via G9. Original note: cap of 500 posts, enforced in the admin with a clear message when full (G9).
- [ ] **6b.** Multiple photos per post and per gallery item (G8).
- [ ] **6c.** Remove the `.evnote` and `.sample-note` helper lines and the placeholder
      exhibitions and sample media (`PRODUCTION_TODO.md`).

---

## 7. Careers (`careers.astro`)

- [x] **7a. Per-job application email.** DONE 2026-08-03. The mechanism existed (the apply button
      writes the role's address into the form's hidden `applications_email` and shows it to the
      applicant) but **`careers.astro` held its own hardcoded `roles` array and ignored the
      collection entirely**, so nothing the client did in the admin reached the page, and all
      three example roles shared `hr@printopack.com.sa`. Same bug class as the home news strip
      and the partner wall.
      Roles now come from `collection('careers')`, drafts are filtered out, and each job carries
      its own address. Verified in the browser: choosing Quality Control writes
      `quality.jobs@printopack.com.sa` into the hidden routing field and tells the applicant so;
      Production writes `production.jobs@`.
      The collection gained `summary`, `summaryAr`, `deptAr`, `typeAr`, `locationAr`, and
      `requirements` became one-per-line so each line renders as a bullet. All of it was migrated
      out of the hardcoded page rather than invented, so no copy was lost.
      **Caveat: nothing delivers the mail yet.** The form still needs the Netlify Function that
      reads `applications_email` and forwards to it (already in `PRODUCTION_TODO.md`). Per-job
      routing is now correct in the payload; the last mile is unbuilt.
- [ ] **7b.** Remove the `.cnote` helper line (`PRODUCTION_TODO.md`).

---

## 8. Contact (`contact.astro`)

- [x] **8a. Split Tunisia and Libya.** DONE 2026-08-03. `off-07` became Tunisia, `off-07b` is
      Libya, both keeping `tunisia@printopack.com.sa` and Sami Monser, per Bader.
- [x] **8b. Split Jordan and Iraq.** DONE 2026-08-03. `off-14` became Jordan, `off-14b` is Iraq,
      both keeping `jordan@printopack.com.sa`. Offices went 15 to 17.
      Both pages also carried hardcoded "Jordan & Iraq office" / "Tunisia & Libya office"
      captions under the map popups; those are cleared.
- [x] **8c. International in the selector.** DONE 2026-08-03. Added as an `int` entry on the
      Contact market pull-down and as a chip on the Partners map selector. It has no country
      to colour, so it is deliberately absent from the map: the map draws from
      `reachMap.served`, which has no `int` key. The popup centres over the map instead of
      inheriting the previous selection's position.

- [!] **Consequence of 8a and 8b: the offices counter is now wrong.** `statOffices` is 10, which
      matched the Regional & Export count before the split. That count is now 12, so the
      counter on the home, company and contact pages contradicts the list beneath it.
      Either set it to 12 in the admin, or derive it from the collection the way departments
      and partners already are. **Decision needed.**
- [x] **8d. A photo of the manager on each Regional & Export office.** DONE 2026-08-03.
      New `photo` field on the `offices` collection with an upload in the admin drawer, so it is
      changed exactly like the email and phone. Rendered as a 42px round photo beside the role
      and name on all 12 regional offices. Until a photo is uploaded the slot shows the
      manager's initials (Nader Bilal reads NB, Sami Monser SM), falling back to the office name
      where no manager is named yet, so an empty slot looks deliberate rather than broken.
- [x] **8e. Add a whole office from the admin.** DONE 2026-08-03 as part of 8f: the
      Countries panel creates the office when a country is switched on, and the generic
      "New office" button was already there for anything else.
- [x] **8f. Country toggles for every Arab country.** DONE 2026-08-03.
      A **Countries on the map** panel in the admin lists all 20 Arab countries with a switch.
      Switching one ON creates its office record, which is what makes both maps draw it;
      switching OFF deletes that record after a warning naming what is lost. The office record
      *is* the switch, so there is no second list to keep in step.
      Map geometry for the eight new countries (Qatar, Bahrain, Oman, Lebanon, UAE, Palestine,
      Djibouti, Mauritania) was generated from the same mledoze borders the original paths came
      from, in the same projection (decoded from the committed paths as x = lon x 0.9, y = -lat)
      and validated against published extents: every one lands within 0.6 degrees.
      The map frame was widened from `-13.26 -38.94 64.76 31.66` to `-15.60 -38.94 69.80 31.66`,
      because Mauritania's coast and Oman's eastern tip both fell outside the old one and would
      have drawn half off the map. **This makes the map slightly smaller on screen, so it is
      worth a look.**
      **Click targets:** Qatar draws 8x16px at full width and Bahrain less, so the six smallest
      countries (Qatar, Bahrain, Kuwait, Lebanon, Palestine, Djibouti) now also get a 17px dot
      that highlights with the country. Kuwait was already on the map and already too small,
      so this fixes an existing problem as well.
      Verified end to end: flipping Qatar on produced a Qatar office row ready for its details,
      Qatar appeared on both maps and in both selectors, its popup read correctly, and
      switching it off removed all of it. No test data left in the seed or the demo database.

- [ ] **8g.** Remove the `.cnote` helper line and the "Office manager" placeholders
      (`PRODUCTION_TODO.md`).

---

## 8bis. The map offices are not admin-editable (found 2026-08-03)

Worth its own entry, because 8f depends on it and it is invisible from the outside.

`contact.astro` reads the `offices` collection for the **directory list**, but the map popups,
the market pull-down and the country chips all run off `officesByCc`, a hardcoded object that
is **duplicated in `contact.astro` and `partners.astro`**. Editing an office in the admin
changes the list and leaves the map saying something else, and any office change has to be
made by hand in two files.

- [x] **8h. Put the map offices on the collection.** DONE 2026-08-03.
      New `src/data/offices.ts` builds `officesByCc` from the collection; both pages import it
      and the two hardcoded copies are gone. An office joins the map through a new `cc` field
      the admin sets ("Country on the map"), so the client decides which country a record
      lights up. A record with no `cc` (Riyadh, Dammam, Key Accounts, Jeddah Office) stays in
      the directory and off the map, which is right: the map colours countries, not branches.
      Country names live in code, not the collection, since they are country names rather than
      client copy. Role is derived: `sa` is Head Office, `int` is International Sales, the rest
      are Regional Office.
      Verified two ways. **Parity:** all 13 popups render exactly what the hardcoded version
      did, email and phone included. **The link:** changing Kuwait's phone in the collection
      changed it on the Partners map popup and on the Contact page in the same edit.
      The selector order now follows the collection's own order, so the admin's reorder arrows
      control it. It used to be a hand-written array.

## 9. Admin dashboard (`public/admin/admin.js`, `admin.css`)

Most notes above end here. Collected so the dashboard is worked on once, not nine times.

- [x] **9h. Demo offices split** to match the site, 15 to 17, and the storage key bumped
      `pp_admin_v4` to `v5` so existing sessions reseed rather than keeping the combined
      records. DONE 2026-08-03, verified: the dashboard lists 17 with Tunisia, Libya, Jordan
      and Iraq separate.
- [ ] **9i. The home page's seven section cards are hardcoded** in `index.astro`: every href,
      image, name and description. The comment above them claims the photos are "swapped for
      Amal's real assets via the admin", which is not true. Needed before the new cover and
      section images (1c, 1d) can be handed to the client rather than pasted in by us.
- [x] **9g. Careers admin extended** to match 7a: `deptAr`, `typeAr`, `locationAr`, `summary`,
      `summaryAr`, a note on the email field explaining that a manager vacancy should go to that
      manager, and a note that requirements are one per line. Demo records updated with distinct
      per-role addresses. Storage key `pp_admin_v5` to `v6`. DONE 2026-08-03.
- [ ] **9a.** Repeater field type: many photos, each with its own description (G8).
- [x] **9b. Per-collection caps** with the warning and the block message. DONE via G9, plus a
      client-settable picture-size limit in Settings > Pictures.
- [x] **9c. Partners: `featured` flag with the exactly-20 rule.** DONE 2026-08-03, exercised in
      the running dashboard (limit temporarily lowered to 8 to reach it, then restored): the
      21st is refused, an untouched new partner saves as not-main, and the tally reports the
      count. Storage key `pp_admin_v7` to `v8`.
- [x] **9j. Offices gained a "Country on the map" field** (`cc`) with the country list, an
      explanation of when to leave it blank, and demo records filled in. Storage key
      `pp_admin_v6` to `v7`. DONE 2026-08-03, verified in the drawer.
- [x] **9d. Offices: manager photo and add-an-office.** DONE via 8d and 8e.
- [x] **9e. Country registry with on/off toggles.** DONE via 8f: the Countries on the map panel.
- [x] **9f. Counters panel.** Nothing needed: average experience was already a field, and total
      experience is derived from it rather than typed, so there is no third number to maintain.
- [x] **9g. Per-job application email verified end to end.** DONE via 7a.

---

## 10. Needs the client, or needs Bader

- [?] **Real partner names.** The 20 partner records carry placeholder names, "Partner 01" to
      "Partner 20", because the client's own API never had per-client names; only the countries
      are real. Those placeholders were harmless while the home page showed logos alone, but
      now that names render there they are on the front page. Either get the real names from
      Amal, or blank the name field in the seed so both walls fall back to logo plus country,
      which the markup already handles. Decision needed.
- [?] **The logo file**, or its exact blue and yellow (blocks G3, G5).
- [?] **The font** he wants (blocks G4).
- [?] **The Google Drive link and the voice notes** (blocks 1d, and the new cover image).
- [?] **The mascot artwork**, "Mr Printo" (blocks 11).
- [?] **Libya, Iraq and the new international office**: email addresses and managers (blocks 8a to 8c).
- [?] **"Make the new automation system"**: too vague to act on. Publishing automation, news
      import, something else?
- [?] **"And unify the databases"**: which databases? The old `api.printopack.com.sa` and the new
      D1, or the admin's localStorage demo and D1?
- [?] **"With the total experience being at the end of"**: the sentence is cut off. End of which row?

---

## 11. Conflict to resolve before building

- [!] **Mr Printo, the mascot: "appearing every once in a while, animated, and waving."**
      The GM's own design brief is **no motion, no animation**, on the grounds that it tires the
      eyes and distracts, and the whole site was built to that rule. An animated waving mascot is
      the opposite of it. Confirm with the GM before building, and consider a still mascot as the
      compromise.
