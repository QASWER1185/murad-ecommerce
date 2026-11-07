#!/usr/bin/env python3
"""Extract approved homepage artwork from the user's reference, without substitutions.

Usage: python scripts/extract-homepage-assets.py /path/to/original-reference.png
Requires Pillow. Coordinates use the 1199 x 1312 reference displayed in the task.
The script keeps the original source pixel density. Inspect crops before committing.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
# x, y, width, height. Text and interactive controls remain HTML except for the
# approved marketing banners and logos, whose typography is part of the artwork.
CROPS = {
    'logo-header': (40, 39, 281, 56),
    'logo-footer': (40, 1182, 175, 89),
    'logo-header-mark': (40, 39, 73, 56),
    'logo-footer-mark': (96, 1182, 60, 47),
    'hero': (0, 141, 1199, 266),
    'hero-mobile': (474, 141, 725, 266),
    'category-sanitary': (38, 421, 120, 82),
    'category-kitchen': (170, 421, 118, 82),
    'category-hobs': (300, 421, 115, 82),
    'category-hoods': (427, 421, 111, 82),
    'category-geysers': (550, 421, 116, 82),
    'category-pipes': (678, 421, 108, 82),
    'category-tanks': (798, 421, 107, 82),
    'category-electric': (917, 421, 111, 82),
    'category-building': (1040, 421, 121, 82),
    'brand-faisal': (37, 590, 138, 58),
    'brand-porta-ceramics': (185, 590, 136, 58),
    'brand-porta-sanitary': (331, 590, 133, 58),
    'brand-dell': (474, 590, 129, 58),
    'brand-popular': (613, 590, 130, 58),
    'brand-duramax': (753, 590, 131, 58),
    'brand-duraflow': (894, 590, 132, 58),
    'brand-imported': (1036, 590, 129, 58),
    'badge-bestseller': (43, 708, 58, 22),
    'product-commode': (54, 710, 167, 104),
    'product-basin': (240, 710, 166, 104),
    'product-mixer': (425, 710, 165, 104),
    'product-shower': (608, 710, 166, 104),
    'product-sink': (793, 710, 166, 104),
    'product-hob': (979, 710, 165, 104),
    'banner-pipes': (16, 959, 576, 135),
    'banner-building': (607, 959, 576, 135),
    'social-icons': (878, 1198, 111, 24),
    'icon-pin-top': (39, 7, 15, 19),
    'icon-check': (429, 10, 15, 13),
    'icon-phone': (936, 6, 20, 21),
    'icon-whatsapp-top': (1076, 6, 21, 22),
    'icon-search': (809, 58, 24, 24),
    'icon-account': (909, 58, 21, 25),
    'icon-heart-header': (1027, 58, 22, 25),
    'icon-cart-header': (1121, 58, 20, 26),
    'icon-chevron-down': (978, 72, 10, 9),
    'icon-chevron-white': (362, 118, 10, 10),
    'icon-list': (50, 115, 19, 16),
    'icon-menu-chevron': (166, 119, 10, 8),
    'icon-view-brands': (1159, 567, 9, 12),
    'icon-chevron-right': (282, 346, 11, 14),
    'icon-cart-button': (73, 909, 16, 16),
    'icon-heart-product': (190, 908, 20, 19),
    'icon-star': (59, 878, 14, 15),
    'icon-previous': (24, 798, 12, 17),
    'icon-next': (1164, 798, 12, 17),
    'icon-whatsapp-banner': (653, 1044, 26, 28),
    'icon-delivery': (58, 1114, 34, 29),
    'icon-shield': (292, 1114, 30, 29),
    'icon-payment': (524, 1114, 33, 29),
    'icon-returns': (751, 1114, 31, 29),
    'icon-support': (973, 1114, 31, 29),
    'icon-pin-footer': (643, 1197, 21, 24),
    'icon-whatsapp-footer': (643, 1244, 23, 24),
}


def remove_backdrop(artwork, name):
    """Unmatte reference icons so their original strokes work on responsive UI.

    No replacement glyphs are drawn. Color pixels and antialiasing are recovered
    from the reference's own flat backdrop.
    """
    from statistics import median
    result = artwork.convert('RGBA')
    w, h = result.size
    border = [artwork.getpixel((x, y)) for x in range(w) for y in range(h)
              if x in (0, w - 1) or y in (0, h - 1)]
    background = tuple(median(pixel[c] for pixel in border) for c in range(3))
    light = name in {'icon-check', 'icon-phone', 'icon-search', 'icon-cart-button',
                     'icon-chevron-white', 'icon-pin-top', 'icon-pin-footer',
                     'icon-whatsapp-footer'}
    foreground = (255, 255, 255) if light else (0, 27, 49)
    colored = name in {'icon-star', 'icon-whatsapp-top'}
    for y in range(h):
        for x in range(w):
            pixel = artwork.getpixel((x, y))
            if colored:
                distance = max(abs(pixel[c] - background[c]) for c in range(3))
                if distance < 24:
                    result.putpixel((x, y), (0, 0, 0, 0))
                continue
            estimates = [(pixel[c] - background[c]) / (foreground[c] - background[c])
                         for c in range(3) if abs(foreground[c] - background[c]) > 40]
            alpha = max(0, min(1, max(estimates, default=0)))
            if alpha < .035:
                result.putpixel((x, y), (0, 0, 0, 0))
            else:
                color = tuple(round(max(0, min(255, (pixel[c] - (1 - alpha) * background[c]) / alpha)))
                              for c in range(3))
                result.putpixel((x, y), (*color, round(alpha * 255)))
    if name == 'icon-cart-header':
        # Exclude the first antialiased column of the adjacent Cart label.
        for y in range(round(16 * h / 26), h):
            result.putpixel((w - 1, y), (0, 0, 0, 0))
    if name == 'icon-heart-header':
        # Adjacent Wishlist lettering overlaps the icon's bounding rectangle.
        for y in range(round(16 * h / 25), h):
            for x in range(round(17 * w / 22), w):
                result.putpixel((x, y), (0, 0, 0, 0))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    source = Image.open(args.source).convert('RGB')
    if abs(source.width / source.height - 1199 / 1312) > .005:
        parser.error('Expected the complete approved reference at aspect ratio 1199:1312; refusing to crop another image.')
    target = ROOT / 'public' / 'homepage'
    target.mkdir(parents=True, exist_ok=True)
    sx, sy = source.width / 1199, source.height / 1312

    def crop(bounds):
        x, y, width, height = bounds
        return source.crop((round(x * sx), round(y * sy), round((x + width) * sx), round((y + height) * sy)))

    for name, bounds in CROPS.items():
        artwork = crop(bounds)
        if name.startswith('icon-'):
            artwork = remove_backdrop(artwork, name)
        artwork.save(target / f'{name}.png', optimize=True)
    # Extract the original footer artwork, removing only the text/logo areas
    # that are rendered as accessible HTML or separately extracted logo assets.
    # Interpolate their text-free edge pixels; skyline and wave remain untouched.
    decoration = crop((0, 1162, 1199, 150)).convert('RGBA')
    text_regions = [(38, 1178, 219, 1273), (278, 1177, 385, 1266),
                    (448, 1177, 605, 1296), (640, 1177, 862, 1279),
                    (874, 1177, 990, 1227)]
    for left, top, right, bottom in text_regions:
        x0, x1 = round(left * sx), round(right * sx)
        for source_y in range(round(top * sy), round(bottom * sy)):
            a = source.getpixel((x0 - 2, source_y))
            b = source.getpixel((x1 + 2, source_y))
            for x in range(x0, x1):
                amount = (x - x0) / max(1, x1 - x0 - 1)
                color = tuple(round(a[c] * (1 - amount) + b[c] * amount) for c in range(3))
                decoration.putpixel((x, source_y - round(1162 * sy)), (*color, 255))
    decoration.save(target / 'footer-decoration.png', optimize=True)
    names = list(CROPS) + ['footer-decoration']
    module = '// Extracted from the approved reference. See public/homepage/provenance.json.\n'
    module += 'export const referenceAssets: readonly string[] = ' + json.dumps(names, indent=2) + ';\n'
    (ROOT / 'src/components/home/reference-assets.ts').write_text(module)
    (target / 'provenance.json').write_text(json.dumps({
        'source_sha256': hashlib.sha256(args.source.read_bytes()).hexdigest(),
        'source_dimensions': [source.width, source.height],
        'reference_coordinate_dimensions': [1199, 1312],
        'crops': CROPS,
        'note': 'All visuals extracted from the approved reference; no replacement images or generated artwork.',
    }, indent=2) + '\n')
    print(f'Extracted {len(names)} assets. Review the crops, rebuild, and compare a 1199px desktop capture.')


if __name__ == '__main__':
    main()
