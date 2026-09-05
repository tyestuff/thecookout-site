# The Cookout — Announcements + Calendar Page

Public page at **https://thecookout.us/calendar** (root redirects there). Static site on GitHub Pages, repo `tyestuff/thecookout-site`. No build step. Events come live from the public Google Calendar; announcements come from `announcements.json` in this repo.

## How to update announcements

The whole workflow is: edit `announcements.json`, commit, push, wait 1 to 2 minutes for GitHub Pages to redeploy.

**Add an announcement.** Add an object to the array in `announcements.json`:

```json
{
  "id": "2026-10-something-unique",
  "title": "Card headline",
  "posted": "2026-10-01",
  "expires": "2026-10-15",
  "body": "Short text. Line breaks with \\n. Plain URLs become links automatically.",
  "button": { "label": "Register", "url": "https://..." }
}
```

- `posted` controls sort order (newest first) and shows on the card.
- `expires` is optional. The card disappears on that date (it still shows ON the expires date, hides the day after has begun — technically it hides once `expires` < today in New York).
- `button` is optional. Leave it out for a card with no button.
- Never invent dates, names, or links. Use `[BRACKETED_PLACEHOLDERS]` and ask.

**Edit or remove:** change or delete the object, commit, push.

**Clear expired announcements:** delete every object whose `expires` date has passed, commit, push. (Expired ones are already hidden on the page; this is just housekeeping.)

Push commands:

```bash
cd "/Users/tyesstuff/Documents/Claude/Projects/The Cookout/thecookout-site"
git add -A && git commit -m "Update announcements" && git push
```

## How to update members

The member directory at `/members/` works exactly like announcements: edit `members.json`, commit, push, wait 1 to 2 minutes. Each entry:

```json
{
  "featured": true,
  "name": "Member Name",
  "role": "Real Estate Investor",
  "location": "City, ST",
  "phone": "555-555-5555",
  "email": "name@example.com",
  "website": "https://...",
  "details": "What they do, have, or need - in their words."
}
```

- Only `name` is required. A card shows only the fields present - members share what they want.
- `featured: true` puts the member in the Featured Members section (with a badge) AND in the full list.
- Never invent member info. Use `[BRACKETED_PLACEHOLDERS]` and ask.

## How to change event categories

Open `calendar/index.html` and find the `CATEGORIES` array near the top of the `<script>` block. Each category has a label, a CSS class, and a list of lowercase keywords matched against event titles. First match wins; no match shows "Other". Edit keywords there, push.

## API key

- The page reads the calendar with a Google Cloud API key in the `API_KEY` constant at the top of the `<script>` block in `calendar/index.html`.
- The key must be created at console.cloud.google.com under the `thecrew@thecookout.us` workspace, restricted to the **Google Calendar API** and to HTTP referrer **`thecookout.us/*`**. Because it is restricted, it is safe to commit.
- **To rotate:** create a new key in Google Cloud Console with the same restrictions, replace the `API_KEY` value, push, then delete the old key in the console.
- If the key is missing or the API call fails, the page automatically shows the Google Calendar embed instead, so it is never blank.

## Where events are managed

Calendar events are managed in **Google Calendar under `thecrew@thecookout.us`**, not in this repo. Add or change events there; the page picks them up automatically. Put the Zoom registration link in the event's location or description — the page turns it into the Register button.

## Hosting + domain

- GitHub Pages, `main` branch, root folder. `CNAME` file holds `thecookout.us`.
- GoDaddy DNS: four A records on `@` → GitHub Pages IPs (185.199.108/109/110/111.153) and a `www` CNAME → `tyestuff.github.io`.
