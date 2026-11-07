#!/usr/bin/env python3
"""Landing pages for the ski and golf ads (7 Nov 2026).

Each page is the Abu Dhabi race weekend page's shell (nav, footer, consent
pixel) with its own first screen: the promise on the left, the enquiry form
on the right (first thing on a phone). The form posts to /api/lead as a
Rental enquiry, so leads land in the CRM's Rentals list with the place
(location_detail, "Place, Region" exactly as in data/destinations.txt), the
time (timeline), bedrooms and extras in their own columns.

  python3 marketing/landing/trip_pages.py      # writes ski.html, golf.html, f1.html

No middle dots anywhere (Mirza, 4 Nov 2026). Never the partner's name.
One page per trip (Mirza, 7 Nov 2026): ski, golf, f1. The older ski-alps,
ski-usa, golf-usa, golf-europe, race-weekend and abu-dhabi-race-weekend
pages redirect to these in vercel.json.
"""
import os, re, html

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SHELL = os.path.join(os.path.dirname(__file__), "shell.html")  # the Abu Dhabi page as it was, kept as the template

INP = "w-full bg-white border border-brand-ink/25 px-4 py-3.5 text-base text-brand-ink focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition placeholder-gray-400"
LAB = "block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2"

PAGES = {
    "ski": dict(
        title="Ski season",
        desc="Ski season with NQL Group: a private chalet in the best ski towns in America and Europe, with the chef, the jet and the table arranged by one contact. Limited availability.",
        hero="images/lp/ski.jpg",
        # Mirza 7 Nov: "a different photo that is clear": no grain, light shade.
        hero_opacity="opacity-100",
        hero_shade_lg="bg-gradient-to-r from-brand-ink/85 via-brand-ink/35 to-transparent",
        hero_style="background-position: 50% 70%",
        hero_pos_phone="50% 75%",
        eyebrow="USA and Europe",
        h1="Ski season.",
        intro="A private chalet in the best ski towns in America and Europe, with the chef, the jet and the table around it, arranged by one contact.",
        bullets=["Chalets with a chef, a spa and the slopes at the door",
                 "A private jet to the nearest airfield",
                 "Instructors, tables and transfers, if you want them"],
        interest="Ski season", subject="New ski season enquiry - NQL Group",
        form_h="Hold your weeks.", form_p="We will contact you within 24 hours with chalets and prices.",
        where_label="Where", any_value="Not sure yet, USA or Europe",
        places=[("Colorado", ["Aspen", "Vail", "Beaver Creek", "Telluride"]),
                ("Utah and Wyoming", ["Park City|Park City, Utah", "Jackson Hole|Jackson Hole, Wyoming"]),
                ("France", ["Courchevel", "Méribel|Meribel, France", "Val d'Isère|Val d'Isere, France", "Chamonix", "Megève|Megeve, France"]),
                ("Switzerland", ["St. Moritz", "Gstaad", "Verbier", "Zermatt"]),
                ("Austria", ["Kitzbühel|Kitzbuhel, Austria", "Lech|Lech am Arlberg, Austria"]),
                ("Italy", ["Cortina|Cortina d'Ampezzo, Italy"])],
        when=["Christmas, New Year", "January", "February", "March", "Easter", "Not sure yet"],
        extras=["Chef", "Private jet", "Ski instructor", "Transfers and cars", "Restaurant tables", "Spa and massage"],
        steps=[("Your chalet", "Ski-in, ski-out houses in the best ski towns in America and the Alps, chosen for the snow and the village around it."),
               ("Your way there", "A private jet to the nearest airfield, and a car waiting when you land."),
               ("One contact", "One person arranges all of it, answers within the hour and is there for you the whole stay.")],
        places_h="Where we have chalets",
        closing="The festive weeks and February go first.",
    ),
    "golf": dict(
        title="Golf season",
        desc="Golf season with NQL Group: a private villa by the course in America or Europe, with tee times, caddies and cars arranged by one contact. Limited availability.",
        hero="images/lp/golf-usa.jpg",
        eyebrow="USA and Europe",
        h1="Golf season.",
        intro="A private villa by the course in America or Europe, with the tee times, the caddies and the car arranged by one contact.",
        bullets=["Villas on the course or a short drive from it",
                 "Tee times at the clubs you want, with a caddie or a pro",
                 "A private jet, cars and tables, if you want them"],
        interest="Golf season", subject="New golf trip enquiry - NQL Group",
        form_h="Hold your tee times.", form_p="We will contact you within 24 hours with villas, courses and prices.",
        where_label="Where", any_value="Not sure yet, USA or Europe",
        places=[("California", ["Palm Springs", "San Diego"]),
                ("Arizona and Florida", ["Scottsdale|Scottsdale, Arizona", "Miami|Miami, Florida"]),
                ("Spain and Portugal", ["Marbella|Marbella, Spain", "Mallorca|Mallorca, Spain", "The Algarve|The Algarve, Portugal"]),
                ("France and Italy", ["Provence|Provence, France", "Cannes|Cannes, France", "Lake Como|Lake Como, Italy", "Sardinia|Sardinia, Italy"]),
                ("Switzerland", ["Crans-Montana"]),
                ("United Kingdom", ["Scotland|Scotland, United Kingdom"])],
        when=["This winter", "Spring", "Summer", "Autumn", "Not sure yet"],
        extras=["Tee times", "Caddie or golf pro", "Private jet", "Transfers and cars", "Chef", "Restaurant tables"],
        steps=[("Your villa", "On the course or a few minutes from it, in America or Europe, with room for the whole group."),
               ("Your tee times", "Booked at the clubs you choose, with caddies or a pro, and the clubs waiting for you."),
               ("One contact", "One person arranges all of it, answers within the hour and is there for you the whole trip.")],
        places_h="Where we arrange golf",
        closing="The best tee times go first.",
    ),
    "f1": dict(
        title="Race weekend in Abu Dhabi and Saudi Arabia",
        desc="Race weekend with NQL Group: Abu Dhabi and Saudi Arabian Grand Prix tickets, hospitality and a villa, hotel or superyacht for the stay, arranged by one contact. Limited availability.",
        hero="images/lp/abu-dhabi-race.jpg",
        eyebrow="Abu Dhabi and Saudi Arabia",
        h1="Race weekend.",
        intro="Grandstand or paddock, villa or superyacht. The tickets and the stay around them for the Abu Dhabi and Saudi Arabian Grands Prix, arranged by one contact.",
        bullets=["Grandstand, paddock and hospitality tickets",
                 "A villa, a hotel suite or a superyacht for the nights",
                 "Flights, transfers and tables, if you want them"],
        interest="Race weekend", subject="New race weekend enquiry - NQL Group",
        form_h="Hold your place.", form_p="We will contact you within 24 hours with options and prices.",
        where_label="Race", any_value="Not sure yet, Abu Dhabi or Saudi Arabia",
        places=[("United Arab Emirates", ["Abu Dhabi Grand Prix|Abu Dhabi, United Arab Emirates|Abu Dhabi, Yas Marina"]),
                ("Saudi Arabia", ["Saudi Arabian Grand Prix|Jeddah, Saudi Arabia|Jeddah, Corniche Circuit"])],
        when=["This season", "Next season", "Not sure yet"],
        beds=False,
        extras=["Tickets", "Hospitality", "Villa or hotel", "Superyacht", "Flights or private jet", "Transfers and tables"],
        steps=[("Your seats", "Grandstand for the view of the straight, paddock for the cars up close, or hospitality with the race below you."),
               ("Your stay", "A villa, a suite or a superyacht in the harbour, close enough to walk back after the race."),
               ("One contact", "One person arranges all of it, answers within the hour and is there for you all weekend.")],
        places_h="The races",
        closing="Places for race weekend go early.",
    ),
}


def option(region, entry):
    """'Name' -> value 'Name, Region'; 'Shown|Value' or 'Shown|Value|Column' for odd ones."""
    parts = entry.split("|")
    shown = parts[0]
    value = parts[1] if len(parts) > 1 else f"{shown}, {region}"
    col = parts[2] if len(parts) > 2 else shown
    return shown, value, col


def main_block(slug, p):
    e = html.escape
    opts = [f'<option value="{e(p["any_value"])}">Not sure yet, advise me</option>']
    cols = []
    for region, entries in p["places"]:
        opts.append(f'<optgroup label="{e(region)}">')
        names = []
        for ent in entries:
            shown, value, col = option(region, ent)
            opts.append(f'<option value="{e(value)}">{e(shown)}</option>')
            names.append(col)
        opts.append("</optgroup>")
        cols.append(f'<div><p class="text-[11px] uppercase tracking-luxeWide text-brand-gold">{e(region)}</p>'
                    f'<ul class="mt-4 space-y-2 font-serif text-xl">' + "".join(f"<li>{e(n)}</li>" for n in names) + "</ul></div>")
    chk = "".join(
        f'<label class="flex items-center gap-3 border border-brand-ink/15 px-4 py-3 cursor-pointer hover:border-brand-gold transition">'
        f'<input type="checkbox" name="extras" value="{e(x)}" class="w-4 h-4 accent-brand-ink" /><span class="text-sm text-brand-ink">{e(x)}</span></label>'
        for x in p["extras"])
    bullets = "".join(f'<li class="flex gap-3"><span class="text-brand-gold">—</span><span>{e(b)}</span></li>' for b in p["bullets"])
    steps = "".join(
        f'<div><p class="text-[11px] text-brand-gold font-bold">0{i}</p><h3 class="mt-3 font-serif text-2xl">{e(h)}</h3>'
        f'<p class="mt-3 text-sm text-gray-500 font-light leading-relaxed">{e(t)}</p></div>'
        for i, (h, t) in enumerate(p["steps"], 1))
    when = "".join(f"<option>{e(w)}</option>" for w in p["when"])
    beds = "".join(f"<option>{b}</option>" for b in ["2 to 3", "4 to 5", "6 to 7", "8 or more"])
    beds_field = (f'<div><label for="t-beds" class="{LAB}">Bedrooms</label><select id="t-beds" name="bedrooms" class="{INP}">{beds}</select></div>'
                  if p.get("beds", True) else
                  f'<div><label for="t-guests" class="{LAB}">How many of you</label><input id="t-guests" type="text" name="budget" placeholder="For example 2 adults" class="{INP}" /></div>')
    grid = "md:grid-cols-3" if len(cols) <= 3 else ("md:grid-cols-4" if len(cols) == 4 else "md:grid-cols-3 lg:grid-cols-4")
    return f'''    <!-- {e(p["title"])}: landing page for its ads, built by marketing/landing/trip_pages.py.
         Leads go to the CRM's Rentals list: enquiry_type Rental enquiry. -->
    <section class="relative bg-brand-ink text-white overflow-hidden">
      <!-- Phone: the photo on its own, clear, then the words on solid ink. -->
      <div class="lg:hidden relative h-[44vh] min-h-[260px] max-h-[420px]">
        <img src="{p["hero"]}" alt="" class="absolute inset-0 w-full h-full object-cover" style="object-position: {p.get("hero_pos_phone", "50% 50%")}" />
        <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-brand-ink"></div>
      </div>
      <!-- Computer: the photo behind, the words on a shade to the left. -->
      <div class="hidden lg:block absolute inset-0 bg-cover bg-center {p.get("hero_opacity", "opacity-60")}" style="background-image: url('{p["hero"]}');{p.get("hero_style", "")}"></div>
      <div class="hidden lg:block absolute inset-0 {p.get("hero_shade_lg", "bg-gradient-to-r from-brand-ink via-brand-ink/75 to-brand-ink/20")}"></div>
      <div class="relative max-w-6xl mx-auto px-6 -mt-6 lg:mt-0 pt-0 pb-14 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div class="text-center lg:text-left">
          <p class="text-[11px] uppercase tracking-luxeWide text-brand-gold">{e(p["eyebrow"])}</p>
          <h1 class="mt-5 text-5xl md:text-6xl font-serif leading-[1.05]">{p["h1"]}</h1>
          <p class="mt-5 text-base md:text-lg text-white/80 font-light leading-relaxed max-w-md mx-auto lg:mx-0">{e(p["intro"])}</p>
          <ul class="hidden lg:block mt-8 space-y-3 text-sm text-white/85 max-w-md mx-auto lg:mx-0 text-left">{bullets}</ul>
          <p class="mt-6 lg:mt-8 inline-block border border-brand-gold/60 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-brand-gold">Limited availability</p>
        </div>

        <form id="enquire" method="POST" action="/api/lead" class="bg-white text-brand-ink shadow-2xl shadow-black/40 p-6 md:p-8 space-y-5 scroll-mt-24">
          <input type="hidden" name="_form" value="mkjwkbzq" />
          <input type="hidden" name="_next" value="/success" />
          <input type="hidden" name="_subject" value="{e(p["subject"])}" />
          <input type="hidden" name="enquiry_type" value="Rental enquiry" />
          <input type="hidden" name="purpose" value="Rent" />
          <input type="hidden" name="project_interest" value="{e(p["interest"])}" />
          <input type="hidden" name="page_url" value="https://www.nqlgroup.com/{slug}" />
          <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="display:none !important" aria-hidden="true" />
          <div>
            <p class="text-[11px] uppercase tracking-luxeWide text-brand-gold">Enquire</p>
            <h2 class="mt-2 font-serif text-3xl leading-tight">{e(p["form_h"])}</h2>
            <p class="mt-2 text-sm text-gray-600">{e(p["form_p"])}</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label for="t-first" class="{LAB}">Name</label><input id="t-first" type="text" name="first_name" required autocomplete="given-name" class="{INP}" /></div>
            <div><label for="t-last" class="{LAB}">Surname</label><input id="t-last" type="text" name="last_name" autocomplete="family-name" class="{INP}" /></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label for="t-email" class="{LAB}">Email</label><input id="t-email" type="email" name="email" required autocomplete="email" class="{INP}" /></div>
            <div><label for="t-phone" class="{LAB}">Phone or WhatsApp</label><input id="t-phone" type="tel" name="phone" autocomplete="tel" class="{INP}" /></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label for="t-where" class="{LAB}">{e(p["where_label"])}</label><select id="t-where" name="location_detail" class="{INP}">{"".join(opts)}</select></div>
            <div><label for="t-when" class="{LAB}">When</label><select id="t-when" name="timeline" class="{INP}">{when}</select></div>
          </div>
          {beds_field}
          <fieldset>
            <legend class="{LAB}">What else should we arrange</legend>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">{chk}</div>
          </fieldset>
          <div><label for="t-msg" class="{LAB}">Anything else</label><textarea id="t-msg" name="message" rows="2" placeholder="Optional, for example dates or how many of you" class="{INP}"></textarea></div>
          <label class="flex items-start gap-3 text-xs text-gray-500 leading-relaxed">
            <input type="checkbox" name="privacy_agreement" value="yes" required class="mt-0.5 w-4 h-4 accent-brand-ink" />
            <span>I agree that NQL Group keeps my details to answer this enquiry. See our <a href="privacy.html" class="underline underline-offset-4 hover:text-brand-ink">privacy policy</a>.</span>
          </label>
          <button type="submit" class="w-full inline-flex items-center justify-center px-10 py-5 bg-brand-gold text-white text-xs font-bold uppercase tracking-[0.3em] hover:bg-brand-ink transition duration-500">Send enquiry</button>
          <p class="text-center text-sm text-brand-ink">We will contact you within 24 hours.</p>
        </form>
      </div>
    </section>

    <section class="bg-white border-b border-brand-stone/50">
      <div class="max-w-6xl mx-auto px-6 py-16 md:py-20 grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">{steps}</div>
    </section>

    <section class="bg-white">
      <div class="max-w-6xl mx-auto px-6 py-16 md:py-20">
        <h2 class="font-serif text-3xl md:text-4xl leading-tight text-center md:text-left">{e(p["places_h"])}</h2>
        <div class="mt-10 grid grid-cols-2 {grid} gap-10 text-center md:text-left">{"".join(cols)}</div>
      </div>
    </section>

    <section class="bg-brand-cream/60">
      <div class="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 class="font-serif text-3xl md:text-4xl leading-tight">{e(p["closing"])}</h2>
        <a href="#enquire" class="inline-flex items-center justify-center mt-8 px-10 py-4 bg-brand-gold text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-brand-ink transition duration-500">Enquire now</a>
      </div>
    </section>

'''


def build(slug, p):
    s = open(SHELL).read()
    start = s.index("    <!-- Referral programme: the ad")
    end = s.index("    <footer ")
    out = s[:start] + main_block(slug, p) + s[end:]
    old_desc = re.search(r'<meta name="description" content="([^"]*)"', s).group(1)
    out = out.replace(old_desc, html.escape(p["desc"], quote=True))
    out = out.replace("Abu Dhabi race weekend | NQL Group", f'{p["title"]} | NQL Group')
    out = out.replace("https://www.nqlgroup.com/abu-dhabi-race-weekend", f"https://www.nqlgroup.com/{slug}")
    out = out.replace("images/lp/abu-dhabi-race-og.jpg", p["hero"].replace(".jpg", "-og.jpg"))
    body = out[out.index("<body"):]
    assert "·" not in body.split("<footer")[0], f"{slug}: middle dot in the page"
    if slug != "f1":
        assert not re.search(r"Abu Dhabi|Yas Marina", out.split("<footer")[0]), f"{slug}: Abu Dhabi text left"
    open(os.path.join(ROOT, f"{slug}.html"), "w").write(out)
    print("wrote", slug + ".html")


if __name__ == "__main__":
    for slug, p in PAGES.items():
        build(slug, p)
