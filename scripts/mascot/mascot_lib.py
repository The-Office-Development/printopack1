"""Shared steps for building Mr Printo's animated layers. See README.md.

All coordinates are (x, y) in the working picture's pixels unless a name ends in _yx.
"""
from collections import deque
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def load(path):
    return np.array(Image.open(path).convert('RGBA')).astype(np.float32)


def to_img(arr):
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def filt(mask, f):
    return np.array(Image.fromarray((mask * 255).astype(np.uint8)).filter(f)) > 127


def soft(mask, radius):
    return np.array(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))).astype(np.float32) / 255


def flood(seed, allowed):
    """Connected region of `allowed` containing seed (x, y), 4-neighbour."""
    x, y = seed
    h, w = allowed.shape
    if not allowed[y, x]:
        raise SystemExit(f'seed {seed} is not inside the region')
    out = np.zeros_like(allowed)
    out[y, x] = True
    q = deque([(y, x)])
    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
            if 0 <= ny < h and 0 <= nx < w and allowed[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True
                q.append((ny, nx))
    return out


def grid(shape):
    h, w = shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    return xx, yy


def pad(im, left=0, top=0, right=0, bottom=0):
    h, w = im.shape[:2]
    out = np.zeros((h + top + bottom, w + left + right, 4), np.float32)
    out[top:top + h, left:left + w] = im
    return out


def rebuild_dome(raw, cx, cy, r, k, off):
    """The source cuts the top of a round shape off at the frame edge. Rebuild the missing cap on the
    circle (cx, cy, r) fitted to its top rows, stretching the shape's own top k rows up into it.
    Returns the picture padded by `off` rows at the top."""
    hs, ws = raw.shape[:2]
    im = pad(raw, top=off)
    for x in range(int(cx - r), int(cx + r) + 1):
        dx = x - cx
        if abs(dx) >= r:
            continue
        t = cy - np.sqrt(r * r - dx * dx)
        if t >= 0:
            continue
        for y in range(int(np.floor(t)) - 1, k):
            sy = max((y - t) / (k - t) * k, 0)
            y0 = int(sy)
            f = sy - y0
            c = raw[y0, x, :3] * (1 - f) + raw[min(y0 + 1, hs - 1), x, :3] * f
            cov = np.clip(r - np.hypot(dx, y - cy) + 0.5, 0, 1)
            if y < 0:
                im[y + off, x, :3] = c
                im[y + off, x, 3] = 255 * cov
            elif y <= 10:
                im[y + off, x, :3] = c if raw[y, x, 3] > 40 or cov > 0 else raw[y, x, :3]
                im[y + off, x, 3] = max(raw[y, x, 3], 255 * cov)
            elif raw[y, x, 3] > 128:
                im[y + off, x, :3] = c
    return im


def clean_matte(im, bg_box=None, remove_pale_edges=True):
    """Tighten the cut-out's edge and pull edge colours in from the interior.

    remove_pale_edges drops near-white, unsaturated pixels along the outline (the halo left by a light
    background). Turn it OFF for a figure whose own edge is white, such as the thobe. bg_box also
    drops them inside that region (between fingers)."""
    rgb, a = im[..., :3], im[..., 3]
    bright = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    solid = a > 128
    edge_band = solid & ~filt(solid, ImageFilter.MinFilter(13))
    region = np.zeros_like(solid)
    if remove_pale_edges:
        region |= edge_band
    if bg_box is not None:
        region |= bg_box
    bglike = (bright > 212) & (sat < 40) & region
    a2 = np.where(bglike, 0, a)
    hard = filt(a2 > 150, ImageFilter.MinFilter(3))
    alpha = np.minimum(soft(hard, 0.8) * 255, a2)

    known = filt((a >= 250) & ~bglike, ImageFilter.MinFilter(5))
    col = rgb * known[..., None]
    w = known.astype(np.float32)
    for _ in range(10):
        cs = np.zeros_like(col)
        ws = np.zeros_like(w)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                cs += np.roll(np.roll(col, dy, 0), dx, 1)
                ws += np.roll(np.roll(w, dy, 0), dx, 1)
        g = (w == 0) & (ws > 0)
        col[g] = cs[g] / ws[g][:, None]
        w[g] = 1
    rgb2 = np.where(known[..., None], rgb, np.where(w[..., None] > 0, col, rgb))
    return np.dstack([rgb2, alpha])


def skin_like(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # skin, including its shadows; not the orange or yellow shirt (almost no blue), the thobe (not
    # red enough) or the shemagh's red check (too little green)
    return (b >= 40) & (b <= 185) & (g >= 70) & (r - g >= 30) & (r > 150)


def split_hand(im, hand_box, palm, sleeve_seed, body_seed):
    """Split a clean picture into body and waving-hand layers.

    The hand is everything connected to `palm` inside hand_box that is not sleeve. The sleeve is the
    one non-skin region connected to `sleeve_seed` (grown ~1px to take its outline). Pixels near the
    hand that are not sleeve, and islands cut off from the body, go to the hand, so nothing is left
    floating on the body while the hand moves."""
    rgb, alpha = im[..., :3], im[..., 3]
    sleeve = flood(sleeve_seed, ~skin_like(rgb) & (alpha > 40))
    sleeve = filt(filt(sleeve, ImageFilter.MaxFilter(5)), ImageFilter.MinFilter(3))
    skin = flood(palm, hand_box & (alpha > 8) & ~sleeve)
    skin = filt(filt(skin, ImageFilter.MaxFilter(5)), ImageFilter.MinFilter(5))
    skin_s = soft(skin, 0.6)

    ghost = filt(skin, ImageFilter.MaxFilter(9)) & hand_box & ~sleeve
    body_a = np.where(ghost, 0, alpha * (1 - skin_s))
    hand_a = np.where(ghost & ~skin, alpha * (alpha > 60), alpha * skin_s)

    main = flood(body_seed, body_a > 6)
    island = hand_box & (body_a > 6) & ~main
    hand_a = np.where(island, np.maximum(hand_a, body_a), hand_a)
    body_a = np.where(island, 0, body_a)

    greyish = (rgb[..., 0] - rgb[..., 2] < 75) & hand_box & ~sleeve
    hand_a = np.where(greyish, 0, hand_a)
    print('  hand pixels', int((hand_a > 128).sum()), '| islands moved', int(island.sum()))
    return np.dstack([rgb, body_a]), np.dstack([rgb, hand_a])


def save_layers(body, hand, pivot, name, out_h=560, stub_r=(26, 20, 20, 22), stub_rgb=(214, 128, 84)):
    """Add the wrist stub under the cuff, crop both layers to one box, scale, and write them."""
    h, w = body.shape[:2]
    px, py = pivot
    hand_img = to_img(hand)
    stub = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    l_, t_, r_, b_ = stub_r
    ImageDraw.Draw(stub).ellipse([px - l_, py - t_, px + r_, py + b_], fill=stub_rgb + (255,))
    stub = stub.filter(ImageFilter.GaussianBlur(1))
    stub.alpha_composite(hand_img)
    hand_img = stub
    body_img = to_img(body)

    full = Image.alpha_composite(body_img, hand_img)
    l, t, r, b = full.getbbox()
    box = (max(l - 24, 0), max(t - 6, 0), min(r + 24, w), b)
    body_img, hand_img = body_img.crop(box), hand_img.crop(box)
    cw, ch = body_img.size
    size = (round(cw * out_h / ch), out_h)
    body_img = body_img.resize(size, Image.LANCZOS)
    hand_img = hand_img.resize(size, Image.LANCZOS)
    pv = ((px - box[0]) / cw * 100, (py - box[1]) / ch * 100)
    body_img.save(f'out/printo-{name}-body.webp', quality=92, alpha_quality=100, method=6)
    hand_img.save(f'out/printo-{name}-hand.webp', quality=92, alpha_quality=100, method=6)
    meta = {'w': size[0], 'h': size[1], 'pivot': [round(pv[0], 2), round(pv[1], 2)]}
    json.dump(meta, open(f'out/{name}.json', 'w'))
    print(' ', name, meta)

    cx, cy = pv[0] / 100 * size[0], pv[1] / 100 * size[1]
    sheet = Image.new('RGBA', (size[0] * 6, out_h), (0, 0, 0, 0))
    for i, (ang, bg) in enumerate([(0, (255,) * 4), (19, (255,) * 4), (-14, (255,) * 4),
                                   (0, (0, 70, 162, 255)), (19, (0, 70, 162, 255)), (-14, (0, 70, 162, 255))]):
        tile = Image.new('RGBA', size, bg)
        tile.alpha_composite(hand_img.rotate(ang, resample=Image.BICUBIC, center=(cx, cy)))
        tile.alpha_composite(body_img)
        sheet.paste(tile, (i * size[0], 0))
    sheet.convert('RGB').save(f'qa-{name}.png')
    return meta


def nearest(im, p, test, radius=40):
    """The pixel closest to p that passes test(pixel); for seeds that must land on a surface."""
    x0, y0 = p
    best = None
    for y in range(max(y0 - radius, 0), min(y0 + radius, im.shape[0])):
        for x in range(max(x0 - radius, 0), min(x0 + radius, im.shape[1])):
            d = (x - x0) ** 2 + (y - y0) ** 2
            if (best is None or d < best[0]) and test(im[y, x]):
                best = (d, (x, y))
    if best is None:
        raise SystemExit(f'no matching pixel near {p}')
    return best[1]
