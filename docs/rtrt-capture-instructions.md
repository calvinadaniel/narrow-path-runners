# Task: Capture the RTRT API requests behind the NYC Marathon live tracker

I'm building a page for my run club, **Narrow Path Runners**, that tracks our
members in the TCS NYC Marathon (Sunday). The official live tracker is a web
app that loads its data from `api.rtrt.me`. I need the exact API requests it
makes so I can reproduce them in code. Please capture them and hand them back
to me in the format below.

This is read-only research on a public page. Do not log in, create an account,
submit forms, or change anything on the site.

## Page to open

https://liveresults.nyrr.org/e/NYRR-NY2026

(It embeds an app from `app.rtrt.me`. Event ID: `NYRR-NY2026`. App ID in the
embed URL: `4d7a9ceb0be65b3cc4948ee9`.)

## Steps

1. Open the page above in a **new tab**.
2. Start capturing network requests (use your network/request-reading tools, or
   dev tools Network tab filtered to Fetch/XHR). Reload the page so you catch
   the startup requests, including `publicconf`.
3. In the tracker UI, do each of these, one at a time, and note which requests
   fire after each action:
   - Open the **participants / runners / leaderboard** list, and scroll or page
     once so you see the pagination parameters.
   - **Search** for a runner by name (try the name "Calvin Daniel").
   - Look for any **team / club / group** filter. If there is one, filter by
     **Narrow Path Runners** (it may not exist or may return nothing).
   - Open one runner's **detail / profile** page and look at their splits or
     checkpoint times.
4. Only keep requests to `api.rtrt.me`. Ignore images, fonts, analytics, ads.

## What to give back

For **each distinct request type** (config, participant list, search, team
filter, runner profile, splits), give me:

1. **Method and full URL**, including the query string.
2. **Request body**, if it is a POST.
3. **Headers that matter**, only things like `Content-Type`, `Origin`, `Referer`.
   **Do not include** cookies, `Authorization`, or any session secret. If a
   token appears in the URL or body, replace it with `REDACTED_TOKEN` and tell
   me which parameter it was.
4. **A `curl` command** that reproduces it (same redaction rules).
5. **The first 2 to 3 items of the JSON response**, so I can see the field
   names. If the response is huge, trim it, but keep the real keys and one
   realistic value per key. Do not make up or alter any values.

Also tell me, in plain sentences:

- How the request is authenticated (an app ID plus a token in the query? a
  header? is the token a random ID the page generates itself, or something that
  needs a login?).
- How pagination works (page number, offset, `max`/`start`, or a cursor).
- Whether the list can be filtered by team/club, or whether I would have to
  match runners by name myself.
- Which fields identify a runner (bib, name, age group, wave, team) and which
  carry timing (start time, split names, checkpoint times, projected finish).
- Whether the page updates live while a race is running (periodic polling,
  WebSocket, or manual refresh), and roughly how often.

## Rules

- Don't guess or invent endpoints. If you can't find something, say so.
- Don't paste cookies, login tokens, or personal data about runners beyond
  what's visible on the public participant list.
- If the site blocks you, asks you to log in, or shows a CAPTCHA, stop and
  tell me instead of working around it.
- Format everything as one Markdown reply with a heading per request type, so I
  can paste it straight into my coding session.
