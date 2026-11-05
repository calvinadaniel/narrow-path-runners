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

## 2026-11-05 · New Run Club header for the marathon tracker

- **Changed:** the header on `/marathon` and `/marathon/replay` is redesigned: a full-width black band with the club logo, a very large "NYC Marathon" headline, the date in orange, and the real course drawn as a glowing orange line. The old white header with the three-color stripe is gone.
- **Added:** the course drawn by borough in a ribbon above the numbers (Staten Island, Brooklyn, Queens, Manhattan, the Bronx, Manhattan), sized by how much of the 26.2 miles each covers, with mile marks. Queens and the Bronx show as "QNS" and "BX" because their stretches are short.
- **Added:** three numbers under the ribbon: Finishers (the club's official 2026 marathon finishers, from the saved NYRR results), Miles (26.2) and Boroughs (5). There is no fastest time and no runner dots.
- **Added:** `lib/ribbon.ts` (works out the borough stretches from the course and the base map, and the course line), `getMarathonFinisherCount` in `lib/marathon.ts`, and the header's own styles in `components/MarathonHeader.module.css`.
- **Changed:** the header uses two new fonts, Barlow Condensed and Archivo, loaded through `next/font` and used only in the header. The rest of the site keeps Arial Black. Fonts are downloaded when the site is built, so the build needs internet access (Vercel has it).
- **After merging:** nothing to re-run. The Finishers number updates when you re-run `npm run import-nyrr all 2026`.

## 2026-11-04 · Fainter map background ([#8](https://github.com/calvinadaniel/narrow-path-runners/pull/8))

- **Changed:** the New York map behind the page is now at 12% opacity (it was 35%), so it reads as a very light watermark behind the text and cards.
- **After merging:** nothing to re-run.

## 2026-11-04 · Faded map of New York behind the page ([#7](https://github.com/calvinadaniel/narrow-path-runners/pull/7))

- **Added:** a faded map of New York as the page background, with dashed latitude and longitude lines every 0.05 degrees and degree labels (for example "40.70° N", "74.00° W"). It is fixed behind the content, fills the screen, and is about two-thirds transparent so the text and cards stay easy to read. Cards stay solid white.
- **Added:** `components/MapBackground.tsx`, plus `windowProjection` and `graticule` in `lib/basemap.ts`. It reuses the New York base map already in `content/nyc-basemap.json`, so no new data or map service is involved.
- **Changed:** the root layout (`app/layout.tsx`) draws the background, so it appears on every page, and the page content now sits above it. A few lines of CSS in `app/globals.css` choose which labels show, because a wide screen crops the top and bottom of the map and a tall one crops the sides.
- **After merging:** nothing to re-run. A wide screen shows the middle band of the map (roughly Brooklyn to midtown) rather than the whole city.

## 2026-11-04 · Race cards with each runner's other 2026 NYRR races ([#6](https://github.com/calvinadaniel/narrow-path-runners/pull/6))

- **Added:** each runner's card on `/marathon` (list view) now has an "Other 2026 NYRR races (N)" section that opens to show every other 2026 NYRR race they finished, newest first, with the date, race name, distance and finish time. Runners with none show "No other 2026 NYRR races on record". The marathon itself is left out, since the card already shows it.
- **Added:** `lib/raceHistory.ts` (gathers a runner's results for a year from the saved race files) and `components/RunnerRaces.tsx` (the race card section).
- **Changed:** refreshed the saved 2026 results from NYRR with `npm run import-nyrr all 2026`. This adds 10 races from August through October 2026 (for example the Staten Island Half and the 5th Ave Mile), the 2026 TCS NYC Marathon results (61 members), and one more Team Championship 5M finisher. Finish times in existing races did not change; overall places moved by one in a few races.
- **After merging:** nothing to re-run. To pick up races after this date, run `npm run import-nyrr all 2026` and redeploy. In 47 of the 62 members' cards the section lists races; the other 15 show no other 2026 races, which matches the results NYRR has.

## 2026-11-04 · Link to the race replay from the marathon page ([#5](https://github.com/calvinadaniel/narrow-path-runners/pull/5))

- **Added:** a "Watch the 12:30 to 1:00 pm race replay" link under the subtitle on `/marathon`.
- **Added:** a "Back to the tracker" link at the top of `/marathon/replay`, so the replay page is not a dead end now that the site has no navigation.
- **After merging:** nothing to re-run.

## 2026-11-03 · Race replay for 12:30-1:00 pm and a New York map behind the route ([#4](https://github.com/calvinadaniel/narrow-path-runners/pull/4))

- **Added:** a race replay page at `/marathon/replay` that plays back Nov 1, 12:30 to 1:00 pm EST from official split times. It has play/pause, restart, 30x, 60x and 120x speeds and a time slider, and the running/finished/not-started counts and the map update as the clock moves. Between two timing mats a runner is placed at an even pace, so dots glide along the route.
- **Added:** `npm run import-rtrt-replay` and `content/marathon-replay-2026.json` (every member's timing-mat crossings, 97 KB), plus `lib/replay.ts` for working out where a runner was at any moment.
- **Added:** a real New York behind the route on the map (live view and replay): water, the five boroughs with their names, Central Park, and the surrounding land (New Jersey, Long Island, Westchester). It is baked into `content/nyc-basemap.json` (71 KB) by `scripts/build-nyc-basemap.ts`, so the page calls no map service. Borough shapes are from the NYC Dept. of City Planning and the surrounding land from Census ZIP outlines; the map credits them.
- **Changed:** the map now shows the surroundings of the route, not just the route. The route is drawn as a dark line with a white edge. The "Brooklyn" and "The Bronx" landmark labels are replaced by borough names, and on wide screens the map is centered and sized to the screen height.
- **After merging:** nothing to re-run. The replay page is not linked from `/marathon`; open `/marathon/replay`. The Central Park outline is drawn by hand from its street corners. To rebuild the base map, see the header of `scripts/build-nyc-basemap.ts` for where to download the source files.

## 2026-11-03 · Require release notes in every PR ([#4](https://github.com/calvinadaniel/narrow-path-runners/pull/4))

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
