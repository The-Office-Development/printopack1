# Printopack: open tasks

Working list for the remaining work. Grouped by what blocks a launch, what needs a decision from
Bader or the client, and the four phases we agreed with the client on 2026-08-13.

Keys: `[x]` done · `[ ]` to do · `[~]` in progress · `[?]` waiting on someone else · `[!]` blocks launch

Sister documents: `CLIENT_NOTES.md` (every client note, by page), `ASSETS_NEEDED.md` (what the
client still owes), `SES_PRODUCTION_ACCESS.md` (the plan for the email tool's sending account),
`db/CAPS.md` (per-section record limits).

Last updated: 2026-08-18 (client edit round complete)

---

## ACTIVE: Phase 4, the latest client updates

The GM sent two emails on 2026-08-13: seven section images, and a marked-up PDF of design notes.

- [x] **The seven main-page section images.** He named each file after its section, so the mapping
      is his and not a guess. Converted to WebP q80, long edge capped at 1200, never upscaled.
      5.4MB down to 516KB, a 90% reduction. Sources are in iCloud Drive root.

      | Section | His filename | Output | Size |
      |---|---|---|---|
      | About Us | About us.jpeg | `section-about.webp` 1200x800 | 72KB |
      | Quality System | Quality.png | `section-quality.webp` 1200x1179 | 46KB |
      | Products | Products.jpeg | `section-products.webp` 1200x800 | 97KB |
      | Success Partners | Parnter.jpeg | `section-partners.webp` 884x496 | 46KB |
      | News & Gallery | Event.jpeg | `section-news.webp` 1200x802 | 90KB |
      | Careers | Carrier.png | `section-careers.webp` 799x1200 | 129KB |
      | Contact | Conatct us.jpeg | `section-contact.webp` 627x632 | 17KB |

      (`\.png` in the same folder is a byte-identical duplicate of `Quality.png`. Ignored.)

- [x] **Client edit round, 2026-08-18.** Everything Bader relayed from the notes is built:
      - **Hero:** the dark scrim is gone. The photo is a studio lineup on a flat `#ececec`
        sweep (sampled at every corner and edge), so the section adopts that colour and the
        copy reads directly on it in brand blue at 7.41:1. `contain`, never `cover`, so the
        five products are never cropped.
      - **Contents cards:** all seven one size. Twenty-four tracks, every card spanning 6,
        bottom row of three centred.
      - **Counters:** removed from all seven inner pages and consolidated on the home page,
        nine of them, five to a row with the second row centred. Band widened past the
        1560px cap to 2000px. Average experience now genuinely decimal (14.5) via a new
        `_dec` helper; `_num` was reading "14.5" as 145. Combined experience derives and
        rounds from it. The years counter renders `1997 - 2026`, both figures the same size,
        only the second counting.
      - **Brand partners:** five per row on the home page and the partners page.
      - **Closing band:** the quote CTA and the newsletter merged into one horizontal split,
        on `#ececec` so it no longer shares the footer's blue.
      - **Footer:** bilingual lockup, recoloured at source as SVG (white lettering, brand
        orange swoosh, brand red dot), scaling 100px to 136px. Column headings removed and
        all columns levelled. Offices alphabetical, sorted per language from the collection
        so new admin entries land correctly with no manual reordering. Offices label softened
        (5.33:1, up from 3.98:1). QR pulled out of the brand column into its own centred
        band at 245px.
- [ ] **Ask for higher-resolution Partners and Contact images.** At 884px and 627px they are below
      what a retina card wants and will look soft on a large screen. Not upscaled, since that only
      adds bytes. Goes in the mega email.
- [?] **PDF design notes.** `DESIGN - NOTES.pdf` in iCloud Drive root. Bader is translating them;
      we implement step by step from his translation.
- [x] **Navbar brand band, built 2026-08-14 to the client's spoken notes.** English mark left,
      Arabic mark right, registered name in both languages between them, bar taller.
      - Marks cropped from the supplied vector PDFs to the wordmark alone, transparent PNG,
        280px tall source: `printopack-mark-en.png` (42KB), `printopack-mark-ar.png` (26KB).
        Both supplied lockups carry the company name under the wordmark; cropping stops that
        name appearing three times in one bar.
      - Marks render 93px, the old 62px plus 50%. Bar 82px to 132px.
      - The band is pinned `direction:ltr` so English stays left and Arabic stays right when
        the page flips to RTL. Verified in both directions.
      - `Printopack english logo.pdf` and `Printopack logo with arabic text.pdf` are the same
        file, md5 `0c0c235...`. Only two distinct logo files exist.
      - The header controls (quote, language, customer login, admin, QR) moved out of the top
        bar into the nav row to make space. The language toggle has a second copy in the band
        for phones, where the nav row is hidden.
      - Below 430px only the mark matching the current language shows: both plus the toggle
        and burger cannot share a row without shrinking to an illegible size.
- [ ] **Open questions from the 2026-08-18 round, worth putting to the client:**
      - "Stay ahead" and "Let's talk packaging" are brand yellow on the light band at Bader's
        request. That measures **1.86:1**, so those two lines are hard to read. A deeper amber
        keeps the yellow feeling and fixes it.
      - **Customers (+1000) and Brand partners now sit in the same counter row.** The client's
        own framing is that every customer is a partner, so side by side they may contradict.
      - **"Set the standard in your industry" now closes every page**, not just the home page.
        Merging it with the newsletter meant picking one home, and the newsletter was global.
- [ ] **Confirm two readings with the client.** The labels under each mark repeat what the mark
      already spells ("Printopack", "برنتوباك"), which is what he asked for but looks doubled.
      And "50% bigger" was applied to the header logo's rendered height; because the mark is now
      cropped free of the company name, the wordmark itself reads about twice its old size. If he
      meant the wordmark specifically, drop the marks to ~66px and the bar to ~105px.

---

## Blocks launch

- [!] **Remove the dev login bypass.** Three markers tagged `REMOVE BEFORE LAUNCH`:
      `functions/api/login.js:23`, `public/admin/admin.js:433`, `public/admin/admin.js:488`.
      Hard-gated to localhost so it cannot issue a session in production, but it ships in the
      bundle. Rebuild and redeploy after removing.
- [!] **Placeholder content is publicly visible.** In the content store today:
      - 20 partners named "Partner 01" through "Partner 20", and these show on the home page
      - 13 office managers reading "Name Name"
      - 4 offices carrying test images that are cropped factory photos, not portraits
      - Gallery items that are samples, already listed for removal in `PRODUCTION_TODO.md`

      Real names and photos are client-gated, so this closes when the content arrives.

---

## Needs a decision from Bader

- [ ] **`CLAUDE.md` is in the public repo's git history.** Commit `29d6836`; removed from the tree
      later in `99188c8` and gitignored, but the public remote still carries the content: the
      pricing strategy and the reasoning for holding 350 JD as a deliberate loss-leader, the note
      that three portfolio sites are fictional demos, the GM's mobile number, and where credentials
      live. Removing it needs a history rewrite plus a force-push. **Not to be done without an
      explicit go-ahead.**
- [ ] **Commit the current working tree.** 28 entries as of 2026-08-18: 15 modified files
      (both components, `content.ts`, seven inner pages, `index.astro`, `admin.js`,
      `seed.json`) plus 13 new files (seven section images, four logo assets,
      `SES_PRODUCTION_ACCESS.md`, this file). Nothing from this round is committed yet.
- [ ] **`statOffices`: 10 or 12?** Long-standing unanswered question.
- [ ] **Confirm the Nuts product was deliberately removed.** Absent from Amal's approved taxonomy
      and removed here, but it still exists on their current site.

---

## Phase 1: hosting and database stay free indefinitely

The promise to the client is no fees, ever, and no payment card. This phase is about proving that
holds once the real domain is attached.

- [ ] Confirm Cloudflare Pages free tier covers the finished site: build minutes, bandwidth, and
      the 500 builds per month cap against how often the admin's Publish button rebuilds.
- [ ] Confirm D1 free tier covers the content at the caps already set in `db/CAPS.md`
      (News 500, Products 300, Gallery 500, Partners 1000): storage, rows read per day, rows
      written per day.
- [ ] Confirm attaching a custom domain to Pages stays free and needs no card.
- [ ] Confirm the DNS cutover plan touches only the two site records and leaves the Microsoft 365
      mail records and the `api` record alone.
- [ ] Add the custom domain to the Turnstile widget's allowed domains at cutover, or admin logins
      will 403 on the new hostname.
- [ ] Minor: `NODE_VERSION=20` is set on the preview environment only, not production. Production
      builds succeed on Cloudflare's default Node, so this is tidy-up, not urgent.

---

## Phase 2: the fonts

**Corrected 2026-08-14.** The earlier finding was wrong. It described **Narkisim**, the
single-weight Hebrew font bundled with Windows. The client means **Narkissim**, the Fontef
commercial revival: a different product with a near-identical name. It **is** available, **is**
cleared for commercial use, and ships Regular **and** Bold with a Latin companion.

- [x] Establish that GE Flow (Arabic) is Boutros International, free version personal-use only.
      Comparable faces around GBP 80 per weight and GBP 190 per family; web licence quoted
      separately on request.
- [ ] **Decide the licensing route for Narkissim.** Two, and they are very different:
      - **Adobe Fonts:** served from Adobe's CDN, requires a live Creative Cloud subscription
        forever. If it lapses the site silently falls back to generic sans. Adobe does not permit
        self-hosting. A recurring, revocable dependency, and it conflicts with the no-fees promise.
      - **Fontef direct:** a self-hosting web licence bought once from the foundry. Files live on
        the client's own hosting, perpetual, nothing to renew. **Price unknown, needs a quote.**
        This is the only route compatible with the architecture.
- [?] **Settle the foundry question before requesting that quote.** Fontef is based in Tel Aviv.
      Buying a licence in a Saudi manufacturer's name is the client's call, and they should know
      before we approach.
- [ ] **Design question, separate from licensing.** Narkissim's Latin is a serif text face the
      foundry optically sized for 8-12pt continuous reading, and Adobe's "fonts like" list is
      entirely old-style serifs. Our headings run 26 to 60px in a geometric sans. It may be right
      for body copy and wrong for display, in which case it needs a heading face beside it.
- [ ] **Rewrite the Arabic fonts reply.** The draft at
      `scratchpad/reply-fonts-ar.txt` is VOID: its first section argues the font cannot be bought.
      Do not send it.
- [x] Free fallback identified if licensing is declined: Almarai (Arabic) plus Jost (Latin), both
      SIL Open Font License, free commercially and permanently, safe to self-host.

---

## Phase 3: the automation system and its quotation

A **separate paid product**, not part of the 350 JD site scope. A standalone tool for the GM's
assistant that sends to partners and customers in a few steps instead of the current manual Gmail
routine. The client's two old notes, "make the new automation system" and "unify the databases",
both refer to this.

Known from the GM: several thousand contacts, weekly sending, and he wants a separate simple tool
rather than a panel inside the CMS.

- [ ] **Decide how to quote it.** Either gate the quote on SES approval, which needs the client to
      create an AWS account before terms are agreed, or quote the fallback ESP figure of roughly
      $20 to $50 a month now and pursue SES during the build as a cost reduction. Full reasoning in
      `SES_PRODUCTION_ACCESS.md`.
- [ ] **Add a DMARC record to `printopack.com.sa`.** There is none today, which blocks compliant
      bulk sending whichever sender we pick. Free, one TXT record, start at
      `v=DMARC1; p=none; rua=mailto:...` and tighten later. Needed regardless of this phase.
- [ ] Verify their SPF against the Microsoft 365 tenant while in the zone. Apex is currently
      `v=spf1 include:secureserver.net -all` with M365 MX, which looks like a GoDaddy-resold tenant.
- [ ] If SES: register the AWS account **in Printopack's name** with their billing. The UniDash
      request was declined for being a new company, and a Jordanian individual asking to mail a
      Saudi manufacturer's list reads as a list broker.
- [ ] If SES: build the unsubscribe and suppression endpoint on the existing Pages and D1 stack
      **before** submitting the production-access request, since the request describes it as
      existing.
- [ ] Tell the GM in the mega email that a quotation for this is coming.

---

## The asset backlog

Tracked in full in `ASSETS_NEEDED.md`. Summary of what the client still owes:

- [?] 2 product group photos (Medical Applications, Food Powder)
- [?] Up to 73 product sub-item photos, of which 3 are measurement charts needing 2000px or the
      original vector
- [?] 12 office manager portraits
- [?] The home page cover image
- [?] Team names and portraits
- [?] Real partner names for all 20
- [?] Certificate scans, ISO and BRCGS
- [?] Arabic sign-off on the 73 sub-item names, and on the vision and mission text
- [?] Company history and the owners' section, and per-department descriptions

---

## Environment note

The Astro dev server served **stale CSS five separate times** during the 2026-08-18 round: the
markup updates over HMR while the style module does not, so measurements read against old rules
and look impossible. `preview_stop` then `preview_start` clears it. If a change appears not to
have applied, restart before believing it.

Separately, **the browser preview pane does not composite**: screenshots come back blank and
IntersectionObserver callbacks are never delivered. Anything gated on scrolling into view (the
counter count-up, `[data-reveal]`) cannot be verified there and has to be checked in a real
browser.

---

## Not Printopack, but open

- [ ] **UniDash auth email may be blocked by the SES sandbox.** AWS declined production access for
      that account, reason given a new company, and it is still sandboxed, so signup and
      password-reset mail can only reach pre-verified addresses. UniDash is at store-launch
      readiness. A half-configured Brevo identity on `unidash.food` suggests a migration was started
      and never finished. Spawned as its own task.
