"""Plain Mr Printo (home page), from 'WhatsApp Image 2026-09-13 at 1.38.09 PM.jpeg'."""
from mascot_lib import *

raw = load('wave-cut.png')
# That picture cuts the top of the helmet off at the frame edge; its top rows sit on this circle.
OFF = 26
im = rebuild_dome(raw, cx=458.5, cy=86.0, r=107.5, k=22, off=OFF)
xx, yy = grid(im.shape)
hand_box = (xx < 215) & (yy > 260 + OFF) & (yy < 505 + OFF)
im = clean_matte(im, bg_box=hand_box)
body, hand = split_hand(im, hand_box, palm=(90, 370 + OFF), sleeve_seed=(200, 500 + OFF), body_seed=(450, 700 + OFF))
save_layers(body, hand, pivot=(160, 458 + OFF), name='plain')
