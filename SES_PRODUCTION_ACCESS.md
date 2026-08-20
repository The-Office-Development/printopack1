# SES production access: the plan and the request text

Amazon declined production access on the UniDash account, reason given: a new company. That
account is still sandboxed, so SES has never actually sent a real blast for us. Before any
running cost is quoted to Printopack, this has to be settled, because the whole cheap route
depends on it.

This file holds the sequence and the exact text to submit.

---

## Why Printopack should pass where UniDash did not

The rejection was about the sender, not the technology. Printopack is the opposite profile:

| Signal | UniDash | Printopack |
|---|---|---|
| Company age | new, unregistered | founded 1997 |
| Legal entity | none yet | Saudi Modern Packaging Factory Co. Ltd |
| Website at time of request | did not resolve | printopack.com.sa, live for years |
| Domain mail history | none | years of Microsoft 365 mail |
| Recipients | app signups, none yet | existing B2B customers and trade partners |
| Physical presence | none | Jeddah factory, roughly 400 employees |

Not a guarantee, but it removes every specific weakness the reviewer named.

## The account must be in Printopack's name

Register it with Printopack's company details, a `printopack.com.sa` address and their billing.
Two reasons, both important:

1. A Saudi manufacturer asking to mail its own customers reads as legitimate. A Jordanian
   individual asking to mail a Saudi manufacturer's customers reads as a list broker.
2. It keeps the running cost on the client's own card, which is where every subscription for
   this project belongs.

---

## Order of operations

Do not submit the request first. A reviewer opening a half-built setup is how you get declined
twice, and a second rejection is much harder to reverse than a first.

1. **Create the AWS account** in Printopack's name. Free, and free until mail is sent.
2. **Verify the domain identity** and enable DKIM in one chosen region.
3. **Set a custom MAIL FROM** on `bounce.printopack.com.sa`. See the DNS safety note below.
4. **Add DMARC.** They have none today, which blocks compliant bulk sending regardless of
   which sender we end up using.
5. **Build the unsubscribe and suppression endpoint.** DONE, 2026-08-20. It is not an
   endpoint, it turned out to be the whole tool: `/Users/bader/printopack-mailer`, a Worker
   sharing the website's D1 database. What now exists, and what the request text below can
   therefore honestly claim:
   - a `contacts` table the website's forms write into directly, each row carrying the basis
     for writing to that person and the date it was recorded
   - a permanent `suppression` table that survives re-imports
   - one-click unsubscribe with RFC 8058 `List-Unsubscribe-Post`, signed so it cannot be
     forged, acting immediately with no confirmation page
   - an SNS webhook that suppresses hard bounces and complaints automatically, and counts
     soft bounces until an address retires itself
   - bounce and complaint rates measured per campaign, with the send pausing itself below
     Amazon's thresholds
   - transactional notifications already flowing: every website enquiry is emailed to the
     office that should answer it
   See that repo's README for the setup order, which must be followed before this request.
6. **Submit the request** using the text below.
7. **Gate the quote on the answer.** Approved, quote SES at roughly $2 to $4 a month. Declined,
   quote a paid ESP at roughly $20 to $50 a month. Do not quote before this resolves.

Steps 5 and 6 are in that order deliberately. The request describes bounce, complaint and
unsubscribe handling as things that exist. They should exist.

**Still to do before submitting, as of 2026-08-20.** The code is built; these are the
account-side facts the request text asserts and that a reviewer can check:

- [ ] Create the AWS account in Printopack's name, and RECORD THE REGION. Identity, DKIM,
      MAIL FROM, the configuration set and the event destination are all region-scoped, and
      changing region later means redoing every DNS record.
- [ ] Verify the domain, enable DKIM, set the custom MAIL FROM, add DMARC.
- [ ] Deploy the mailer, set its secrets, subscribe the SNS topic to its webhook.
- [ ] Run the sandbox checklist in the mailer's README, including Amazon's simulator
      addresses, so every claim below is one that has actually been exercised.
- [ ] Publish the website's privacy page. DONE 2026-08-20 (`src/pages/privacy.astro`), but it
      has to be LIVE on the domain named in the request before the request is sent, because
      the request says the website explains how addresses are used.

Two claims in the text below are now true and were not before: the website records an
enquiry with a timestamp (the forms used to post to a Netlify handler that does not exist on
this host, so nothing was recorded at all), and unsubscribes are honoured immediately.

## DNS safety note

Printopack's zone carries live Microsoft 365 mail. Nothing here touches it.

Their apex SPF is `v=spf1 include:secureserver.net -all` and stays exactly as it is. The custom
MAIL FROM lives on the `bounce.` subdomain with its own SPF, so SPF is evaluated there and still
aligns with the header domain under relaxed alignment. DKIM signs as `printopack.com.sa` and
aligns directly. DMARC therefore passes without editing a single existing record. This is the
same arrangement already running on `unidash.food`.

Do not add an SES include to the apex SPF. It is unnecessary and it risks their live mail.

---

## Request text

Mail type: **Marketing**
Website URL: **https://printopack.com.sa**
Preferred contact language: English

### Use case description

Printopack (Saudi Modern Packaging Factory Co. Ltd) is a flexible packaging manufacturer founded
in 1997, based in Jeddah, Saudi Arabia, with approximately 400 employees and customers in more
than 26 countries. We manufacture printed packaging for food, beverage, pharmaceutical, medical
and personal care brands.

We are requesting production access to send a periodic business update to our own commercial
customers and trade partners.

**What we send.** A weekly update covering new production capabilities, quality and food-safety
certifications, and the trade exhibitions we attend. It goes only to businesses we already
supply or actively trade with. We do not send unsolicited offers and we do not send on behalf of
any third party.

**Who receives it, and how they got on the list.** Every recipient is either an existing
commercial customer with an active trading relationship with us, or a business that submitted an
enquiry through the contact form on printopack.com.sa and asked to be kept informed. We have
never purchased, rented, scraped or otherwise acquired a list from a third party, and we never
will. New addresses enter only through those two routes, and the enquiry form records the
timestamp of consent.

**Expected volume.** Approximately 4,000 recipients, sent once per week, so roughly 16,000 to
20,000 messages per month. We expect this to grow slowly, in step with our customer base.

**How we handle bounces.** We have configured an SES event destination publishing bounce events
to SNS, delivered to an HTTPS endpoint we operate. Hard bounces are written immediately to a
suppression table and are permanently excluded from every subsequent send. Soft bounces are
retried a limited number of times and then suppressed. The suppression list is checked before
each send, so a suppressed address cannot be reintroduced by a later import.

**How we handle complaints.** Complaint events arrive through the same pipeline and result in
immediate and permanent suppression, with no retry and no manual override. We monitor the
complaint rate and will pause sending if it approaches AWS thresholds.

**How recipients unsubscribe.** Every message carries `List-Unsubscribe` and
`List-Unsubscribe-Post` headers supporting one-click unsubscribe, alongside a clearly visible
unsubscribe link in the message body. Both routes write to the same suppression table and take
effect immediately, with no login, no confirmation step and no further mail.

**List hygiene.** Addresses that have not engaged over an extended period are removed rather
than retained, and the list is reconciled against our customer records so that closed accounts
are dropped.

We have verified our sending domain, enabled DKIM signing, configured a custom MAIL FROM domain
and published a DMARC policy before making this request.

---

## If it is declined

A first rejection is not final and is often reversible by replying with specifics rather than
resubmitting. Ask the reviewer which requirement was not met, and answer with the concrete
mechanism: the suppression table, the event pipeline, the consent record on the enquiry form.

If it stays declined, the fallback is a paid ESP at roughly $20 to $50 a month for this list
size. That is the number to put in the quote in that case, presented to the client as a
recurring subscription they own.
