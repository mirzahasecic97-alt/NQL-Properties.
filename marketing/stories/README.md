# Posts and stories

Instagram and LinkedIn posts in the brand's serif. Two sizes: `-feed`
(4:5, 1080 by 1350) and `-story` (9:16, 1080 by 1920), rendered at twice
the size into `out/`, with 1080-wide JPEGs for posting in `out/jpg/`
(Instagram takes JPEG only; Postiz posts from there, see
`marketing/postiz/`).

Minimal since 1 November 2026, on Mirza's word ("I need to have it
minimalistic", "I don't like this line" about the gold rule, "background
always white"): a white page, the watercolour in a frame, one headline,
one small letterspaced line, and "Villas from €10,000 a night ·
nqlgroup.com/winter" in tiny type at the foot. No mark, no eyebrow, no
rule, no sentence, no grain. The first design (30 October, cream paper
and the full stack) is kept as `build-v1-2026-10-30.py.txt`.

- `build.py` writes one HTML file per design and size and renders each
  with `render.js` (WebKit through `osascript -l JavaScript`). The
  renderer waits until every image and font reports loaded; before that
  it snapshotted on a timer and sometimes caught a half-decoded picture.
- `art/` holds the artwork: generated watercolours, no photo rights, no
  partner imagery.
- Run `python3 build.py` here, then the sips loop in
  `marketing/winter-mountains-push.md` for the JPEGs. Nothing to install.
- Stories keep text clear of the top 220 and bottom 280 pixels, where
  Instagram draws its own bars.

Places are the American ski towns only this winter (Aspen, Vail, Park
City, Jackson Hole); White Turf is on hold until January. No capitals in
the type. Never the partner's name.

## Captions for the first set

**01 First Tracks (Aspen, Vail, Park City)**
Thanksgiving week, 25 to 29 November. The season opens in Colorado and
Utah, and the house to come back to is ours to find. Villas from €10,000
a night. Link in bio, or write to us.
Link: https://www.nqlgroup.com/contact?about=rent&place=Aspen%2C%20Colorado

**02 White Turf (St. Moritz)**
Polo and racing on a frozen lake, every Sunday in February. A chalet
above it, with the lake in the window. Villas from €10,000 a night.
Link: https://www.nqlgroup.com/contact?about=rent&place=St.%20Moritz%2C%20Switzerland

**03 Où il neige (Courchevel, Gstaad, St. Moritz)**
Christmas where it snows. 20 December to 5 January. A few houses are
still open for the festive weeks. Villas from €10,000 a night.
Link: https://www.nqlgroup.com/contact?about=rent&place=Courchevel%2C%20France

**04 Ski Season (Aspen, St. Moritz, Courchevel, Gstaad)**
The house to come back to. Ski season, wherever you ski. Villas from
€10,000 a night.
Link: https://www.nqlgroup.com/destinations
