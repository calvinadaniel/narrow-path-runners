# Release notes

One entry per pull request, newest first. Every PR adds its entry in the same PR (see "Release notes" in `AGENTS.md`).

Format:

```
## YYYY-MM-DD · Short title ([#N](pull request link))

- **Added:** new behavior or files
- **Changed:** existing behavior that now works differently
- **Fixed:** bugs fixed
- **After merging:** imports to re-run, redeploys, environment variables (leave out if none)
```

Leave out any line that doesn't apply. Add the PR link once the PR has a number.

---

## 2026-11-03 · Race replay for 12:30-1:00 pm and a New York map behind the route

- **Added:** a race replay page at `/marathon/replay` that plays back Nov 1, 12:30 to 1:00 pm EST from official split times. It has play/pause, restart, 30x, 60x and 120x speeds and a time slider, and the running/finished/not-started counts and the map update as the clock moves. Between two timing mats a runner is placed at an even pace, so dots glide along the route.
- **Added:** `npm run import-rtrt-replay` and `content/marathon-replay-2026.json` (every member's timing-mat crossings, 97 KB), plus `lib/replay.ts` for working out where a runner was at any moment.
- **Added:** a real New York behind the route on the map (live view and replay): water, the five boroughs with their names, Central Park, and the surrounding land (New Jersey, Long Island, Westchester). It is baked into `content/nyc-basemap.json` (71 KB) by `scripts/build-nyc-basemap.ts`, so the page calls no map service. Borough shapes are from the NYC Dept. of City Planning and the surrounding land from Census ZIP outlines; the map credits them.
- **Changed:** the map now shows the surroundings of the route, not just the route. The route is drawn as a dark line with a white edge. The "Brooklyn" and "The Bronx" landmark labels are replaced by borough names, and on wide screens the map is centered and sized to the screen height.
- **After merging:** nothing to re-run. The replay page is not linked from `/marathon`; open `/marathon/replay`. The Central Park outline is drawn by hand from its street corners. To rebuild the base map, see the header of `scripts/build-nyc-basemap.ts` for where to download the source files.

## 2026-11-03 · Require release notes in every PR

- **Added:** this file, a "Release notes" rule in `AGENTS.md`, and a pull request template (`.github/pull_request_template.md`) with a "Release notes" section.
- **After merging:** nothing to deploy; no application code changed.

## 2026-11-03 · SVG course map with a List | Map toggle ([#3](https://github.com/calvinadaniel/narrow-path-runners/pull/3))

- **Added:** a map view of the marathon course on `/marathon`, shown with a List | Map toggle above the filter buttons. Runners appear as dots (on course, finished, not started) along the route; runners at the same spot merge into one badge with a count, and tapping a dot lists who is there. Zoom buttons, drag-to-pan and pinch-to-zoom work once zoomed in.
- **Added:** `content/marathon-course.json` (route line and timing points from RTRT), `npm run import-rtrt-course` to refresh it, `lib/course.ts` (distance to position, projection, clustering) and `components/MarathonMap.tsx`. The map uses no map library or tile service.
- **Changed:** the existing status filters now apply to both the list and the map. The toggle is hidden when no course data is present.
- **Notes:** positions are estimates between timing mats, not GPS. With the race over, the map shows finished runners at the finish line.

## 2026-10-29 · Branded header on the marathon page ([#2](https://github.com/calvinadaniel/narrow-path-runners/pull/2))

- **Added:** `components/MarathonHeader.tsx`: the Narrow Path Runners logo on a white bar with "TCS NYC Marathon", "Runner Tracker" and "Sunday, Nov 1" labels in the brand colors, above the red, green and orange stripe. The logo is not a link.
- **Changed:** the page title under the header now reads "Narrow Path Runners".

## 2026-10-29 · NYC Marathon live tracker ([#1](https://github.com/calvinadaniel/narrow-path-runners/pull/1))

- **Added:** the `/marathon` page with one card per member showing checkpoint, net time, average pace, projected finish and the next checkpoint estimate, polling every 30 seconds. It has a summary strip and filters (All, On course, Finished, Not started).
- **Added:** `/api/marathon`, which shares one RTRT call between all viewers (25-second memory cache and CDN caching) and serves the last good data if RTRT fails.
- **Added:** `lib/rtrt.ts`, a client for the RTRT API behind the official tracker. It registers its own uppercase hex token through `publicconf` and retries once if the token is rejected.
- **Added:** `npm run import-rtrt-roster`, which scans the whole field for runners whose team is "Narrow Path Runners", and `content/marathon-2026.json` with the 62 members found.
- **Changed:** the site is now just the tracker: the navigation bar and footer are removed, `/` redirects to `/marathon`, and runner names no longer link to profile pages.
- **After merging:** the roster is read at build time, so re-run the roster import and redeploy to pick up new members.
