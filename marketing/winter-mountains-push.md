# The winter push: the American mountains, Thanksgiving to February

Agreed 31 October 2026. One campaign for the next two weeks, everything
saying the same thing at the same time: private homes in Aspen, Vail,
Park City, Jackson Hole and the towns around them, from €10,000 a night,
with everything around the stay arranged by one person. Two audiences,
one message:

1. Wealthy people in the US, for themselves, their family or friends.
2. Companies anywhere, for an offsite or a January kick-off. A work trip
   is business, so this is the audience we may email in the Nordics and
   Switzerland too.

Everything lands on **nqlgroup.com/winter**, which has the eight towns,
the three windows (Thanksgiving, early December, January to February),
the company-trip block and a rental enquiry form that files into the
CRM Rentals list.

## The two weeks

| Date | What | Where |
|---|---|---|
| Mon 2 Nov | Post 1, First Tracks (Thanksgiving). Feed 4:5 + story 9:16. | Instagram, Facebook, LinkedIn |
| Mon 2 Nov | Story ads start, US only, First Tracks story + feed. | Meta Ads |
| Tue 3 Nov | Client Harvey campaign has been sending since 31 Oct; check replies daily. | Harvey, port 5556 |
| Thu 5 Nov | Post 2, January in the mountains (Ski Season red car). | Instagram, Facebook, LinkedIn |
| Mon 9 Nov | Post 3, Company trip to the mountains (Chalet). | LinkedIn first, then Instagram |
| Mon 9 Nov | Companies Harvey campaign starts (after discovery and Mirza's approval of the first emails). | Harvey, port 5557 |
| Thu 12 Nov | Reminder post for January weeks; swap ad creative to Ski Season. | Instagram, Meta Ads |
| Mon 16 Nov | Reminder post for company trips. | LinkedIn |
| Tue 10 Nov and Tue 24 Nov | Thanksgiving reminders (the calendar already has them). | Instagram story |

The CRM calendar shows these once `db/winter-push.sql` has been run; the
Thanksgiving row was already there.

## Captions

**Post 1, 2 Nov, First Tracks** (files `marketing/stories/out/01-aspen-first-tracks-feed.png` and `-story.png`)

> Thanksgiving week, 25 to 29 November. The season opens in Colorado and
> Utah, and the house to come back to is ours to find. Aspen, Vail, Park
> City. Villas from €10,000 a night, the chef, the cars and the guides
> arranged. Link in bio, or write to us.
>
> nqlgroup.com/winter

**Post 2, 5 Nov, January in the mountains** (files `04-ski-season-red-car-feed.png` and `-story.png`)

> The quiet weeks. January and February in Aspen, Vail, Park City,
> Jackson Hole: the same houses as the festive weeks, better prices, and
> the mountain to yourselves on a Tuesday. Villas from €10,000 a night.
>
> nqlgroup.com/winter

**Post 3, 9 Nov, Company trip** (file `03-festive-chalet-feed.png`; the chalet at dusk reads as a team house)

> Take the team somewhere they will talk about. One house for the whole
> company instead of a hotel, with the meeting room, the chef, the ski
> guides and the evenings arranged. January suits companies best. One
> call, one invoice, one person who answers.
>
> nqlgroup.com/winter

Rules that hold for every post: no capitals in the type, the price as
"Villas from €10,000 a night", never the partner's name, never a photo
we do not own (the watercolours are ours).

## Story ads, US only

Set up in Meta Ads Manager; nothing is connected to Claude, so this is
done by hand.

- **Objective**: Leads, with the website as the destination (the
  enquiry form on /winter). Not "engagement".
- **Audience**: United States only. Age 35 to 65+. Interests: Aspen
  Snowmass, Vail, Deer Valley, Jackson Hole, luxury travel, private
  aviation, Net-Jets, yachting, Four Seasons, Aman, Rosewood, Sotheby's
  International Realty. Exclude current employees and anyone who already
  enquired.
- **Placements**: Instagram Stories and Facebook Stories (9:16 files),
  Instagram Feed (4:5 files). Switch off Audience Network and Reels.
- **Creative, week 1**: First Tracks story and feed. **Week 2**: Ski
  Season red car. Headline on the ad: "Villas from €10,000 a night".
  Primary text: the matching caption, shorter. Call to action: Learn more.
- **Budget**: 40 USD a day for the first week, then double what works.
  Two ad sets (Stories, Feed), same audience, so the placements can be
  compared.
- **Landing page**: https://www.nqlgroup.com/winter?utm_source=meta&utm_medium=story&utm_campaign=winter-2026
  (the site keeps no pixels, so the UTM is only in the CRM's page_url).
- **Compliance**: housing ads on Meta fall under the special ad category
  for housing in the US. Short-term holiday rentals are not covered, but
  if Meta flags it, pick "Housing" and accept the narrower targeting
  rather than fight it.

## Harvey, third copy: companies

`~/harvey-companies`, cloned from the clients copy on 31 Oct 2026.
Dashboard on port 5557. The same mailbox as the other two, so run one
loop at a time.

- ICP: companies of 15 to 300 people in technology, private equity, law,
  consulting, agencies, architecture, shipping and energy, property,
  fintech, seafood; in Norway, Sweden, Denmark, Iceland, the Netherlands,
  Switzerland, the UK and the US. Titles: CEO, founder, COO, chief of
  staff, head of people, HR director, office manager, executive assistant,
  plus the Nordic titles.
- House style: "Hey {first_name}", "A short note about us.", one idea,
  American ski places only, January as the company month, open question
  at the end. Follow-ups link to /winter and the enquiry form.
- Postal address in the footer, risky addresses excluded, approval
  required, warm-up starts the day the first emails are approved.
- To start: `cd ~/harvey-companies && source .venv/bin/activate && harvey discover --provider serper`,
  then `harvey run` and the dashboard with `harvey dashboard --port 5557`.
- The CRM bridge already watches this copy: an agreed meeting lands on
  the CRM calendar as a Meeting request, purpose Rent.

## Postiz posts the two weeks for us

Chosen 1 November 2026. The Mac has no Docker and no public address, so
we use the hosted Postiz (Standard plan, 29 USD a month, 7-day trial,
public API included) rather than self-hosting it. Everything lives in
`marketing/postiz/`:

- `plan.json`: the eight slots above as posts (17 in all) with captions,
  local times (New York for the US audience, Oslo for the LinkedIn
  company posts) and the image for each.
- `schedule.py`: uploads each image once and creates the posts through
  the Postiz public API. Python 3 only, no packages.
- `uploads.json` and `scheduled.json` appear after the first run; they
  are the receipts, and `delete` reads them.

Set-up, once:

1. Sign up at platform.postiz.com, then Add channel: Instagram (the
   business account, through its Facebook Page), the Facebook Page, and
   LinkedIn (the company page if Postiz offers it, else the profile).
2. Settings, Developers, Your API key: copy it, then in Terminal
   `mkdir -p ~/.config/nql && printf 'POSTIZ_API_KEY=%s\n' "$(pbpaste)" > ~/.config/nql/postiz.env && chmod 600 ~/.config/nql/postiz.env`
   so the key never passes through chat.
3. `python3 marketing/postiz/schedule.py channels` shows what connected.
4. `python3 marketing/postiz/schedule.py schedule --dry-run`, then
   `schedule` (or `schedule --draft` to approve each one in the Postiz
   calendar first). Slots already in the past are skipped, so a late
   start only loses the posts whose day has gone; post those by hand.

Afterwards `list` shows November as Postiz sees it, with the platform's
error text on anything that failed, and `delete` removes what the script
made. Captions follow the rules above; stories carry no text.

## What is on hold until mid-January

Caribbean season, Festive 2027, St. Moritz, Carnival. They are in the
calendar and come back when the ski weeks are sold.
