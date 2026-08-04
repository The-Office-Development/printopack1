# Per-section limits

Why each section has the ceiling it has. The client asked for these to be "thoroughly
investigated in detail, as different sections mandate different limits", so this is the
reasoning rather than a list of round numbers.

## What actually constrains us

Uploaded pictures live in the D1 database, not in object storage, because the whole promise
is a stack with no payment method on it. **The free D1 database is 500 MB**, and that is the
only hard ceiling in the system.

Every upload is resized and re-encoded to WebP **in the browser before it is sent**:

- **~65 KB** is what a 4.6 MB phone photo actually lands at, measured.
- **400 KB** is the hard reject threshold in the API. Nothing larger is accepted.

So the honest planning figure is 65 KB with 400 KB as the absolute worst case, and the two
give very different totals. Both are shown below.

## The limits

| Section | Limit | Pictures | Why this number |
|---|---:|---|---|
| News & Events | 500 | 1 each | The client's own figure. Roughly two posts a week for five years. |
| Products (sub-items) | 300 | 1 each | 73 today across 22 groups. Room to roughly quadruple. |
| Gallery | 500 | 1 each | Photos, videos and adverts together. Videos are YouTube or Vimeo links, so they cost no storage at all. |
| Success Partners | 1,000 | 1 each | A customer is a partner in the client's book, and Printopack has ~1,000 customers, so this is the real ceiling rather than a token one. Logos are transparent PNGs and compress to roughly 30 KB, far below a photograph. |
| Our Team | 60 | 1 each | Managers and department heads, not all ~400 employees. |
| Offices & Contact | 40 | 1 each | 17 today, 20 Arab countries available plus Saudi branches. |
| Product Groups | 40 | 1 each | 22 today from Amal's approved taxonomy. Room to grow without becoming unbrowsable. |
| Quality System | 40 | 1 each | Certificates, assurance notes and lab entries. |
| Social Responsibility | 40 | 1 each | Three areas, certificates in each. |
| Factory Departments | 30 | 1 each | 6 today. A plant does not sprout departments. |
| Careers | 40 | none | Open roles. Closed ones should be deleted, not archived forever. |
| Bag Formats | 20 | none | 6 today. A short list by nature. |
| The Printopack Standard | 10 | none | 3 today. It is a promise, not a catalogue. |
| Our Values | 12 | none | 4 today. |

## Does it fit?

Picture-bearing records if **every** limit were filled to the brim: **2,550**.

They are not all the same weight, which matters once Partners is 1,000:

| | Records | Typical size | Total |
|---|---:|---:|---:|
| Partner logos | 1,000 | ~30 KB (transparent PNG) | ~30 MB |
| Everything else | 1,550 | ~65 KB (measured photo) | ~101 MB |
| **Realistic total** | **2,550** | | **~131 MB of 500 MB** |

At the absolute worst case, every one of the 2,550 arriving at the full picture limit, it
would be about 1 GB, which does not fit. That case assumes 2,550 worst-case uploads and the
compressor makes it very unlikely, so the limits are not shrunk to chase it. It is handled by
two things instead:

- the **storage meter** on the dashboard, showing how much of the 500 MB the pictures use
- **Settings > Pictures**, where the client can lower the largest allowed picture. Halving it
  halves what every future upload costs, and it is enforced in the browser *and* again on the
  server, so it cannot be bypassed.

That setting is the release valve: if the meter ever climbs, lower the picture limit rather
than delete content.
