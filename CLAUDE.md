# CLAUDE.md — thecookout-site

Public announcements + calendar page for The Cookout, a real estate investing community. Live at https://thecookout.us/calendar (root redirects to /calendar). GitHub Pages from `tyestuff/thecookout-site`, main branch, root folder. Static: one page at `calendar/index.html` with inline CSS and vanilla JS, no build step, no dependencies. Keep it under 500 lines. Simple beats clever.

## Hard rule

**Never invent dates, names, or links.** Use `[BRACKETED_PLACEHOLDERS]` and ask Ms. Tye. Real event data comes only from the Google Calendar; real links only from her.

## The two data sources

1. **Events:** the public Google Calendar under `thecrew@thecookout.us` (ID in `calendar/index.html`). Managed in Google Calendar, never in this repo. Page fetches it via Calendar API v3 with the `API_KEY` constant; falls back to the embed iframe if the call fails.
2. **Announcements:** `announcements.json` in the repo root. Update workflow = edit JSON, commit, push, wait 1–2 min. Format:

```json
{
  "id": "unique-slug",
  "title": "Card headline",
  "posted": "YYYY-MM-DD",
  "expires": "YYYY-MM-DD",
  "body": "Short text. \\n for line breaks. Plain URLs autolink.",
  "button": { "label": "Register", "url": "https://..." }
}
```

`expires` and `button` optional. Newest `posted` first. Cards hide when `expires` has passed (America/New_York).

## Brand

- Colors: Gold `#E9A93C`, Gold deep `#D9912A`, Gold soft `#F3D08A`, Brown `#3A2114`, Brown deep `#2A170C`, Cream `#FBF3E2`.
- Cream background, brown text, gold buttons/tags/heading accents. Community flyer feel, not corporate. Big readable type. Mobile first. System font stack only.
- Copy voice: warm, direct, plain language. Short sentences. No em dashes.
- Logo is `cookout-logo.jpeg` in repo root. Use it, never redraw it.
- Tagline: "If it's making money, bring it to The Cookout." Footer: "Let's eat."

## Common asks

- "Add an announcement about X" → edit `announcements.json` per README, push.
- "Clear expired announcements" → delete objects with past `expires`, push.
- "Change event categories" → `CATEGORIES` array at top of the script in `calendar/index.html`.
- API key rotation → see README. Key is referrer-restricted to `thecookout.us/*`, safe to commit.
