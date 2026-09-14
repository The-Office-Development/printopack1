"""Mr Printo in shemagh and agal (About Us), from 'WhatsApp Image 2026-09-13 at 1.37.49 PM.jpeg'.

That picture has no free hand: one rests on his hip, the other holds a crisps bag. So the hip arm
is removed and the thobe repainted where it was, and the plain picture's raised waving arm is put in
its place with the sleeve recoloured to the thobe, its shoulder tucked under the shemagh's drape."""
import numpy as np
from mascot_lib import *
from transplant import *

P = 200                                                       # room on the left for the raised arm
sh = clean_matte(load('shemagh-cut.png'), remove_pale_edges=False)
sh = pad(sh, left=P)
H, W = sh.shape[:2]
xx, yy = grid(sh.shape)

def interp(points, y):
    ys = [p[1] for p in points]; xs = [p[0] for p in points]
    return np.interp(y, ys, xs)

# Torso edge where the hip arm hid it, and the lower edge of the shemagh's left drape (picture coords).
contour = [(138, 440), (130, 520), (126, 590), (126, 650), (120, 720), (113, 780), (108, 820), (105, 840)]
drape = [(0, 560), (15, 545), (50, 515), (100, 470), (150, 430), (190, 410), (260, 380)]
cx_ = interp([(x + P, y) for x, y in contour], yy)            # torso edge x for each row
drape_y = np.interp(xx - P, [d[0] for d in drape], [d[1] for d in drape])
below_drape = yy > drape_y + 1
in_rows = (yy >= 430) & (yy <= 840)   # below the fist the original outline is already the torso's

# 1. remove the arm: everything left of the torso edge, below the drape
edge_cov = np.clip(xx - cx_ + 0.5, 0, 1)
remove = in_rows & below_drape
sh[..., 3] = np.where(remove, sh[..., 3] * edge_cov, sh[..., 3])

# 2. repaint a band of thobe inside the edge, copied from cloth further in, with a soft darkening
#    towards the edge like the thobe's own outline. It fades back into the original below the fist.
BAND, SHIFT = 62, 62
rgb = sh[..., :3].copy()
band = remove & (xx >= np.floor(cx_)) & (xx < cx_ + BAND)
ys, xs = np.nonzero(band)
cloth = sh[ys, np.clip(xs + SHIFT, 0, W - 1), :3]
d = xs - cx_[ys, xs]
shade = 0.82 + 0.18 * (1 - np.exp(-np.clip(d, 0, None) / 8))
blend = np.clip((cx_[ys, xs] + BAND - xs) / 16, 0, 1) * np.clip((840 - ys) / 35, 0, 1)
blend = blend[:, None]
rgb[ys, xs] = cloth * shade[:, None] * blend + rgb[ys, xs] * (1 - blend)
sh[..., :3] = rgb
sh[ys, xs, 3] = np.where(sh[ys, xs, 3] > 0, np.maximum(sh[ys, xs, 3], 255 * edge_cov[ys, xs]), 0)

# 3. the waving arm, recoloured to the thobe and scaled by pupil spacing (128px here, 160px plain)
arm = recolour_sleeve(plain_arm(), dark=(150, 140, 126), light=(246, 242, 234))
ROT, DX, DY = -8.0, 112.0, 470.0   # arm tilt and where its shoulder lands (tuned by eye)
S_, SRC, DST = 0.80, (322, 540), (DX + P, DY)
arm_c = place(arm, S_, SRC, DST, sh.shape, rotate=ROT)
# Below the drape the raised arm's underside would hang in the gap left by the old arm, reading as a
# loose flap; the drape hides the shoulder, so only the part clear of the drape's point is kept.
arm_c[..., 3] *= ~(below_drape & (xx - P > 10) & in_rows)
comp = over(sh, arm_c)                                        # arm under the body: drape covers the shoulder
to_img(comp).save('shemagh-comp.png')
print('palm', mapped((90, 370), S_, SRC, DST, ROT), 'wrist', mapped((160, 458), S_, SRC, DST, ROT),
      'sleeve', mapped((200, 500), S_, SRC, DST, ROT))

# 4. split into body and waving hand, in composite coordinates
corners = [mapped(p, S_, SRC, DST, ROT) for p in ((0, 250), (215, 250), (0, 505), (215, 505))]
x0 = min(c[0] for c in corners) - 10; y0 = min(c[1] for c in corners) - 10
x1 = min(max(c[0] for c in corners), P + 45); y1 = max(c[1] for c in corners)
print('hand box', (x0, y0, x1, y1))
hand_box = (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)
body, hand = split_hand(comp, hand_box, palm=mapped((90, 370), S_, SRC, DST, ROT),
                        sleeve_seed=nearest(comp, mapped((200, 500), S_, SRC, DST, ROT), lambda px: px[3] > 200 and not skin_like(px[None, None, :3])[0, 0]),
                        body_seed=(P + 250, 800))
save_layers(body, hand, pivot=mapped((160, 458), S_, SRC, DST, ROT), name='shemagh',
            stub_r=(21, 16, 16, 18), stub_rgb=(214, 128, 84))
