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

## Two accounts, both in Printopack's name

Not one. The client bears every cost of this tool, and the website was promised it can never
be billed, so the two must not share a billing surface.

| Account | Holds | Why his |
|---|---|---|
| **AWS** | SES identity, DKIM, MAIL FROM, configuration set, SNS topic | Sending is the cost he agreed to carry |
| **Cloudflare** | `printopack_mail` D1 and the Worker | D1 quotas are **per account**; the website's must stay untouched |

Both are free to open and cost nothing until mail is sent. This is Option B, which he chose
on 2026-08-19.

Registering in his name also helps the application itself: a Saudi manufacturer asking to
mail its own customers reads as legitimate, where a Jordanian company asking to mail a Saudi
manufacturer's list reads as a list broker. That distinction is what sank the UniDash request.

## Choosing the region, which cannot be changed later

Identity, DKIM, MAIL FROM, the configuration set and the event destination are all
region-scoped. Changing region afterwards means redoing every DNS record, so decide once.

**SETTLED 2026-09-07: eu-west-1 (Ireland).** Bahrain's endpoints are unreachable from the network
this is administered from; the identity, DKIM and MAIL FROM are live in Ireland. The notes below
are the original 2026-08-20 comparison, kept for the record.

- **me-south-1 (Bahrain)** was the original recommendation. Closest to Jeddah, in the GCC, and it uses
  the default `dkim.amazonses.com` domain so the DKIM records look like every guide.
- **me-central-1 (UAE)** also works, but issues DKIM under `dkim.me-central-1.amazonses.com`,
  a small extra thing to get right.
- **eu-west-1 (Ireland)** is the most trodden path if a Gulf region ever misbehaves.

One caveat that does **not** apply to us: Amazon publishes no SMTP endpoint in either Gulf
region. This tool signs the SES API directly rather than using SMTP, so that gap is
irrelevant here. It would matter to anything speaking SMTP.

The region is a setting in the tool (`settings.region`, default `eu-west-1`), not a constant,
so whichever is chosen is entered once in Settings and the host follows.

---

## Order of operations

Do not submit the request first. A reviewer opening a half-built setup is how you get declined
twice, and a second rejection is much harder to reverse than a first.

1. **Create the AWS account** in Printopack's name. Free, and free until mail is sent.
2. **Verify the domain identity** and enable DKIM in one chosen region.
3. **Set a custom MAIL FROM** on `bounce.printopack.com.sa`. See the DNS safety note below.
4. **Add DMARC.** They have none today, which blocks compliant bulk sending regardless of
   which sender we end up using.
5. **The unsubscribe and suppression machinery.** DONE 2026-08-20, and it turned out to be
   the whole tool rather than an endpoint: `/Users/bader/printopack-mailer`.

   It keeps its **own** D1 in the client's own Cloudflare account. It briefly shared the
   website's, which was wrong for the reason in the table above. New contacts and the
   website's pending enquiry notifications now cross a watermarked `/api/sync` endpoint, so
   the website's usage stays flat however large the mailing list grows.

   What exists, and what the request text below can therefore honestly claim:
   - a `contacts` table carrying, for each person, the basis for writing to them and the date
     it was recorded
   - a permanent `suppression` table that survives re-imports
   - one-click unsubscribe with RFC 8058 `List-Unsubscribe-Post`, signed so it cannot be
     forged, acting immediately with no confirmation page
   - an SNS webhook that suppresses hard bounces and complaints automatically, and counts
     soft bounces until an address retires itself
   - bounce and complaint rates measured per campaign, pausing the send below Amazon's
     thresholds
   - transactional notifications already flowing: every website enquiry is emailed to the
     office that should answer it

6. **Submit the request** using the text below.
7. **Gate the quote on the answer.** Approved, quote SES at roughly $2 to $4 a month. Declined,
   quote a paid ESP at roughly $20 to $50 a month. Do not quote before this resolves.

Steps 5 and 6 are in that order deliberately. The request describes bounce, complaint and
unsubscribe handling as things that exist. They should exist.

**Still to do before submitting, as of 2026-08-20.** The code is built; these are the
account-side facts the request text asserts and that a reviewer can check:

- [ ] **AWS account** in Printopack's name. Record the region chosen (see above).
- [ ] Verify `printopack.com.sa`, enable DKIM, set custom MAIL FROM on `bounce.`, add DMARC.
- [ ] Create the SNS topic and the SES configuration set with an event destination pointing at it.
- [ ] **Cloudflare account** in Printopack's name.
      `wrangler d1 create printopack_mail`, then paste the id into the tool's `wrangler.toml`
      (it currently reads `REPLACE_WITH_ID_FROM_THE_CLIENT_ACCOUNT`).
- [ ] Apply the mailer schema to that database, deploy the Worker, subscribe the SNS topic to
      its webhook.
- [ ] Set the secrets. **`SYNC_TOKEN` must be identical on both sides**: a Pages secret on the
      website, and a Worker secret on the tool, alongside `SITE_URL`, `MAIL_SESSION_SECRET`,
      `MAIL_PASS_HASH`, `UNSUB_SECRET`, `SNS_HOOK_SECRET` and the SES keys.
- [ ] Run the sandbox checklist in the mailer README, including Amazon's simulator addresses,
      so every claim below has actually been exercised.
- [ ] Confirm the real contact count and cadence with the client before submitting, since both
      appear in the request.
- [ ] Publish the privacy page on the domain named in the request. Written 2026-08-20 and live
      on `printopack1.pages.dev`; it must be live on the domain the request names.

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

**SUBMITTED 2026-09-13** via `aws sesv2 put-account-details` on account 006325950907, eu-west-1.
Review status on submission: PENDING. Mail type MARKETING, website https://printopack.com.sa,
contact language EN. The text below is exactly what was sent (read back from `get-account`).
Volume (about 4,000 per announcement, a few times a month at most) was our estimate.

```text
Printopack (Saudi Modern Packaging Factory Co. Ltd) is a flexible packaging manufacturer founded in 1997, based in Jeddah, Saudi Arabia, with approximately 400 employees and customers in more than 26 countries. We manufacture printed packaging for food, beverage, pharmaceutical, medical and personal care brands.

We are requesting production access to send product and service announcements to our own customers.

What we send: announcements whenever we launch something our customers can use, such as a new packaging service, a new production capability, or a new laboratory test we can now perform on their packaging. These are sent as each one launches, not on a fixed schedule. They go only to businesses that have bought from us, current or past, or that contacted us themselves. We do not send on behalf of any third party.

Who receives it, and how they got on the list: recipients come only from our own records. They are our existing and past commercial customers, taken from our company's customer records, businesses that contacted us through the forms on our website, and visitors who subscribed through the newsletter sign-up on our website. We have never purchased, rented, scraped or otherwise acquired a list from a third party, and we never will. Every address is stored with how and when it reached us, and that record is kept for as long as the address is on the list.

Expected volume: approximately 4,000 recipients per announcement. Announcements are sent as new services and tests launch, which we expect to be a few times per month at most, so typically under 16,000 messages per month. We expect the list to grow slowly, in step with our customer base.

How we handle bounces: we have configured an SES event destination publishing bounce events to SNS, delivered to an HTTPS endpoint we operate. Hard bounces are written immediately to a suppression table and are permanently excluded from every subsequent send; they cannot be removed from it. An address that soft-bounces repeatedly is suppressed after a small number of attempts. The suppression list is checked before each send, so a suppressed address cannot be reintroduced by a later import.

How we handle complaints: complaint events arrive through the same pipeline and result in immediate and permanent suppression, with no retry and no manual override. We monitor the complaint rate and will pause sending if it approaches AWS thresholds.

How recipients unsubscribe: every message carries List-Unsubscribe and List-Unsubscribe-Post headers supporting one-click unsubscribe, alongside a clearly visible unsubscribe link in the message body. Both routes write to the same suppression table and take effect immediately, with no login, no confirmation step and no further mail.

We have verified our sending domain, enabled DKIM signing, configured a custom MAIL FROM domain and published a DMARC policy before making this request.
```

---

## Round 2: Amazon asked for more information (2026-09-13), reply NOT YET RECEIVED by Amazon

Amazon's first answer was their standard "we would like to gather more information" message
(case 178931713400385, status DENIED in `get-account`). It asked for sending frequency, list
maintenance, bounce/complaint/unsubscribe handling, and an example email. The reply below was
first sent on 2026-09-14 08:26 UTC as an EMAIL reply to Amazon's message, which BOUNCED (their
no-reply address accepts no mail). It must be posted with Reply inside the case in the AWS
Support Center; the Support API needs a paid support plan, so the CLI cannot post it either.
Status stays DENIED until a reviewer acts on a reply posted in the case.

The example email's lab test (migration testing) is illustrative, not a confirmed Printopack
service. Every figure in it matched the live tool's settings on 2026-09-13.

```text
Hello,

Thank you for reviewing our request. Below are the details you asked for, covering each point in turn, followed by an example of the email we plan to send.

1. Who we are and what we send

Printopack (Saudi Modern Packaging Factory Co. Ltd) has manufactured flexible packaging in Jeddah, Saudi Arabia, since 1997, for food, beverage, pharmaceutical, medical and personal care brands in more than 26 countries.

We send one kind of email: an announcement to our customers when we launch something they can use, such as a new packaging service, a new production capability, or a new laboratory test we can now run on their packaging. Each message is written in English and Arabic, and each recipient receives the version in their own language. We do not send on behalf of any third party.

Our sending domain, printopack.com.sa, is already verified in eu-west-1, with DKIM signing (RSA 2048), a custom MAIL FROM domain (bounce.printopack.com.sa) and a published DMARC record.

2. How often we send

Announcements go out when a new service or test launches, not on a fixed schedule. We expect a few announcements per month at most, each to approximately 4,000 recipients, so typically under 16,000 messages per month.

Sending is throttled on our side. Our system sends at most 25 messages per minute, and a single campaign is capped at 5,000 recipients, so a mistake can never turn into a large burst.

3. How we maintain our recipient list

Addresses reach our list in three ways only:
- our existing and past customers, from our own company customer records;
- businesses that contacted us through the enquiry forms on our website;
- visitors who subscribed through the newsletter sign-up on our website.

We have never bought, rented or scraped a list, and never will.

Every address is stored with its source, the basis on which we may write to it, and the date it arrived. When we import our customer records, every row is checked for a valid address format, duplicates are removed, and every address is checked against our suppression list first. An address that has ever unsubscribed, bounced or complained is reported as suppressed and is not added back.

When a campaign starts, its recipient list is fixed at that moment, so contacts added or changed during a send cannot cause duplicates or gaps.

4. How we manage bounces

SES publishes bounce, complaint and delivery events through our configuration set to an SNS topic, which delivers them to an HTTPS endpoint we operate. The endpoint's address contains a secret, and it only accepts notifications from our own topic.

- A hard bounce suppresses the address immediately and permanently. It cannot be removed from the suppression list by anyone using our system.
- A soft bounce is counted. After 3 soft bounces the address is suppressed.
- Once a campaign has sent 50 messages, if its hard bounce rate reaches 4%, the campaign pauses itself automatically and waits for a person to review it. Nothing further is sent until then.

5. How we manage complaints

A complaint suppresses the address immediately and permanently, with no retry. Like hard bounces, complaints cannot be removed from the suppression list by anyone using our system. Once a campaign has sent 200 messages, if its complaint rate reaches 0.08%, the campaign pauses itself automatically.

6. How we manage unsubscribe requests

Every message carries List-Unsubscribe and List-Unsubscribe-Post headers (RFC 8058), so the unsubscribe button in Gmail, Outlook and other mail apps works in one click. Every message also has a visible unsubscribe link in its footer. The link is cryptographically signed, so it cannot be forged to unsubscribe someone else.

Either route takes effect immediately, with no login and no confirmation step. The address is added to the suppression list, and any messages still queued for it in any campaign are cancelled. The suppression list is checked again for every individual message just before it is sent, so an unsubscribe that arrives in the middle of a campaign is honoured on the very next message.

7. Testing already done in the sandbox

Before requesting production access we tested the full process in the sandbox:
- delivery to verified addresses in both English and Arabic;
- the unsubscribe link, followed by a second campaign that correctly skipped the unsubscribed address;
- bounce@simulator.amazonses.com and complaint@simulator.amazonses.com, both of which were suppressed automatically within seconds and counted against the campaign.

8. Example email

From: Printopack <announcements address on printopack.com.sa>
Subject: New at Printopack: in-house migration testing for food packaging

Hello [first name],

We can now run migration testing on your food packaging in our own laboratory in Jeddah.

Migration testing checks whether substances from the packaging material pass into the food it holds, which many markets require before a product goes on sale. Until now, most of our customers had to send samples to an outside laboratory and wait for the results. We can now test samples of your printed films and pouches here, alongside production, and return the report with your order.

If you would like to know whether this applies to your products, reply to this email or contact your account manager, and we will explain what the test involves and how long it takes.

Kind regards,
Printopack

Saudi Modern Packaging Factory Co. Ltd. (Printopack), Industrial Area 5, Unit 10, 8508, Jeddah 22428, Saudi Arabia
You are receiving this because you are a Printopack customer or subscribed to our news.
Unsubscribe: [one-click unsubscribe link]

Every message follows this format: one announcement, a clear reason it is relevant to the recipient, a way to reply to a real person, our postal address, and an unsubscribe link.

Please let us know if you need anything further.

Kind regards,
Printopack
```

## If it is declined

A first rejection is not final and is often reversible by replying with specifics rather than
resubmitting. Ask the reviewer which requirement was not met, and answer with the concrete
mechanism: the suppression table, the event pipeline, the consent record on the enquiry form.

If it stays declined, the fallback is a paid ESP at roughly $20 to $50 a month for this list
size. That is the number to put in the quote in that case, presented to the client as a
recurring subscription they own.
