# Story ads

Instagram stories, 1080 by 1920, in the brand's serif and colours. The first
set, 30 October 2026, is the ski season: four stories built from the
inspiration Mirza sent (editorial ski magazine, cream paper, big serif, a
watercolour or one quiet picture).

- `build.py` writes one HTML file per design and size and renders each
  with `render.js` (WebKit, run through `osascript -l JavaScript`) into
  `out/` at twice the posting size. Two sizes: `-story` (9:16, 1080 by
  1920) and `-feed` (4:5, 1080 by 1350, for feed ads). Downscale with
  `sips -z 1920 1080` or `sips -z 1350 1080` for posting.
- Every design is one centred stack: mark, date, headline, framed
  artwork, places, a line, the gold rule, price and address. No capitals
  in the type, Mirza's call on 30 Oct 2026.
- `art/` holds the artwork. These are generated illustrations, so there
  are no photo rights to clear and no partner imagery.
- Run: `python3 build.py` from this folder. Nothing to install.

Rules every story follows: the small swirl mark, the date or the window,
the places as written on the Destinations page, "Villas from €10,000 a
night", and the address nqlgroup.com/destinations. Never the partner's
name. Text stays clear of the top 220 and bottom 280 pixels, where
Instagram draws its own bars.

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
