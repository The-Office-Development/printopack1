# Mr Printo: building the animated layers

Each version is two transparent WebP layers, the body and the waving hand, which
`src/components/Mascot.astro` rotates about the wrist. Built with Pillow + numpy (Python 3) and
Apple's Vision subject lift (macOS 14+). Run everything from a working folder holding these scripts.

1. **Cut out each picture** from its background:
   ```
   swift cutout.swift "WhatsApp Image 2026-09-13 at 1.38.09 PM.jpeg" wave-cut.png     # plain, waving
   swift cutout.swift "WhatsApp Image 2026-09-13 at 1.37.49 PM.jpeg" shemagh-cut.png  # shemagh + crisps bag
   swift cutout.swift "ChatGPT Image 13 سبتمبر 2026، 01_58_28 م.png" phone-cut.png    # on the telephone
   ```
2. **Build:** `mkdir -p out && python3 plain.py && python3 shemagh.py && python3 phone.py`. Each writes
   `out/printo-<name>-body.webp`, `out/printo-<name>-hand.webp`, `out/<name>.json` (`w`, `h`, `pivot`)
   and `qa-<name>.png`, which shows both ends of the wave on white and on brand blue. Check the wrist.
3. Copy the WebPs to `public/images/mascot/` and put `w`, `h` and `pivot` into the version's entry in
   `Mascot.astro`.

## What the scripts do

- `mascot_lib.py`: the shared steps.
  - **Matte:** removes the pale halo and the background between the fingers, and pulls edge colours in
    from the interior. The pale-edge pass is off for the thobe, whose own edge is white.
  - **Split:** the hand is everything connected to a seed in the palm that is not sleeve. The sleeve is
    the one non-skin region connected to a seed on it. Anything near the hand that is not sleeve, and
    any island cut off from the body, goes to the hand, so nothing is left floating on the body when
    the hand moves (a shaded fingertip once was). A skin-toned stub under the cuff covers the joint.
- `plain.py`: the waving picture cuts the top of the helmet off at the frame edge, so the dome is
  rebuilt on the circle its top rows sit on.
- `transplant.py`: the two other pictures have no free hand, so they borrow the plain picture's raised
  arm. Only the true sleeve is recoloured (by luminance, keeping its folds); the skin is untouched.
  Scale comes from pupil spacing: plain 160px, shemagh 128px (x0.80), telephone 220px (x1.375).
- `shemagh.py`: removes the hand-on-hip arm, repaints the thobe where it was (the torso edge is
  traced by hand as `contour`, and meets the untouched outline below the fist), and tucks the borrowed
  arm, recoloured to thobe white, under the shemagh's drape.
- `phone.py`: mirrors the borrowed arm onto his free side, recoloured to this picture's brighter yellow
  shirt, its root behind his shoulder.

Every coordinate in these scripts (boxes, seeds, pivots, the contour, the drape line) belongs to its
source picture and has to be re-measured if a picture is replaced.
