"""Mr Printo on the telephone (Contact), from 'ChatGPT Image 13 سبتمبر 2026، 01_58_28 م.png'.

That picture is cut off at the chest and his one visible hand holds the phone. So the plain picture's
raised waving arm is mirrored onto his free side, the sleeve recoloured to this picture's brighter
yellow shirt, its root hidden behind his shoulder. He can only rise from the bottom edge, which hides
where the picture is cut off."""
import numpy as np
from mascot_lib import *
from transplant import *

PR = 460                                                      # room on the right for the raised arm
ph = pad(clean_matte(load('phone-cut.png')), right=PR)
H, W = ph.shape[:2]
xx, yy = grid(ph.shape)

ROT, DX, DY = 18.0, 850.0, 1010.0   # arm tilt and where its shoulder lands (tuned by eye)
S_, SRC, DST, MIR = 1.375, (322, 540), (DX, DY), True
arm = recolour_sleeve(plain_arm(), dark=(150, 84, 0), light=(250, 186, 26), gamma=1.0)
arm_c = place(arm, S_, SRC, DST, ph.shape, rotate=ROT, mirror=MIR)
comp = over(ph, arm_c)
to_img(comp).save('phone-comp.png')
m = lambda p: mapped(p, S_, SRC, DST, ROT, mirror=MIR)
print('palm', m((90, 370)), 'wrist', m((160, 458)))

corners = [m(p) for p in ((0, 250), (215, 250), (0, 505), (215, 505))]
x0 = min(c[0] for c in corners) - 10; y0 = min(c[1] for c in corners) - 10
x1 = max(c[0] for c in corners) + 10; y1 = max(c[1] for c in corners) + 10
x0 = max(x0, 930)                                         # never reach into his face or ear
print('hand box', (x0, y0, x1, y1))
hand_box = (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)
body, hand = split_hand(comp, hand_box, palm=m((90, 370)),
                        sleeve_seed=nearest(comp, m((200, 500)), lambda px: px[3] > 200 and not skin_like(px[None, None, :3])[0, 0]),
                        body_seed=(460, 700))
save_layers(body, hand, pivot=m((160, 458)), name='phone', stub_r=(34, 26, 26, 30))
