# Builds every story in two sizes, 9:16 for stories and 4:5 for feed ads,
# and renders them with render.js. The content is one centred stack.
import subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
FORMATS = {"story": (1080, 1920), "feed": (1080, 1350)}

def css(w, h, k, art_h):
    # k scales type between the two formats; art_h is the artwork height
    return f'''
@font-face {{ font-family: "Seasons"; src: url("../../fonts/TheSeasons-Regular.woff2") format("woff2"); font-weight: 400; }}
@font-face {{ font-family: "Seasons"; src: url("../../fonts/TheSeasons-Light.woff2") format("woff2"); font-weight: 300; }}
@font-face {{ font-family: "Seasons"; src: url("../../fonts/TheSeasons-Italic.woff2") format("woff2"); font-style: italic; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ width: {w}px; height: {h}px; overflow: hidden; }}
body {{ background: #F6F1E6; color: #4A433B; font-family: "Seasons", Georgia, serif; position: relative; -webkit-font-smoothing: antialiased; }}
.bg {{ position:absolute; inset:0; width:{w}px; height:{h}px; object-fit:cover; }}
.grain {{ position:absolute; inset:0; pointer-events:none; opacity:.05; background-image: radial-gradient(#4A433B .6px, transparent .6px); background-size: 6px 6px; }}
.stack {{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 0 80px; gap: 0; }}
.panel {{ background: rgba(246,241,230,.9); padding: {int(54*k)}px {int(60*k)}px {int(58*k)}px; max-width: {w-160}px; }}
.mark {{ height: {int(44*k)}px; margin-bottom: {int(44*k)}px; opacity:.75; }}
.eyebrow {{ font-size: {int(30*k)}px; letter-spacing: .12em; color: #8A8176; margin-bottom: {int(26*k)}px; }}
.h1 {{ font-size: {int(200*k)}px; line-height: .94; letter-spacing: .01em; }}
.h2 {{ font-size: {int(140*k)}px; line-height: 1; letter-spacing: .02em; }}
.h3 {{ font-size: {int(112*k)}px; line-height: 1; letter-spacing: .03em; }}
.art {{ width: {w-240}px; height: {art_h}px; overflow:hidden; background:#E7E0D4; margin: {int(54*k)}px 0 {int(46*k)}px; }}
.art img {{ width:100%; height:100%; object-fit:cover; display:block; }}
.places {{ font-size: {int(52*k)}px; line-height: 1.15; }}
.small {{ font-size: {int(30*k)}px; line-height: 1.45; color:#6B6457; font-weight: 300; margin-top: {int(16*k)}px; }}
.ital {{ font-size: {int(46*k)}px; line-height: 1.25; font-style: italic; }}
.rule {{ width: 72px; height: 2px; background:#C5A059; margin: {int(32*k)}px auto {int(24*k)}px; }}
.price {{ font-size: {int(32*k)}px; letter-spacing: .08em; color:#8A8176; }}
.url {{ font-size: {int(30*k)}px; letter-spacing: .08em; color:#4A433B; margin-top: {int(12*k)}px; }}
'''
def page(style, body):
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{style}</style></head><body>{body}<div class="grain"></div></body></html>'

FOOT = '<div class="rule"></div><div class="price">Villas from €10,000 a night</div><div class="url">nqlgroup.com/destinations</div>'

def stories(fmt):
    w, h = FORMATS[fmt]; story = fmt == "story"
    k = 1.0 if story else 0.78
    art = 760 if story else 470
    S = css(w, h, k, art)
    out = {}
    # 01 First Tracks: mark, date, headline, framed artwork, places, line, foot
    out["01-aspen-first-tracks"] = page(S, f'''
<div class="stack">
  <img class="mark" src="../../gallery/swirl-ink.png">
  <div class="eyebrow">Thanksgiving week · 25 to 29 November</div>
  <div class="h1">First Tracks</div>
  <div class="art"><img src="art/aspen.png"></div>
  <div class="places">Aspen · Vail · Park City</div>
  <div class="small">The season opens. The house to come back to is ours to find.</div>
  {FOOT}
</div>''')
    # 02 White Turf: poster, framed artwork
    out["02-st-moritz-white-turf"] = page(S, f'''
<div class="stack">
  <img class="mark" src="../../gallery/swirl-ink.png">
  <div class="eyebrow">St. Moritz · February Sundays</div>
  <div class="h2">White Turf</div>
  <div class="art"><img src="art/stmoritz.png"></div>
  <div class="ital">Polo and racing on a frozen lake.<br>A chalet above it.</div>
  {FOOT}
</div>''')
    # 03 Où il neige: the chalet framed, the French line above it
    out["03-festive-chalet"] = page(S, f'''
<div class="stack">
  <img class="mark" src="../../gallery/swirl-ink.png">
  <div class="eyebrow">20 December to 5 January</div>
  <div class="h3">Où il neige.</div>
  <div class="art"><img src="art/chalet.png" style="object-position:50% 62%"></div>
  <div class="places">Courchevel · Gstaad · St. Moritz</div>
  <div class="small">Christmas where it snows. A few houses are still open for the festive weeks.</div>
  {FOOT}
</div>''')
    # 04 Ski Season: the car framed, the headline above it
    out["04-ski-season-red-car"] = page(S, f'''
<div class="stack">
  <img class="mark" src="../../gallery/swirl-ink.png">
  <div class="h2">Ski Season</div>
  <div class="art"><img src="art/car.png" style="object-position:50% 70%"></div>
  <div class="places">Aspen · St. Moritz · Courchevel · Gstaad</div>
  <div class="ital" style="margin-top:{int(14*k)}px">The house to come back to.</div>
  {FOOT}
</div>''')
    return out

os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
for fmt, (w, h) in FORMATS.items():
    for name, src in stories(fmt).items():
        p = os.path.join(HERE, f"{name}-{fmt}.html"); open(p, "w").write(src)
        o = os.path.join(HERE, "out", f"{name}-{fmt}.png")
        r = subprocess.run(["osascript", "-l", "JavaScript", os.path.join(HERE, "render.js"), p, o, str(w), str(h)], capture_output=True, text=True)
        print(name, fmt, r.stdout.strip() or r.stderr.strip()[:160])
