"""Extract decorative assets only; product photographs are not assigned to SKUs."""
import hashlib
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'public/sanitary-category-approved-reference.png'
image = Image.open(source)
if image.size != (1024, 1536):
    raise ValueError('Expected the approved 1024 x 1536 reference')
crops = {
    'logo-header': (18, 34, 254, 80),
    'hero-art': (475, 151, 1005, 345),
    'shower-symbol': (58, 170, 117, 234),
    'whatsapp-symbol': (615, 48, 641, 75),
    'wishlist-symbol': (361, 603, 380, 623),
    'cart-symbol': (246, 607, 263, 622),
    'genuine-symbol': (624, 4, 640, 23),
    'brand-porta': (231, 365, 322, 400),
    'brand-faisal': (414, 363, 512, 401),
    'brand-dell': (612, 362, 682, 400),
    'brand-imported': (777, 363, 900, 401),
    'promotion-art': (460, 1137, 1003, 1248),
    'brand-card-porta': (155, 1288, 251, 1361),
    'brand-card-faisal': (397, 1288, 499, 1361),
    'brand-card-dell': (652, 1288, 752, 1361),
    'brand-card-imported': (902, 1288, 1002, 1361),
    'logo-footer': (35, 1425, 165, 1494),
    'footer-skyline': (905, 1414, 1024, 1513),
}
target = root / 'public/sanitary'
target.mkdir(exist_ok=True)
for name, bounds in crops.items():
    artwork = image.crop(bounds)
    if name == 'shower-symbol':
        artwork = artwork.convert('RGBA')
        for y in range(artwork.height):
            for x in range(artwork.width):
                pixel = artwork.getpixel((x, y))
                alpha = min(1, max(0, pixel[0] / 231))
                if alpha < .05:
                    artwork.putpixel((x, y), (0, 0, 0, 0))
                else:
                    color = tuple(round(min(255, max(0, (pixel[c] - (1-alpha) * (0,36,65)[c]) / alpha))) for c in range(3))
                    artwork.putpixel((x, y), (*color, round(alpha*255)))
    artwork.save(target / f'{name}.png')
(target / 'provenance.json').write_text(json.dumps({
    'source': source.name, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'dimensions': image.size, 'crops': crops,
    'product_images': 'Use database image_url only. Reference model/SKU identity is unverified.',
}, indent=2) + '\n')
