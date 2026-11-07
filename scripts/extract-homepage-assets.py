#!/usr/bin/env python3
"""Extract approved homepage artwork from the user's reference, without substitutions.

Usage: python scripts/extract-homepage-assets.py /path/to/original-reference.png
Requires Pillow. Coordinates use the 1200 x 1312 reference displayed in the task.
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
    'logo-header-mark': (40, 39, 73, 56),
    'logo-footer-mark': (96, 1182, 60, 47),
    'hero': (0, 141, 1200, 266),
    'hero-mobile': (474, 141, 726, 266),
    'category-sanitary': (39, 421, 119, 82),
    'category-kitchen': (171, 421, 117, 82),
    'category-hobs': (301, 421, 114, 82),
    'category-hoods': (428, 421, 111, 82),
    'category-geysers': (552, 421, 115, 82),
    'category-pipes': (681, 421, 109, 82),
    'category-tanks': (802, 421, 105, 82),
    'category-electric': (919, 421, 111, 82),
    'category-building': (1041, 421, 121, 82),
    'brand-faisal': (39, 590, 135, 58),
    'brand-porta-ceramics': (186, 590, 135, 58),
    'brand-porta-sanitary': (333, 590, 131, 58),
    'brand-dell': (476, 590, 128, 58),
    'brand-popular': (615, 590, 128, 58),
    'brand-duramax': (757, 590, 127, 58),
    'brand-duraflow': (897, 590, 130, 58),
    'brand-imported': (1040, 590, 125, 58),
    'product-commode': (55, 711, 165, 102),
    'product-basin': (242, 711, 163, 102),
    'product-mixer': (428, 711, 161, 102),
    'product-shower': (612, 711, 161, 102),
    'product-sink': (797, 711, 162, 102),
    'product-hob': (981, 711, 163, 102),
    'banner-pipes': (16, 959, 576, 135),
    'banner-building': (607, 959, 576, 135),
    'social-icons': (878, 1198, 111, 26),
    'icon-pin-top': (39, 7, 15, 19),
    'icon-check': (429, 10, 15, 13),
    'icon-phone': (936, 6, 20, 21),
    'icon-whatsapp-top': (1076, 6, 21, 22),
    'icon-search': (809, 58, 24, 24),
    'icon-account': (908, 56, 27, 29),
    'icon-heart-header': (1025, 57, 25, 29),
    'icon-cart-header': (1120, 56, 25, 29),
    'icon-chevron-down': (978, 72, 10, 9),
    'icon-chevron-white': (362, 118, 10, 10),
    'icon-list': (49, 114, 20, 19),
    'icon-chevron-right': (282, 346, 11, 14),
    'icon-cart-button': (72, 908, 17, 17),
    'icon-heart-product': (189, 906, 22, 22),
    'icon-star': (59, 878, 14, 15),
    'icon-previous': (23, 795, 15, 24),
    'icon-next': (1163, 795, 15, 24),
    'icon-whatsapp-banner': (653, 1044, 26, 28),
    'icon-delivery': (58, 1114, 34, 29),
    'icon-shield': (292, 1114, 30, 29),
    'icon-payment': (524, 1114, 33, 29),
    'icon-returns': (751, 1114, 31, 29),
    'icon-support': (973, 1114, 31, 29),
    'icon-pin-footer': (643, 1197, 21, 24),
    'icon-whatsapp-footer': (643, 1244, 23, 24),
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    source = Image.open(args.source).convert('RGB')
    if abs(source.width / source.height - 1200 / 1312) > .005:
        parser.error('Expected the complete approved reference at aspect ratio 1200:1312; refusing to crop another image.')
    target = ROOT / 'public' / 'homepage'
    target.mkdir(parents=True, exist_ok=True)
    sx, sy = source.width / 1200, source.height / 1312

    def crop(bounds):
        x, y, width, height = bounds
        return source.crop((round(x * sx), round(y * sy), round((x + width) * sx), round((y + height) * sy)))

    for name, bounds in CROPS.items():
        crop(bounds).save(target / f'{name}.png', optimize=True)
    # The footer skyline is isolated from the text columns. Keep only the actual
    # gold pixels in the lower wave; never redraw or generate the decoration.
    decoration = Image.new('RGBA', (source.width, round(150 * sy)))
    skyline = crop((990, 1162, 210, 150))
    decoration.paste(skyline, (round(990 * sx), 0))
    for y in range(round(112 * sy), decoration.height):
        for x in range(source.width):
            r, g, b = source.getpixel((x, round(1162 * sy) + y))
            if r > 135 and g > 100 and r > b * 1.35 and g > b * 1.25:
                decoration.putpixel((x, y), (r, g, b, 255))
    decoration.save(target / 'footer-decoration.png', optimize=True)
    names = list(CROPS) + ['footer-decoration']
    module = '// Extracted from the approved reference. See public/homepage/provenance.json.\n'
    module += 'export const referenceAssets: readonly string[] = ' + json.dumps(names, indent=2) + ';\n'
    (ROOT / 'src/components/home/reference-assets.ts').write_text(module)
    (target / 'provenance.json').write_text(json.dumps({
        'source_sha256': hashlib.sha256(args.source.read_bytes()).hexdigest(),
        'source_dimensions': [source.width, source.height],
        'reference_coordinate_dimensions': [1200, 1312],
        'crops': CROPS,
        'note': 'All visuals extracted from the approved reference; no replacement images or generated artwork.',
    }, indent=2) + '\n')
    print(f'Extracted {len(names)} assets. Review the crops, rebuild, and compare a 1200px desktop capture.')


if __name__ == '__main__':
    main()
