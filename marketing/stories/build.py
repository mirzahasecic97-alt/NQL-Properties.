# Builds every post in two sizes, 9:16 for stories and 4:5 for feed, and
# renders them with render.js (WebKit through osascript). Minimal since
# 1 Nov 2026, on Mirza's word: white page, a smallish picture in a frame,
# one headline, the places with commas (no dots), the window on its own
# line, and the price with the address in tiny type at the foot. No mark,
# no eyebrow, no rule, no sentence. The pictures are the ones Mirza sent
# on 30 Oct 2026 (art/sent-*), cropped below their printed titles and
# given a light retro film treatment in CSS.
import subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__))
FORMATS = {"story": (1080, 1920), "feed": (1080, 1350)}

# name: art file, object-position, headline, places, when, feed frame (w, h)
POSTS = {
    # 2 Nov 2026, Mirza sent eight pictures: "Use the ski for ski, and Golf for
    # golf trips in usa". Frames follow each picture's own proportions.
    "ski-01-jet-coat":        ("ski-jet-coat.jpg",       "50% 50%", "Ski Season",  "Aspen, Vail, Park City, Jackson Hole", "", (560, 700)),
    "ski-02-jet-gwagon":      ("ski-jet-gwagon.jpg",     "50% 50%", "Ski Season",  "Aspen, Vail, Park City, Jackson Hole", "", (560, 695)),
    "ski-03-jets-fur":        ("ski-jets-fur.jpg",       "50% 50%", "Ski Season",  "Aspen, Vail, Park City, Jackson Hole", "", (580, 693)),
    "ski-04-champagne-run":   ("ski-champagne-run.jpg",  "50% 50%", "Ski Season",  "Aspen, Vail, Park City, Jackson Hole", "", (440, 689)),
    "ski-05-yellow-porsche":  ("ski-yellow-porsche.jpg", "50% 50%", "Ski Season",  "Aspen, Vail, Park City, Jackson Hole", "", (520, 693)),
    "golf-01-practice-tee":   ("golf-practice-tee.jpg",  "50% 50%", "Golf Season", "Palm Springs, Santa Barbara, Miami, The Hamptons", "", (560, 693)),
    "golf-02-porsche-palm":   ("golf-porsche-palm.jpg",  "50% 50%", "Golf Season", "Palm Springs, Santa Barbara, Miami, The Hamptons", "", (560, 695)),
    "golf-03-porsche-polo":   ("golf-porsche-polo.jpg",  "50% 50%", "Golf Season", "Palm Springs, Santa Barbara, Miami, The Hamptons", "", (460, 690)),
}

def css(w, h, k):
    return f'''
@font-face {{ font-family: "Seasons"; src: url("../../fonts/TheSeasons-Regular.woff2") format("woff2"); font-weight: 400; }}
@font-face {{ font-family: "Seasons"; src: url("../../fonts/TheSeasons-Light.woff2") format("woff2"); font-weight: 300; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ width: {w}px; height: {h}px; overflow: hidden; }}
body {{ background: #FFFFFF; color: #4A433B; font-family: "Seasons", Georgia, serif; position: relative; -webkit-font-smoothing: antialiased; }}
.art {{ position:absolute; overflow:hidden; background:#F2F2F2; }}
.art img {{ width:100%; height:100%; object-fit:cover; display:block; filter: sepia(.22) saturate(.9) contrast(.94) brightness(1.03); }}
.art::after {{ content:""; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(70,50,30,.14) 100%), linear-gradient(rgba(255,238,205,.10), rgba(255,238,205,.10)); }}
.text {{ position:absolute; left: 90px; right: 90px; text-align:center; }}
.h {{ font-size: {int(118*k)}px; line-height: 1.02; letter-spacing: .01em; font-weight: 300; }}
.line {{ font-size: {int(26*k)}px; letter-spacing: .14em; color: #8A8176; margin-top: {int(26*k)}px; }}
.when {{ font-size: {int(26*k)}px; letter-spacing: .14em; color: #8A8176; margin-top: {int(10*k)}px; }}
.foot {{ position:absolute; left:0; right:0; text-align:center; font-size: {int(21*k)}px; letter-spacing: .12em; color: #8A8176; font-weight: 300; }}
'''
def page(style, body):
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{style}</style></head><body>{body}</body></html>'

def stories(fmt):
    w, h = FORMATS[fmt]; story = fmt == "story"
    k = 1.0 if story else 0.82
    scale = 1.12 if story else 1.0            # frames a touch larger on the tall story
    safe_top, safe_bottom = (260, 300) if story else (80, 80)   # stories keep clear of Instagram's bars
    foot_bottom = safe_bottom - int(24*k)
    gap = int(150*k)                           # between frame and headline
    S = css(w, h, k)
    out = {}
    for name, (art_file, pos, head, line, when, (fw, fh)) in POSTS.items():
        fw, fh = int(fw*scale), int(fh*scale)
        text_h = int(118*k*1.02) + int(26*k) + int(26*k*1.4) + (int(10*k) + int(26*k*1.4) if when else 0)
        total = fh + gap + text_h
        top = max(safe_top, (h - safe_bottom - safe_top - total) // 2 + safe_top - int(20*k))
        when_html = f'<div class="when">{when}</div>' if when else ''
        out[name] = page(S, f'''
<div class="art" style="left:{(w-fw)//2}px; top:{top}px; width:{fw}px; height:{fh}px"><img src="art/{art_file}" style="object-position:{pos}"></div>
<div class="text" style="top:{top+fh+gap}px"><div class="h">{head}</div><div class="line">{line}</div>{when_html}</div>
<div class="foot" style="bottom:{foot_bottom}px">Villas from €10,000 a night &nbsp;·&nbsp; nqlgroup.com/destinations</div>''')
    return out

os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
for fmt, (w, h) in FORMATS.items():
    for name, src in stories(fmt).items():
        p = os.path.join(HERE, f"{name}-{fmt}.html"); open(p, "w").write(src)
        o = os.path.join(HERE, "out", f"{name}-{fmt}.png")
        r = subprocess.run(["osascript", "-l", "JavaScript", os.path.join(HERE, "render.js"), p, o, str(w), str(h)], capture_output=True, text=True)
        print(name, fmt, r.stdout.strip() or r.stderr.strip()[:160])
