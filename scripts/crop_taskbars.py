"""
scripts/crop_taskbars.py — Centre-crop taskbar images to 1183×292

Matches the original EN canvas size. Run whenever new taskbar images
are exported at a larger size.

Usage:
    python3 scripts/crop_taskbars.py
"""

from PIL import Image
import os

TARGET_W = 1183
TARGET_H = 292
IMAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')
FILES = ['taskbar-1.png', 'taskbar-2.png', 'taskbar-3.png']

for name in FILES:
    path = os.path.join(IMAGES_DIR, name)
    if not os.path.exists(path):
        print(f'{name}: not found, skipping.')
        continue

    img = Image.open(path)
    w, h = img.size

    if w == TARGET_W and h == TARGET_H:
        print(f'{name}: already {w}×{h}, skipping.')
        continue

    if w < TARGET_W or h < TARGET_H:
        print(f'{name}: WARNING — source ({w}×{h}) smaller than target ({TARGET_W}×{TARGET_H}), skipping.')
        continue

    left   = (w - TARGET_W) // 2
    top    = (h - TARGET_H) // 2
    right  = left + TARGET_W
    bottom = top  + TARGET_H

    cropped = img.crop((left, top, right, bottom))
    cropped.save(path)
    print(f'{name}: {w}×{h} → {cropped.size[0]}×{cropped.size[1]}, saved.')

print('Done.')
