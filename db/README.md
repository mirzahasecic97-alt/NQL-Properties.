# Database

Every change to the database lives here as a file you run by hand in the
Supabase SQL editor. Each one is written to be safe to run twice.

## Order

Run these in order on a new project. On the live project most are already in,
and the **Control** tab in the CRM tells you which — it asks the database for
one thing per feature and names the file that adds whatever is missing.

| # | File | What it adds |
|---|------|--------------|
| 1 | `install.sql` | Everything at once, for a fresh project. Skip 2 to 6 if you run this. |
| 2 | `schema.sql` | Leads, notes, reminders, stages |
| 3 | `grants.sql` | Table privileges. Policies and grants are separate gates; both must be open. |
| 4 | `partners.sql` | Agencies, their people, the link to leads |
| 5 | `subscribers.sql` | The newsletter list, kept apart from the pipeline |
| 6 | `tasks.sql` | The task board |
| 7 | `deal-value.sql` | What a deal is expected to be worth |
| 8 | `lead-numbers.sql` | NQL-001 upward, and a trigger that keeps numbering |
| 9 | `lead-numbers-patch.sql` | Only if 8 has already been run |
| 10 | `partner-staff.sql` | Which of us looks after which agency |
| 11 | `presence.sql` | Who has the CRM open |
| 12 | `partner-portal.sql` | **The security boundary.** Agency accounts, the anonymised board, the consent trail. Replaces every `using (true)` policy. |
| 13 | `lead-match.sql` | Hot and Warm |
| 14 | `lead-info-score.sql` | Scores those on how much the buyer told us |
| 15 | `lead-match-bands.sql` | Adds the third band, Limited |
| 16 | `partner-countries.sql` | Restricts an agency to the countries it works in |
| 17 | `board-leads-only.sql` | Keeps messages and meeting requests off the agency board |
| 18 | `owner-role.sql` | Owner, admin, staff, and the Control panel's views |
| 19 | `retention.sql` | Deletes what the privacy policy promises to delete |

## Not migrations

These do a job rather than change the schema. Run them when you need them.

- `partner-account.sql` — give an agency a login
- `partner-test-account.sql` — a throwaway agency and lead for testing the portal
- `partners-seed.sql` — example agencies
- `roles.sql`, `roles-revert.sql`, `roles-sales-partners.sql` — the earlier
  admin and sales split, superseded by `partner-portal.sql` and `owner-role.sql`.
  Do not run these now; they restore `using (true)` policies that would undo
  the security boundary.

## Two things worth remembering

**Policies and grants are independent.** Row level security decides which rows,
`grant` decides whether the table can be touched at all. Opening one and not
the other gives a permission error that looks like the other problem.

**Postgres combines policies with OR.** A restrictive policy sitting beside a
`using (true)` one changes nothing. Replacing is the only thing that works,
which is why `partner-portal.sql` drops before it creates.
