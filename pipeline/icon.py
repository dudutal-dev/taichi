# אייקון האפליקציה: טבעת 150 (קרם, קשת ברונזה) על ירוק-במבוק, עם עלה במבוק. Pillow בלבד.
# הרצה: python pipeline/icon.py  → content/icons/icon-512.png, icon-192.png, icon-maskable-512.png, apple-touch-icon.png
import math, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'content', 'icons'); os.makedirs(OUT, exist_ok=True)
GREEN, DEEP, CREAM, BRONZE, SOFT = (47, 93, 58), (31, 65, 40), (246, 241, 228), (176, 122, 60), (143, 178, 138)

def font(size):
    for f in [r'C:\Windows\Fonts\segoeuib.ttf', r'C:\Windows\Fonts\arialbd.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(f): return ImageFont.truetype(f, size)
    return ImageFont.load_default()

def draw_icon(S=1024, rounded=True, pad=0.0):
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded: d.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * 0.22), fill=GREEN)
    else: d.rectangle((0, 0, S, S), fill=GREEN)
    # כמה "עלים" רכים ברקע (צללית במבוק) — שקט, לא צעקני
    leaf = Image.new('RGBA', (S, S), (0, 0, 0, 0)); ld = ImageDraw.Draw(leaf)
    for (cx, cy, ang, ln) in [(0.80, 0.22, -35, 0.30), (0.18, 0.80, 145, 0.26), (0.84, 0.74, 20, 0.22)]:
        cx, cy, ln = cx * S, cy * S, ln * S
        pts = []
        for t in range(0, 101):
            u = t / 100
            w = math.sin(u * math.pi) * ln * 0.18
            x, y = (u - 0.5) * ln, 0
            for sgn in (1,):
                pass
            pts.append((x, -w))
        pts += [(-( (t / 100) - 0.5) * ln, math.sin((t / 100) * math.pi) * ln * 0.18) for t in range(100, -1, -1)]
        a = math.radians(ang)
        poly = [(cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)) for x, y in pts]
        ld.polygon(poly, fill=DEEP + (255,))
    img.alpha_composite(leaf)
    d = ImageDraw.Draw(img)
    # הטבעת
    c = S / 2; r = S * (0.33 - pad); w = int(S * 0.085)
    box = (c - r, c - r, c + r, c + r)
    d.ellipse(box, outline=(222, 214, 190, 255), width=w)
    d.arc(box, start=-90, end=-90 + 360 * 0.72, fill=BRONZE + (255,), width=w)
    # כיפות עגולות לשני קצות הקשת (ברונזה)
    rr = w / 2 - 1
    for ang in (-90, -90 + 360 * 0.72):
        a = math.radians(ang); px, py = c + (r - w / 2) * math.cos(a), c + (r - w / 2) * math.sin(a)  # מרכז פס הטבעת
        d.ellipse((px - rr, py - rr, px + rr, py + rr), fill=BRONZE + (255,))
    # המספר
    f = font(int(S * 0.30))
    t = '150'
    bb = d.textbbox((0, 0), t, font=f)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    d.text((c - tw / 2 - bb[0], c - th / 2 - bb[1]), t, font=f, fill=CREAM + (255,))
    return img

base = draw_icon(1024, rounded=True)
base.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, 'icon-512.png'))
base.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, 'icon-192.png'))
draw_icon(1024, rounded=False, pad=0.03).resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, 'icon-maskable-512.png'))
apple = draw_icon(1024, rounded=False)
apple.convert('RGB').resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, 'apple-touch-icon.png'))
print('icons written to', OUT)
