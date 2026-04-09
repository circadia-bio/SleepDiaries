"""
scripts/crop_taskbars.py — Centre-crop PT-BR taskbar images to match EN canvas

EN taskbar size: 1183 × 292
PT-BR taskbars are larger and need to be cropped to the same dimensions
with the crop window centred on the image.

Usage:
    python3 scripts/crop_taskbars.py
"""

from PIL import Image
import os

TARGET_W = 1183
TARGET_H = 292
PT_BR_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images', 'pt-BR')
FILES = ['taskbar-1.png', 'taskbar-2.png', 'taskbar-3.png']

for name in FILES:
    path = os.path.join(PT_BR_DIR, name)
    img = Image.open(path)
    w, h = img.size

    if w == TARGET_W and h == TARGET_H:
        print(f'{name}: already {w}×{h}, skipping.')
        continue

    if w < TARGET_W or h < TARGET_H:
        print(f'{name}: WARNING — source ({w}×{h}) is smaller than target '
              f'({TARGET_W}×{TARGET_H}). Skipping.')
        continue

    left   = (w - TARGET_W) // 2
    top    = (h - TARGET_H) // 2
    right  = left + TARGET_W
    bottom = top  + TARGET_H

    cropped = img.crop((left, top, right, bottom))
    cropped.save(path)
    print(f'{name}: {w}×{h} → cropped to {cropped.size[0]}×{cropped.size[1]}, saved.')

print('Done.')
