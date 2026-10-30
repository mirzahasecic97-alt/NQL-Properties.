# Builds the story HTML files from one base and renders them with render.js.
import subprocess, os, html
HERE = os.path.dirname(os.path.abspath(__file__))
CSS = '''
@font-face { font-family: "Seasons"; src: url("../../fonts/TheSeasons-Regular.woff2") format("woff2"); font-weight: 400; }
@font-face { font-family: "Seasons"; src: url("../../fonts/TheSeasons-Light.woff2") format("woff2"); font-weight: 300; }
@font-face { font-family: "Seasons"; src: url("../../fonts/TheSeasons-Italic.woff2") format("woff2"); font-style: italic; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1080px; height: 1920px; overflow: hidden; }
body { background: #F6F1E6; color: #111111; font-family: "Seasons", Georgia, serif; position: relative;
       -webkit-font-smoothing: antialiased; }
.grain { position:absolute; inset:0; pointer-events:none; opacity:.06;
  background-image: radial-gradient(#111 0.6px, transparent 0.6px); background-size: 6px 6px; }
.eyebrow { font-size: 30px; letter-spacing: .12em; color: #6B6457; }
.mark { position:absolute; left:50%; transform:translateX(-50%); height: 44px; }
.rule { width: 72px; height: 2px; background:#C5A059; }
.cta { font-size: 30px; letter-spacing: .1em; }
.price { font-size: 32px; letter-spacing: .08em; color:#6B6457; }
.small { font-size: 30px; line-height: 1.45; color:#3A3630; font-weight: 300; }
.url { font-size: 30px; letter-spacing: .08em; color:#111; }
'''
def page(body, extra=""):
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}{extra}</style></head><body>{body}<div class="grain"></div></body></html>'

STORIES = {}

# 1. Magazine cover: huge serif headline, artwork below, coverlines. (Aspen, Thanksgiving ski)
STORIES["01-aspen-first-tracks"] = page(f'''
<img class="mark" src="../../gallery/swirl-ink.png" style="top:150px">
<div style="position:absolute; top:240px; left:80px; right:80px; text-align:center">
  <div class="eyebrow">Thanksgiving week · 25 to 29 November</div>
</div>
<div style="position:absolute; top:310px; left:60px; right:60px; text-align:center; font-size:224px; line-height:.92; letter-spacing:.01em">First<br>Tracks</div>
<div style="position:absolute; top:790px; left:120px; right:120px; height:720px; overflow:hidden; background:#E7E0D4">
  <img src="art/aspen.png" style="width:100%; height:100%; object-fit:cover; display:block">
</div>
<div style="position:absolute; top:1540px; left:80px; right:80px; text-align:center">
  <div style="font-size:54px; line-height:1.15">Aspen · Vail · Park City</div>
  <div class="small" style="margin-top:18px">The season opens. The house to come back to is ours to find.</div>
  <div class="rule" style="margin:34px auto 26px"></div>
  <div class="price">Villas from €7,000 a night</div>
  <div class="url" style="margin-top:14px">nqlgroup.com/destinations</div>
</div>
''')

# 2. Poster: title on top, framed artwork, one line. (St. Moritz)
STORIES["02-st-moritz-white-turf"] = page(f'''
<img class="mark" src="../../gallery/swirl-ink.png" style="top:150px">
<div style="position:absolute; top:236px; left:80px; right:80px; text-align:center">
  <div class="eyebrow">St. Moritz · February Sundays</div>
  <div style="font-size:150px; line-height:1; letter-spacing:.02em; margin-top:26px">White Turf</div>
</div>
<div style="position:absolute; top:600px; left:96px; right:96px; height:900px; overflow:hidden">
  <img src="art/stmoritz.png" style="width:100%; height:100%; object-fit:cover; display:block">
</div>
<div style="position:absolute; top:1540px; left:80px; right:80px; text-align:center">
  <div style="font-size:46px; line-height:1.25; font-style:italic">Polo and racing on a frozen lake. A chalet above it.</div>
  <div class="rule" style="margin:30px auto 24px"></div>
  <div class="price">Villas from €7,000 a night</div>
  <div class="url" style="margin-top:14px">nqlgroup.com/destinations</div>
</div>
''')

# 3. Full-bleed artwork, one word, the rest small. (Festive, chalet)
STORIES["03-festive-chalet"] = page(f'''
<img src="art/chalet.png" style="position:absolute; inset:0; width:1080px; height:1920px; object-fit:cover">
<div style="position:absolute; inset:0; background:linear-gradient(to bottom, rgba(246,241,230,.0) 0%, rgba(246,241,230,.0) 55%, rgba(246,241,230,.92) 78%, #F6F1E6 100%)"></div>
<img class="mark" src="../../gallery/swirl-ink.png" style="top:150px">
<div style="position:absolute; top:220px; left:80px; right:80px; text-align:center">
  <div class="eyebrow">20 December to 5 January</div>
</div>
<div style="position:absolute; top:1390px; left:80px; right:80px; text-align:center">
  <div style="font-size:120px; line-height:1; letter-spacing:.04em">Où il neige.</div>
  <div class="small" style="margin-top:22px">Christmas where it snows. Courchevel, Gstaad, St. Moritz.<br>A few houses are still open for the festive weeks.</div>
  <div class="rule" style="margin:30px auto 24px"></div>
  <div class="price">Villas from €7,000 a night</div>
  <div class="url" style="margin-top:14px">nqlgroup.com/destinations</div>
</div>
''')

# 4. Retro magazine: car artwork, big stacked words, coverline. (Ski season)
STORIES["04-ski-season-red-car"] = page(f'''
<img src="art/car.png" style="position:absolute; inset:0; width:1080px; height:1920px; object-fit:cover">
<img class="mark" src="../../gallery/swirl-ink.png" style="top:150px">
<div style="position:absolute; top:220px; left:70px; right:70px; text-align:center">
  <div style="font-size:236px; line-height:.9; letter-spacing:.01em">Ski<br>Season</div>
  <div class="eyebrow" style="margin-top:36px; letter-spacing:.26em">Aspen · St. Moritz · Courchevel · Gstaad</div>
</div>
<div style="position:absolute; bottom:150px; left:80px; right:80px; text-align:center; background:rgba(246,241,230,.88); padding:36px 40px 40px">
  <div style="font-size:46px; line-height:1.2; font-style:italic">The house to come back to.</div>
  <div class="rule" style="margin:26px auto 22px"></div>
  <div class="price">Villas from €7,000 a night</div>
  <div class="url" style="margin-top:14px">nqlgroup.com/destinations</div>
</div>
''')

for name, src in STORIES.items():
    p = os.path.join(HERE, name + ".html"); open(p, "w").write(src)
    out = os.path.join(HERE, "out", name + ".png")
    r = subprocess.run(["osascript", "-l", "JavaScript", os.path.join(HERE, "render.js"), p, out, "1080", "1920"], capture_output=True, text=True)
    print(name, r.stdout.strip() or r.stderr.strip()[:200])
