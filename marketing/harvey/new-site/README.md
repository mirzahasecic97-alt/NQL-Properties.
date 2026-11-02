# Harvey for another website

Harvey is the cold-email agent that runs on Mirza's Mac in three copies for
NQL (`~/harvey`, `~/harvey-clients`, `~/harvey-companies`). Each copy is a
full Harvey with its own database, config and prompts, so another website
gets a fourth copy, not a setting inside the NQL ones.

## One command

```bash
~/Downloads/NQL/marketing/harvey/new-site/new-harvey.sh NAME https://www.the-site.com 5558
```

`NAME` becomes the folder `~/harvey-NAME`. Ports 5555 to 5557 belong to the
NQL copies. The script copies the code with the NQL patches, makes an empty
database and a fresh Python 3.13 environment, keeps the shared API keys,
blanks the mailbox, resets the writer prompt, and prints the next steps.
It sends nothing and starts nothing.

## What you fill in afterwards

1. **A mailbox on that site's own domain.** Cold email from `info@nqlgroup.com`
   for another business would hurt both. Set SPF, DKIM and DMARC on the new
   domain, then put the SMTP details into `~/harvey-NAME/.env`.
2. **`harvey train URL`** reads the site and writes `harvey.local.yaml`
   (persona, product, pricing, ICP, offer). Read the file and correct what it
   guessed. It also decides who Harvey looks for, so the ICP lines matter most.
3. **`compliance:` in `harvey.local.yaml`**: postal address, opt-out line, the
   signature under every email (one line per line), and `do_not_contact` for
   existing customers and competitors.
4. **`prompts/writer.md`**: the script resets it to Harvey's original. Add a
   house style block at the end, like the NQL copy has: how you actually
   write, what the offer is in one sentence, which places or products are in
   season, the one soft question each email ends on. Keep Harvey's rules
   above it (no em dashes, one question, no links in email 1).
5. **`harvey discover`** finds companies; look at them in the dashboard
   (`harvey dashboard --port 5558`) before `harvey run` writes anything.
   `require_approval` stays true: the first email of every sequence waits in
   the Outbox for a click, the two follow-ups go out by themselves after it.

## Connecting it to that site

The NQL bridge (`~/harvey/nql_bridge.py`, every ten minutes under launchd)
posts an agreed meeting to the website's lead API so it appears in the CRM.
The list at the top of the file now carries one line per copy with the
endpoint to post to. Add the new copy there with that site's own endpoint,
or `None` to keep its meetings inside Harvey's Conversations tab. The
endpoint must accept a form post with first_name, last_name, email, phone,
message and the hidden fields the NQL one uses; if the other site has no
such endpoint yet, say so and it is a small Vercel function.

## Shared rules

- One copy sends per mailbox at a time. Two sites with two mailboxes can run
  side by side.
- Harvey only works while the Mac is awake: lid open, plugged in,
  `caffeinate -di` on sending days.
- The loop reads its config when it starts. After an edit: Ctrl+C, `harvey run`.
- Never paste a mailbox password or an API key into chat; they go into `.env`.
- Harvey's own README (`~/harvey/README.md`) covers every command and setting.
