"""Borrow the plain picture's raised waving arm (sleeve + hand) for versions that have no free hand."""
import numpy as np
from PIL import Image
from mascot_lib import *

def plain_arm():
    """The raised arm from the plain picture, cleaned, as an RGBA array in wave-cut.png coordinates.
    Everything connected to the palm left of the overall strap (x < 345), without the head and ear."""
    im = load('wave-cut.png')
    xx, yy = grid(im.shape)
    finger_box = (xx < 215) & (yy > 260) & (yy < 505)
    im = clean_matte(im, bg_box=finger_box)
    rgb, a = im[..., :3], im[..., 3]
    strap = (rgb[..., 2] > 90) & (rgb[..., 0] < 140)          # the blue overall strap
    head = (xx >= 192) & (yy < 440)                           # ear and face sit above the sleeve here
    region = (a > 60) & (xx < 345) & (yy > 250) & (yy < 660) & ~head & ~strap
    arm = flood((90, 370), region)
    arm = filt(filt(arm, ImageFilter.MaxFilter(3)), ImageFilter.MinFilter(3))
    # The sleeve is the one orange region connected to the forearm, with its dark outline. Only it is
    # recoloured: a per-pixel colour test also caught the shadowed skin at the wrist, which then
    # stayed on the body as a jagged flap when the hand turned.
    sleeve = flood((200, 500), (rgb[..., 2] < 60) & (a > 40) & arm)
    sleeve = filt(sleeve, ImageFilter.MaxFilter(3))
    return np.dstack([rgb, a * soft(arm, 0.7)]), sleeve

def recolour_sleeve(arm_and_sleeve, dark, light, gamma=0.85):
    """Repaint the orange sleeve in another fabric, keeping its folds and shading (by luminance).
    The hand's skin is left as it is."""
    arm, sleeve = arm_and_sleeve
    rgb = arm[..., :3]
    lum = rgb[..., 0] * .299 + rgb[..., 1] * .587 + rgb[..., 2] * .114
    t = np.clip((lum - 62) / (172 - 62), 0, 1) ** gamma
    fabric = np.array(dark)[None, None] * (1 - t[..., None]) + np.array(light)[None, None] * t[..., None]
    w = soft(sleeve, 0.8)
    out = arm.copy()
    out[..., :3] = rgb * (1 - w[..., None]) + fabric * w[..., None]
    return out

def place(arm, scale, src_anchor, dst_anchor, dst_shape, rotate=0.0, mirror=False):
    """Scale/rotate the arm about src_anchor and drop that point on dst_anchor in a dst_shape canvas."""
    img = to_img(arm)
    if mirror:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
        src_anchor = (arm.shape[1] - 1 - src_anchor[0], src_anchor[1])
    w, h = img.size
    img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    ax, ay = src_anchor[0] * scale, src_anchor[1] * scale
    if rotate:
        big = Image.new('RGBA', (img.width * 3, img.height * 3), (0, 0, 0, 0))
        big.paste(img, (img.width, img.height))
        ax, ay = ax + img.width, ay + img.height
        img = big.rotate(rotate, resample=Image.BICUBIC, center=(ax, ay))
    canvas = Image.new('RGBA', (dst_shape[1], dst_shape[0]), (0, 0, 0, 0))
    canvas.alpha_composite(img, (0, 0)) if False else None
    ox, oy = round(dst_anchor[0] - ax), round(dst_anchor[1] - ay)
    canvas.paste(img, (ox, oy), img)
    return np.array(canvas).astype(np.float32)

def mapped(p, scale, src_anchor, dst_anchor, rotate=0.0, mirror=False, src_w=718):
    """Where a point of the plain picture lands after place()."""
    x, y = p
    sx, sy = src_anchor
    if mirror:
        x, sx = src_w - 1 - x, src_w - 1 - sx
    dx, dy = (x - sx) * scale, (y - sy) * scale
    th = np.radians(rotate)                                   # PIL rotates counter-clockwise on screen
    rx = dx * np.cos(th) + dy * np.sin(th)
    ry = -dx * np.sin(th) + dy * np.cos(th)
    return (round(dst_anchor[0] + rx), round(dst_anchor[1] + ry))

def over(top, bottom):
    ta, ba = top[..., 3:] / 255, bottom[..., 3:] / 255
    oa = ta + ba * (1 - ta)
    rgb = (top[..., :3] * ta + bottom[..., :3] * ba * (1 - ta)) / np.maximum(oa, 1e-6)
    return np.dstack([rgb, oa[..., 0] * 255])
