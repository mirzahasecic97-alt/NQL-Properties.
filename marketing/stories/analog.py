#!/usr/bin/env python3
"""Analog film look for the post pictures. Mirza, 2 Nov 2026: "add like a
retro filter: ANALOG". Lifted matte blacks, warm highlights, cooler shadows,
a little less colour, fine grain, a soft vignette. Reads art/<name>.jpg,
writes art/analog/<name>.jpg at the same size.

  ~/.local/nql-tools/bin/python analog.py            # every ski-*/golf-* picture
  ~/.local/nql-tools/bin/python analog.py name.jpg   # one picture
"""
import glob, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(HERE, "art"), os.path.join(HERE, "art", "analog")


def curve(x, lift, knee):
    """Matte film curve on 0..1: blacks lifted to `lift`, highlights rolled off by `knee`."""
    return lift + (1 - lift - knee) * x + knee * (1 - (1 - x) ** 2)


def analog(im, grain=7.0, vignette=0.22, seed=1):
    im = im.convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255.0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # tone: lifted blacks, soft highlights, each channel a little different
    r = curve(r, 0.07, 0.10) * 1.02 + 0.015       # warm highlights
    g = curve(g, 0.07, 0.10)
    b = curve(b, 0.10, 0.14) - 0.01                # cooler, flatter shadows
    a = np.stack([r, g, b], -1)
    # less colour
    lum = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])[..., None]
    a = lum + (a - lum) * 0.82
    # vignette
    h, w = lum.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h * 0.47) / (h / 2)) ** 2)
    v = 1 - vignette * np.clip((d - 0.55) / 0.9, 0, 1) ** 1.6
    a = a * v[..., None]
    # grain, luminance only, scaled to picture size
    rng = np.random.default_rng(seed)
    n = rng.normal(0, grain / 255.0 * (max(w, h) / 1000.0) ** 0.5, (h, w, 1)).astype(np.float32)
    a = a + n
    out = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return out.filter(ImageFilter.GaussianBlur(0.3))  # takes the digital edge off


def main(names):
    os.makedirs(OUT, exist_ok=True)
    files = [os.path.join(SRC, n) for n in names] if names else sorted(glob.glob(os.path.join(SRC, "ski-*.jpg")) + glob.glob(os.path.join(SRC, "golf-*.jpg")))
    for f in files:
        out = os.path.join(OUT, os.path.basename(f))
        analog(Image.open(f), seed=abs(hash(os.path.basename(f))) % 1000).save(out, quality=94)
        print("analog:", os.path.relpath(out, HERE))


if __name__ == "__main__":
    main(sys.argv[1:])
