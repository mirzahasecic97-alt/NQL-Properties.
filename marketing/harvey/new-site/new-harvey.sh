#!/bin/zsh
# Make a Harvey copy for another website.
#
#   ./new-harvey.sh NAME https://www.example.com PORT
#
# NAME  short word, becomes the folder ~/harvey-NAME (e.g. partneri)
# URL   the website Harvey should learn from
# PORT  dashboard port; 5555-5557 are taken by the NQL copies, so 5558 up
#
# It copies the Harvey code from ~/harvey (with the NQL patches: signature
# under every email, follow-ups approved with the first email, 3-day gaps),
# gives the copy its own empty database and its own Python environment, keeps
# the API keys from the NQL .env but blanks the mailbox lines, resets the
# writer prompt to Harvey's original, and then tells you what to do next.
# Nothing is sent and nothing starts; you run `harvey train` yourself.
set -euo pipefail

NAME=${1:?usage: new-harvey.sh NAME URL PORT}
URL=${2:?usage: new-harvey.sh NAME URL PORT}
PORT=${3:?usage: new-harvey.sh NAME URL PORT}
SRC=$HOME/harvey
DEST=$HOME/harvey-$NAME
UV=$HOME/.local/bin/uv

[[ -d $SRC ]] || { echo "no $SRC: the NQL Harvey copy is the source"; exit 1 }
[[ -e $DEST ]] && { echo "$DEST already exists; pick another NAME or remove it first"; exit 1 }
[[ -x $UV ]] || { echo "uv not found at $UV"; exit 1 }

echo "copying code  $SRC -> $DEST"
rsync -a \
  --exclude .venv --exclude data --exclude '.git' --exclude '__pycache__' \
  --exclude '*.egg-info' --exclude '.env' \
  --exclude 'harvey.local.yaml' --exclude 'harvey.local.*.yaml' --exclude 'harvey.local.yaml.bak-*' \
  --exclude 'nql_bridge.py' --exclude 'com.nql.harvey-bridge.plist' \
  --exclude 'prompts/writer.md.bak-*' \
  "$SRC/" "$DEST/"
mkdir -p "$DEST/data"

# Harvey's own writer prompt, not the NQL house style.
cp "$DEST/prompts/writer.md.original" "$DEST/prompts/writer.md"

# The NQL harvey.yaml carries NQL's persona and product. Start the new copy
# from Harvey's shipped defaults instead; `harvey train` fills them in.
cp "$DEST/harvey.yaml.original" "$DEST/harvey.yaml"

# Keys (Serper, Reoon, Hunter, TrulyInbox...) are shared; the mailbox is not.
# The other website must send from a mailbox on its own domain.
sed -E 's/^((SMTP|IMAP)_(HOST|PORT|USERNAME|PASSWORD)=).*/\1/' "$SRC/.env" > "$DEST/.env"
chmod 600 "$DEST/.env"

echo "python environment"
( cd "$DEST" && "$UV" venv --python 3.13 .venv >/dev/null && "$UV" pip install --python .venv/bin/python -q -e . )

"$DEST/.venv/bin/python" -c "import harvey" && echo "harvey imports"

cat <<NEXT

Done: $DEST

Next, in order:
  1. Mailbox for this website, on its own domain (never info@nqlgroup.com):
       open $DEST/.env and fill SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD
       (IMAP_* can stay blank if they match). Set SPF, DKIM and DMARC on that domain first.
  2. Let Harvey read the site:
       cd $DEST && .venv/bin/harvey train $URL
     It writes harvey.local.yaml: persona, product, ICP, offer. Read it and correct it.
  3. In harvey.local.yaml, under compliance:, set postal_address, opt_out_line,
     signature (name, company, email, phone, website, one per line) and do_not_contact.
  4. Prompts: $DEST/prompts/writer.md is Harvey's original. Add a house style
     section for this business at the bottom (how you write, what you offer, the one
     question you end on), the way the NQL copy has one.
  5. Find companies, then look at them in the dashboard before anything is written:
       .venv/bin/harvey discover
       .venv/bin/harvey dashboard --port $PORT      # http://127.0.0.1:$PORT
  6. Only then:  .venv/bin/harvey run   (require_approval stays true; approve the first
     email of each sequence in the Outbox; the follow-ups go out on their own).

Rules that still apply: one Harvey copy sending per mailbox at a time, the Mac awake
while it runs (caffeinate -di), and the config is read when the loop starts, so after an
edit stop it (Ctrl+C) and run it again.
NEXT
