# Builds every post in two sizes, 9:16 for stories and 4:5 for feed, and
# renders them with render.js. Minimal since 1 Nov 2026 (Mirza: "I need to
# have it minimalistic", and the gold rule goes): the artwork, one headline,
# one small line, and the price with the address in tiny type at the foot.
# Background always white (Mirza, 1 Nov 2026).
import subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
FORMATS = {"story": (1080, 1920), "feed": (1080, 1350)}

def css(w, h, k, art_h, top, foot):
    return f'''
@font-face {{ font-family: "Seasons"; src: url("../../fonts/TheSeasons-Regular.woff2") format("woff2"); font-weight: 400; }}
@font-face {{ font-family: "Seasons"; src: url("../../fonts/TheSeasons-Light.woff2") format("woff2"); font-weight: 300; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ width: {w}px; height: {h}px; overflow: hidden; }}
body {{ background: #FFFFFF; color: #4A433B; font-family: "Seasons", Georgia, serif; position: relative; -webkit-font-smoothing: antialiased; }}
.grain {{ position:absolute; inset:0; pointer-events:none; opacity:.05; background-image: radial-gradient(#4A433B .6px, transparent .6px); background-size: 6px 6px; }}
.art {{ position:absolute; left: 90px; top: {top}px; width: {w-180}px; height: {art_h}px; overflow:hidden; background:#F2F2F2; }}
.art img {{ width:100%; height:100%; object-fit:cover; display:block; }}
.text {{ position:absolute; left: 90px; right: 90px; top: {top + art_h}px; bottom: {foot}px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }}
.h {{ font-size: {int(118*k)}px; line-height: 1.02; letter-spacing: .01em; font-weight: 300; }}
.line {{ font-size: {int(26*k)}px; letter-spacing: .14em; color: #8A8176; margin-top: {int(26*k)}px; }}
.foot {{ position:absolute; left:0; right:0; bottom: {foot - int(40*k)}px; text-align:center; font-size: {int(21*k)}px; letter-spacing: .12em; color: #8A8176; font-weight: 300; }}
'''
def page(style, body):
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{style}</style></head><body>{body}</body></html>'

FOOT = '<div class="foot">Villas from €10,000 a night &nbsp;·&nbsp; nqlgroup.com/winter</div>'

POSTS = {
    # name: (art, object-position, headline, line)
    "01-aspen-first-tracks": ("aspen.png", "50% 50%", "First Tracks", "Aspen · Vail · Park City · 25 to 29 November"),
    "02-st-moritz-white-turf": ("stmoritz.png", "50% 50%", "White Turf", "St. Moritz · February Sundays"),
    "03-festive-chalet": ("chalet.png", "50% 62%", "For the team", "Aspen · Vail · Park City · Jackson Hole · January"),
    "04-ski-season-red-car": ("car.png", "50% 70%", "Ski Season", "Aspen · Vail · Park City · Jackson Hole"),
}

def stories(fmt):
    w, h = FORMATS[fmt]; story = fmt == "story"
    k = 1.0 if story else 0.82
    # the story keeps clear of Instagram's own bars: top 220, bottom 280
    top, foot, art = (300, 300, 1000) if story else (90, 96, 760)
    S = css(w, h, k, art, top, foot)
    out = {}
    for name, (art_file, pos, head, line) in POSTS.items():
        out[name] = page(S, f'''
<div class="art"><img src="art/{art_file}" style="object-position:{pos}"></div>
<div class="text"><div class="h">{head}</div><div class="line">{line}</div></div>
{FOOT}''')
    return out

os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
for fmt, (w, h) in FORMATS.items():
    for name, src in stories(fmt).items():
        p = os.path.join(HERE, f"{name}-{fmt}.html"); open(p, "w").write(src)
        o = os.path.join(HERE, "out", f"{name}-{fmt}.png")
        r = subprocess.run(["osascript", "-l", "JavaScript", os.path.join(HERE, "render.js"), p, o, str(w), str(h)], capture_output=True, text=True)
        print(name, fmt, r.stdout.strip() or r.stderr.strip()[:160])
