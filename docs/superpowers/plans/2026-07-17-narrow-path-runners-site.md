# Narrow Path Runners Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js site for the Narrow Path Runners club that showcases race results, photo galleries, and member profiles for the club's existing members, maintained by a single person editing content files directly.

**Architecture:** Next.js (App Router, TypeScript) with content stored as JSON (race data) and MDX (runner bios, about page) files in the repo, read at build time via small `lib/*.ts` data-access functions — no database, no auth, no CMS. Races are the central data entity: each race carries its own results and photos. Runner profile pages are computed automatically by aggregating every race a runner appears in, merged with an optional hand-written bio. Photos are hosted on Vercel Blob and referenced by URL from the JSON/data files. Deployed to Vercel on the default `*.vercel.app` subdomain (no custom domain yet).

**Tech Stack:** Next.js 15 (App Router) + TypeScript, Tailwind CSS, `gray-matter` (MDX frontmatter), `next-mdx-remote` (MDX rendering), `@vercel/blob` (photo storage), Vitest + React Testing Library (tests), deployed on Vercel.

## Global Constraints

- Solo maintainer, file-based content editing only — no admin UI, no authentication, no database, no CMS.
- No custom domain — ship on the default Vercel `*.vercel.app` subdomain.
- Photos are hosted on Vercel Blob only; no other image host or third-party CDN.
- Races are the single source of truth for results — runner profile data is computed from race files, never hand-duplicated.
- Don't add a dependency where a few lines of code or an existing dependency already covers it (YAGNI).
- Use plain `<img>` tags (not `next/image`) for Blob-hosted photos to avoid `next.config.ts` remote-pattern configuration — this is a deliberate simplification (see Task 9 note); revisit if page weight/performance becomes a real problem.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.env.example`
- Create: `tailwind.config.ts` (or Tailwind v4 CSS-based theme — see Step 4 note)
- Create: `app/layout.tsx`, `app/globals.css`
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Create: `content/` directory (empty, populated starting Task 2)

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `start`, `lint`, `test` (`vitest run`); path alias `@/*` → repo root; Tailwind theme colors `brand-forest` (`#2F4F3E`), `brand-terracotta` (`#C1622D`), `brand-cream` (`#FBF4E9`) available as Tailwind classes (e.g. `bg-brand-forest`, `text-brand-terracotta`).

- [ ] **Step 1: Scaffold the Next.js app**

The repo currently contains only an empty `generated-images/` folder, so `create-next-app` should be able to target it directly. If it refuses because the directory isn't empty, delete the empty `generated-images` folder first (it has no content) and re-run.

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

Expected: a working Next.js app scaffolded into the current directory (`app/`, `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `tailwind.config.ts` or `postcss.config.mjs` + CSS-based Tailwind theme, depending on the Tailwind version it installs).

- [ ] **Step 2: Install additional dependencies**

Run:
```bash
npm install gray-matter next-mdx-remote @vercel/blob
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom tsx
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Create `vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add a `test` script to `package.json`'s `"scripts"` block:
```json
"test": "vitest run"
```

- [ ] **Step 4: Add brand theme colors**

If `create-next-app` generated `tailwind.config.ts` (Tailwind v3-style), edit it to add the brand colors:
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx,mdx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          forest: "#2F4F3E",
          terracotta: "#C1622D",
          cream: "#FBF4E9",
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

If instead it generated a CSS-based theme (Tailwind v4 default, no `tailwind.config.ts`), add the same colors to the `@theme` block in `app/globals.css`:
```css
@theme {
  --color-brand-forest: #2F4F3E;
  --color-brand-terracotta: #C1622D;
  --color-brand-cream: #FBF4E9;
}
```

These are placeholder values in the club's warm-community palette — swap them for the club's actual logo colors once available; every component in this plan references them only by name (`brand-forest`, `brand-terracotta`, `brand-cream`), so updating the three hex values here is the only change needed later.

- [ ] **Step 5: Create the content directory and env template**

Run:
```bash
mkdir -p content
```

Create `.env.example`:
```
BLOB_READ_WRITE_TOKEN=
```

Confirm `.gitignore` includes `.env*.local` (added by default by `create-next-app`).

- [ ] **Step 6: Verify the scaffold builds and tests run**

Run:
```bash
npm run build
npm run test
```

Expected: `npm run build` completes successfully; `npm run test` exits 0 (no test files yet, `passWithNoTests: true` allows this).

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, Vitest, and brand theme"
```

---

### Task 2: Race Data Layer

**Files:**
- Create: `lib/types.ts`
- Create: `lib/races.ts`
- Test: `lib/races.test.ts`
- Create: `content/races/2026-06-14-summit-trail-5k.json`
- Create: `content/races/2026-07-04-firecracker-10k.json`

**Interfaces:**
- Consumes: nothing (first data-layer task)
- Produces: types `Race`, `RaceResult`, `RacePhoto`, `RunnerBio`, `RunnerRaceEntry`, `RunnerProfile` (from `lib/types.ts`); functions `getAllRaces(): Race[]` (sorted by `date` descending) and `getRaceById(id: string): Race | undefined` (from `lib/races.ts`)

- [ ] **Step 1: Write the failing test**

Create `lib/races.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getAllRaces, getRaceById } from "./races";

describe("getAllRaces", () => {
  it("returns races sorted by date descending", () => {
    const races = getAllRaces();
    expect(races.length).toBeGreaterThanOrEqual(2);
    expect(races[0].id).toBe("2026-07-04-firecracker-10k");
    expect(races[1].id).toBe("2026-06-14-summit-trail-5k");
  });
});

describe("getRaceById", () => {
  it("returns the matching race", () => {
    const race = getRaceById("2026-06-14-summit-trail-5k");
    expect(race?.name).toBe("Summit Trail 5K");
  });

  it("returns undefined for an unknown id", () => {
    expect(getRaceById("does-not-exist")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/races.test.ts`
Expected: FAIL — `lib/races.ts` does not exist (module not found).

- [ ] **Step 3: Create types, seed race data, and the implementation**

Create `lib/types.ts`:
```ts
export interface RaceResult {
  runnerId: string;
  runnerName: string;
  time: string;
  placement: number | null;
  personalRecord?: boolean;
}

export interface RacePhoto {
  url: string;
  caption?: string;
}

export interface Race {
  id: string;
  name: string;
  date: string;
  location: string;
  distance: string;
  results: RaceResult[];
  photos: RacePhoto[];
}

export interface RunnerBio {
  id: string;
  name: string;
  photo?: string;
  bio: string;
}

export interface RunnerRaceEntry {
  race: Race;
  result: RaceResult;
}

export interface RunnerProfile {
  id: string;
  name: string;
  photo?: string;
  bio?: string;
  races: RunnerRaceEntry[];
}
```

Create `content/races/2026-06-14-summit-trail-5k.json`:
```json
{
  "id": "2026-06-14-summit-trail-5k",
  "name": "Summit Trail 5K",
  "date": "2026-06-14",
  "location": "Summit Ridge Park",
  "distance": "5K",
  "results": [
    { "runnerId": "jane-doe", "runnerName": "Jane Doe", "time": "22:14", "placement": 1, "personalRecord": true },
    { "runnerId": "sam-lee", "runnerName": "Sam Lee", "time": "24:02", "placement": 2 }
  ],
  "photos": []
}
```

Create `content/races/2026-07-04-firecracker-10k.json`:
```json
{
  "id": "2026-07-04-firecracker-10k",
  "name": "Firecracker 10K",
  "date": "2026-07-04",
  "location": "Downtown Riverwalk",
  "distance": "10K",
  "results": [
    { "runnerId": "jane-doe", "runnerName": "Jane Doe", "time": "47:30", "placement": 3 },
    { "runnerId": "sam-lee", "runnerName": "Sam Lee", "time": "50:11", "placement": 5, "personalRecord": true }
  ],
  "photos": []
}
```

Create `lib/races.ts`:
```ts
import fs from "fs";
import path from "path";
import type { Race } from "./types";

const RACES_DIR = path.join(process.cwd(), "content", "races");

export function getAllRaces(): Race[] {
  const files = fs.readdirSync(RACES_DIR).filter((f) => f.endsWith(".json"));
  const races = files.map((file) => {
    const raw = fs.readFileSync(path.join(RACES_DIR, file), "utf-8");
    return JSON.parse(raw) as Race;
  });
  return races.sort((a, b) => b.date.localeCompare(a.date));
}

export function getRaceById(id: string): Race | undefined {
  return getAllRaces().find((race) => race.id === id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/races.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/races.ts lib/races.test.ts content/races
git commit -m "feat: add race data layer with seed race data"
```

---

### Task 3: Runner Aggregation Layer

**Files:**
- Create: `lib/runners.ts`
- Test: `lib/runners.test.ts`
- Create: `content/runners/jane-doe.mdx`

**Interfaces:**
- Consumes: `getAllRaces(): Race[]` (from Task 2's `lib/races.ts`); types `Race`, `RaceResult`, `RunnerBio`, `RunnerProfile` (from `lib/types.ts`)
- Produces: functions `getAllRunnerBios(): RunnerBio[]`, `getRunnerBio(id: string): RunnerBio | undefined`, `getAllRunnerProfiles(): RunnerProfile[]` (sorted by `name`), `getRunnerProfile(id: string): RunnerProfile | undefined` (from `lib/runners.ts`)

- [ ] **Step 1: Write the failing test**

Create `lib/runners.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getAllRunnerProfiles, getRunnerProfile } from "./runners";

describe("getAllRunnerProfiles", () => {
  it("merges a runner's bio with their aggregated race results", () => {
    const profiles = getAllRunnerProfiles();
    const jane = profiles.find((p) => p.id === "jane-doe");
    expect(jane?.bio).toContain("Narrow Path Runners");
    expect(jane?.races.length).toBe(2);
  });

  it("includes runners who have results but no bio file", () => {
    const profiles = getAllRunnerProfiles();
    const sam = profiles.find((p) => p.id === "sam-lee");
    expect(sam?.name).toBe("Sam Lee");
    expect(sam?.bio).toBeUndefined();
    expect(sam?.races.length).toBe(2);
  });
});

describe("getRunnerProfile", () => {
  it("returns undefined for an unknown runner", () => {
    expect(getRunnerProfile("nobody")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/runners.test.ts`
Expected: FAIL — `lib/runners.ts` does not exist.

- [ ] **Step 3: Create seed bio and the implementation**

Create `content/runners/jane-doe.mdx`:
```mdx
---
id: jane-doe
name: Jane Doe
photo: /runners/jane-doe.jpg
---

Jane joined Narrow Path Runners in 2023 and has been chasing trail PRs ever since. When she's not running, she's probably planning the next group run route.
```

Create `lib/runners.ts`:
```ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getAllRaces } from "./races";
import type { RunnerBio, RunnerProfile } from "./types";

const RUNNERS_DIR = path.join(process.cwd(), "content", "runners");

export function getAllRunnerBios(): RunnerBio[] {
  if (!fs.existsSync(RUNNERS_DIR)) return [];
  const files = fs.readdirSync(RUNNERS_DIR).filter((f) => f.endsWith(".mdx"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(RUNNERS_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      id: data.id as string,
      name: data.name as string,
      photo: data.photo as string | undefined,
      bio: content.trim(),
    };
  });
}

export function getRunnerBio(id: string): RunnerBio | undefined {
  return getAllRunnerBios().find((bio) => bio.id === id);
}

export function getAllRunnerProfiles(): RunnerProfile[] {
  const races = getAllRaces();
  const bios = getAllRunnerBios();
  const profileMap = new Map<string, RunnerProfile>();

  for (const bio of bios) {
    profileMap.set(bio.id, {
      id: bio.id,
      name: bio.name,
      photo: bio.photo,
      bio: bio.bio,
      races: [],
    });
  }

  for (const race of races) {
    for (const result of race.results) {
      const existing = profileMap.get(result.runnerId);
      if (existing) {
        existing.races.push({ race, result });
      } else {
        profileMap.set(result.runnerId, {
          id: result.runnerId,
          name: result.runnerName,
          races: [{ race, result }],
        });
      }
    }
  }

  return Array.from(profileMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getRunnerProfile(id: string): RunnerProfile | undefined {
  return getAllRunnerProfiles().find((profile) => profile.id === id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/runners.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/runners.ts lib/runners.test.ts content/runners
git commit -m "feat: add runner aggregation layer merging bios with race results"
```

---

### Task 4: Gallery Data Layer

**Files:**
- Create: `lib/gallery.ts`
- Test: `lib/gallery.test.ts`
- Create: `content/gallery/group-runs.json`

**Interfaces:**
- Consumes: type `RacePhoto` (from `lib/types.ts`)
- Produces: function `getGroupRunPhotos(): RacePhoto[]` (from `lib/gallery.ts`)

- [ ] **Step 1: Write the failing test**

Create `lib/gallery.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getGroupRunPhotos } from "./gallery";

describe("getGroupRunPhotos", () => {
  it("returns photos from the group-runs.json file", () => {
    const photos = getGroupRunPhotos();
    expect(photos.length).toBeGreaterThanOrEqual(1);
    expect(photos[0]).toHaveProperty("url");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/gallery.test.ts`
Expected: FAIL — `lib/gallery.ts` does not exist.

- [ ] **Step 3: Create seed gallery data and the implementation**

Create `content/gallery/group-runs.json`:
```json
{
  "photos": [
    { "url": "https://placehold.co/800x600?text=Group+Run", "caption": "Saturday morning group run" }
  ]
}
```

Create `lib/gallery.ts`:
```ts
import fs from "fs";
import path from "path";
import type { RacePhoto } from "./types";

const GROUP_RUNS_FILE = path.join(process.cwd(), "content", "gallery", "group-runs.json");

export function getGroupRunPhotos(): RacePhoto[] {
  if (!fs.existsSync(GROUP_RUNS_FILE)) return [];
  const raw = fs.readFileSync(GROUP_RUNS_FILE, "utf-8");
  const data = JSON.parse(raw) as { photos: RacePhoto[] };
  return data.photos;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/gallery.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add lib/gallery.ts lib/gallery.test.ts content/gallery
git commit -m "feat: add gallery data layer for group-run photos"
```

---

### Task 5: Layout, Nav, and Footer

**Files:**
- Create: `components/Nav.tsx`
- Test: `components/Nav.test.tsx`
- Create: `components/Footer.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: nothing from data layer
- Produces: `<Nav />` and `<Footer />` components rendered in every page via `app/layout.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/Nav.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Nav from "./Nav";

describe("Nav", () => {
  it("renders a link for every main section", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Results" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gallery" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Roster" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/Nav.test.tsx`
Expected: FAIL — `components/Nav.tsx` does not exist.

- [ ] **Step 3: Implement Nav, Footer, and update the layout**

Create `components/Nav.tsx`:
```tsx
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/results", label: "Results" },
  { href: "/gallery", label: "Gallery" },
  { href: "/roster", label: "Roster" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-brand-forest text-white">
      <Link href="/" className="font-bold text-lg">
        Narrow Path Runners
      </Link>
      <ul className="flex gap-6">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-brand-terracotta">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

Create `components/Footer.tsx`:
```tsx
export default function Footer() {
  return (
    <footer className="px-6 py-6 text-center text-sm text-gray-600 border-t border-brand-forest/10">
      © {new Date().getFullYear()} Narrow Path Runners
    </footer>
  );
}
```

Replace the contents of `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Narrow Path Runners",
  description: "Race results, photos, and stories from the Narrow Path Runners club.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-brand-cream text-gray-900">
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/Nav.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: nav bar with all 5 links visible and styled with the brand colors; footer visible at the bottom of the default page.

- [ ] **Step 6: Commit**

```bash
git add components/Nav.tsx components/Nav.test.tsx components/Footer.tsx app/layout.tsx
git commit -m "feat: add site nav, footer, and root layout"
```

---

### Task 6: Home Page

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: nothing (static content only)
- Produces: `/` route

- [ ] **Step 1: Replace the default home page**

Replace the contents of `app/page.tsx`:
```tsx
export default function HomePage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-brand-forest">Narrow Path Runners</h1>
      <p className="mt-4 text-lg text-gray-700">
        A running club built on community, consistency, and showing up for each
        other — rain or shine. Browse our race results, photos, and the people
        who make up the club.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: hero heading and welcome text render, styled with brand colors, nav/footer from Task 5 still present.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add static home page hero"
```

---

### Task 7: Results Pages

**Files:**
- Create: `components/ResultsTable.tsx`
- Test: `components/ResultsTable.test.tsx`
- Create: `app/results/page.tsx`
- Create: `app/results/[raceId]/page.tsx`

**Interfaces:**
- Consumes: `getAllRaces(): Race[]`, `getRaceById(id: string): Race | undefined` (Task 2); type `RaceResult` (Task 2)
- Produces: `<ResultsTable results={RaceResult[]} />` component; `/results` and `/results/[raceId]` routes

- [ ] **Step 1: Write the failing test**

Create `components/ResultsTable.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ResultsTable from "./ResultsTable";
import type { RaceResult } from "@/lib/types";

const results: RaceResult[] = [
  { runnerId: "sam-lee", runnerName: "Sam Lee", time: "24:02", placement: 2 },
  { runnerId: "jane-doe", runnerName: "Jane Doe", time: "22:14", placement: 1, personalRecord: true },
];

describe("ResultsTable", () => {
  it("renders runners sorted by placement", () => {
    render(<ResultsTable results={results} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Jane Doe");
    expect(rows[1]).toHaveTextContent("Sam Lee");
  });

  it("shows a PR badge for personal records", () => {
    render(<ResultsTable results={results} />);
    expect(screen.getByText("PR")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/ResultsTable.test.tsx`
Expected: FAIL — `components/ResultsTable.tsx` does not exist.

- [ ] **Step 3: Implement ResultsTable and the results routes**

Create `components/ResultsTable.tsx`:
```tsx
import type { RaceResult } from "@/lib/types";

export default function ResultsTable({ results }: { results: RaceResult[] }) {
  const sorted = [...results].sort(
    (a, b) => (a.placement ?? Infinity) - (b.placement ?? Infinity)
  );
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-brand-forest/20">
          <th className="py-2">Place</th>
          <th className="py-2">Runner</th>
          <th className="py-2">Time</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((result) => (
          <tr key={result.runnerId} className="border-b border-brand-forest/10">
            <td className="py-2">{result.placement ?? "—"}</td>
            <td className="py-2">
              <a href={`/roster/${result.runnerId}`} className="hover:underline">
                {result.runnerName}
              </a>
              {result.personalRecord && (
                <span className="ml-2 text-xs font-semibold text-brand-terracotta">
                  PR
                </span>
              )}
            </td>
            <td className="py-2">{result.time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

Create `app/results/page.tsx`:
```tsx
import Link from "next/link";
import { getAllRaces } from "@/lib/races";

export default function ResultsIndexPage() {
  const races = getAllRaces();
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Race Results</h1>
      <ul className="space-y-4">
        {races.map((race) => (
          <li key={race.id}>
            <Link href={`/results/${race.id}`} className="text-xl hover:underline">
              {race.name}
            </Link>
            <p className="text-sm text-gray-600">
              {race.date} · {race.location} · {race.distance}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Create `app/results/[raceId]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getAllRaces, getRaceById } from "@/lib/races";
import ResultsTable from "@/components/ResultsTable";

export function generateStaticParams() {
  return getAllRaces().map((race) => ({ raceId: race.id }));
}

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ raceId: string }>;
}) {
  const { raceId } = await params;
  const race = getRaceById(raceId);
  if (!race) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold">{race.name}</h1>
      <p className="text-gray-600 mb-6">
        {race.date} · {race.location} · {race.distance}
      </p>
      <ResultsTable results={race.results} />
      {race.photos.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4">
          {race.photos.map((photo) => (
            <img
              key={photo.url}
              src={photo.url}
              alt={photo.caption ?? race.name}
              className="rounded"
            />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/ResultsTable.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/results` then click into a race.
Expected: results index lists both seed races; race detail page shows a results table sorted by placement with a PR badge on Jane Doe's 5K result and Sam Lee's 10K result.

- [ ] **Step 6: Commit**

```bash
git add components/ResultsTable.tsx components/ResultsTable.test.tsx app/results
git commit -m "feat: add results index and race detail pages"
```

---

### Task 8: Roster and Runner Profile Pages

**Files:**
- Create: `components/RunnerCard.tsx`
- Test: `components/RunnerCard.test.tsx`
- Create: `app/roster/page.tsx`
- Create: `app/roster/[runnerId]/page.tsx`

**Interfaces:**
- Consumes: `getAllRunnerProfiles(): RunnerProfile[]`, `getRunnerProfile(id: string): RunnerProfile | undefined` (Task 3); type `RunnerProfile` (Task 2)
- Produces: `<RunnerCard profile={RunnerProfile} />` component; `/roster` and `/roster/[runnerId]` routes

- [ ] **Step 1: Write the failing test**

Create `components/RunnerCard.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RunnerCard from "./RunnerCard";
import type { RunnerProfile } from "@/lib/types";

const profile: RunnerProfile = {
  id: "jane-doe",
  name: "Jane Doe",
  races: [{ race: {} as never, result: {} as never }],
};

describe("RunnerCard", () => {
  it("links to the runner's profile page", () => {
    render(<RunnerCard profile={profile} />);
    expect(
      screen.getByRole("link", { name: /Jane Doe/ })
    ).toHaveAttribute("href", "/roster/jane-doe");
  });

  it("shows how many races the runner has logged", () => {
    render(<RunnerCard profile={profile} />);
    expect(screen.getByText("1 race logged")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/RunnerCard.test.tsx`
Expected: FAIL — `components/RunnerCard.tsx` does not exist.

- [ ] **Step 3: Implement RunnerCard and the roster routes**

Create `components/RunnerCard.tsx`:
```tsx
import Link from "next/link";
import type { RunnerProfile } from "@/lib/types";

export default function RunnerCard({ profile }: { profile: RunnerProfile }) {
  return (
    <Link
      href={`/roster/${profile.id}`}
      className="block p-4 rounded border border-brand-forest/20 hover:border-brand-terracotta transition"
    >
      <h2 className="font-semibold text-lg">{profile.name}</h2>
      <p className="text-sm text-gray-600">
        {profile.races.length} race{profile.races.length === 1 ? "" : "s"} logged
      </p>
    </Link>
  );
}
```

Create `app/roster/page.tsx`:
```tsx
import { getAllRunnerProfiles } from "@/lib/runners";
import RunnerCard from "@/components/RunnerCard";

export default function RosterPage() {
  const profiles = getAllRunnerProfiles();
  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Roster</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <RunnerCard key={profile.id} profile={profile} />
        ))}
      </div>
    </main>
  );
}
```

Create `app/roster/[runnerId]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllRunnerProfiles, getRunnerProfile } from "@/lib/runners";

export function generateStaticParams() {
  return getAllRunnerProfiles().map((profile) => ({ runnerId: profile.id }));
}

export default async function RunnerProfilePage({
  params,
}: {
  params: Promise<{ runnerId: string }>;
}) {
  const { runnerId } = await params;
  const profile = getRunnerProfile(runnerId);
  if (!profile) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold">{profile.name}</h1>
      {profile.bio && <div className="mt-4 space-y-4"><MDXRemote source={profile.bio} /></div>}
      <h2 className="text-xl font-semibold mt-8 mb-4">Race History</h2>
      <ul className="space-y-2">
        {profile.races.map(({ race, result }) => (
          <li key={race.id}>
            <Link href={`/results/${race.id}`} className="hover:underline">
              {race.name}
            </Link>{" "}
            — {result.time} (#{result.placement ?? "—"})
            {result.personalRecord && (
              <span className="ml-2 text-xs font-semibold text-brand-terracotta">
                PR
              </span>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/RunnerCard.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/roster`, then click into Jane Doe's and Sam Lee's profiles.
Expected: roster grid shows both runners; Jane Doe's profile shows her bio text plus both races with a PR badge; Sam Lee's profile shows both races (with a PR badge on the 10K) and no bio section.

- [ ] **Step 6: Commit**

```bash
git add components/RunnerCard.tsx components/RunnerCard.test.tsx app/roster
git commit -m "feat: add roster and runner profile pages"
```

---

### Task 9: Gallery Pages

**Files:**
- Create: `components/PhotoGrid.tsx`
- Test: `components/PhotoGrid.test.tsx`
- Create: `app/gallery/page.tsx`

**Interfaces:**
- Consumes: `getAllRaces(): Race[]` (Task 2), `getGroupRunPhotos(): RacePhoto[]` (Task 4); type `RacePhoto` (Task 2)
- Produces: `<PhotoGrid photos={RacePhoto[]} />` component; `/gallery` route

- [ ] **Step 1: Write the failing test**

Create `components/PhotoGrid.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PhotoGrid from "./PhotoGrid";

describe("PhotoGrid", () => {
  it("renders an image for each photo", () => {
    render(
      <PhotoGrid
        photos={[
          { url: "https://example.com/a.jpg", caption: "A" },
          { url: "https://example.com/b.jpg", caption: "B" },
        ]}
      />
    );
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("shows a message when there are no photos", () => {
    render(<PhotoGrid photos={[]} />);
    expect(screen.getByText("No photos yet.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/PhotoGrid.test.tsx`
Expected: FAIL — `components/PhotoGrid.tsx` does not exist.

- [ ] **Step 3: Implement PhotoGrid and the gallery route**

Create `components/PhotoGrid.tsx`:
```tsx
import type { RacePhoto } from "@/lib/types";

export default function PhotoGrid({ photos }: { photos: RacePhoto[] }) {
  if (photos.length === 0) {
    return <p className="text-gray-600">No photos yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {photos.map((photo) => (
        <img
          key={photo.url}
          src={photo.url}
          alt={photo.caption ?? ""}
          className="rounded aspect-square object-cover"
        />
      ))}
    </div>
  );
}
```

Create `app/gallery/page.tsx`:
```tsx
import Link from "next/link";
import { getAllRaces } from "@/lib/races";
import { getGroupRunPhotos } from "@/lib/gallery";
import PhotoGrid from "@/components/PhotoGrid";

export default function GalleryPage() {
  const races = getAllRaces().filter((race) => race.photos.length > 0);
  const groupRunPhotos = getGroupRunPhotos();

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold">Gallery</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">Group Runs</h2>
        <PhotoGrid photos={groupRunPhotos} />
      </section>

      {races.map((race) => (
        <section key={race.id}>
          <h2 className="text-xl font-semibold mb-4">
            <Link href={`/results/${race.id}`} className="hover:underline">
              {race.name}
            </Link>
          </h2>
          <PhotoGrid photos={race.photos} />
        </section>
      ))}
    </main>
  );
}
```

Note: images use plain `<img>` rather than `next/image` — Blob URLs would otherwise require a `remotePatterns` entry in `next.config.ts`, and this is a small, low-traffic site where that optimization isn't worth the added config yet. Revisit if page weight becomes a real problem.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/PhotoGrid.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/gallery`.
Expected: "Group Runs" section shows the seed placeholder photo; no per-race sections appear yet since the seed races have empty `photos` arrays (expected — photos get added via Task 11's upload script).

- [ ] **Step 6: Commit**

```bash
git add components/PhotoGrid.tsx components/PhotoGrid.test.tsx app/gallery
git commit -m "feat: add gallery page grouped by race and group runs"
```

---

### Task 10: About Page

**Files:**
- Create: `lib/about.ts`
- Test: `lib/about.test.ts`
- Create: `content/about.mdx`
- Create: `app/about/page.tsx`

**Interfaces:**
- Consumes: nothing from other lib modules
- Produces: function `getAboutContent(): string` (from `lib/about.ts`); `/about` route

- [ ] **Step 1: Write the failing test**

Create `lib/about.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getAboutContent } from "./about";

describe("getAboutContent", () => {
  it("reads the about.mdx file", () => {
    const content = getAboutContent();
    expect(content.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/about.test.ts`
Expected: FAIL — `lib/about.ts` does not exist.

- [ ] **Step 3: Create the about content and implementation**

Create `content/about.mdx`:
```mdx
# About Narrow Path Runners

Narrow Path Runners is a local running club built on community, consistency, and showing up for each other — rain or shine. We meet for group runs, race together throughout the year, and celebrate every PR, big or small.

Want to run with us? Reach out at [hello@narrowpathrunners.example](mailto:hello@narrowpathrunners.example).
```

Create `lib/about.ts`:
```ts
import fs from "fs";
import path from "path";

export function getAboutContent(): string {
  const filePath = path.join(process.cwd(), "content", "about.mdx");
  return fs.readFileSync(filePath, "utf-8");
}
```

Create `app/about/page.tsx`:
```tsx
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAboutContent } from "@/lib/about";

export default function AboutPage() {
  const content = getAboutContent();
  return (
    <main className="max-w-2xl mx-auto px-6 py-10 space-y-4">
      <MDXRemote source={content} />
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/about.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/about`.
Expected: heading, paragraph, and mailto link render correctly.

- [ ] **Step 6: Commit**

```bash
git add lib/about.ts lib/about.test.ts content/about.mdx app/about
git commit -m "feat: add about page"
```

---

### Task 11: Vercel Blob Photo Upload Script

**Files:**
- Create: `scripts/upload-photos-helpers.ts`
- Test: `scripts/upload-photos-helpers.test.ts`
- Create: `scripts/upload-photos.ts`
- Modify: `package.json` (add `upload-photos` script)

**Interfaces:**
- Consumes: nothing from the app's `lib/*` modules (standalone CLI)
- Produces: functions `captionFromFilename(filename: string): string`, `buildPhotoEntries(filenames: string[], urls: string[]): PhotoEntry[]` where `PhotoEntry = { url: string; caption: string }` (from `scripts/upload-photos-helpers.ts`); CLI command `npm run upload-photos -- <folder>`

- [ ] **Step 1: Write the failing test**

Create `scripts/upload-photos-helpers.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildPhotoEntries, captionFromFilename } from "./upload-photos-helpers";

describe("captionFromFilename", () => {
  it("turns a filename into a readable caption", () => {
    expect(captionFromFilename("finish-line-sprint.jpg")).toBe("finish line sprint");
  });
});

describe("buildPhotoEntries", () => {
  it("pairs filenames with their uploaded urls", () => {
    const entries = buildPhotoEntries(
      ["finish-line.jpg"],
      ["https://blob.vercel-storage.com/finish-line-abc123.jpg"]
    );
    expect(entries).toEqual([
      { url: "https://blob.vercel-storage.com/finish-line-abc123.jpg", caption: "finish line" },
    ]);
  });

  it("throws when filenames and urls length mismatch", () => {
    expect(() => buildPhotoEntries(["a.jpg"], [])).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/upload-photos-helpers.test.ts`
Expected: FAIL — `scripts/upload-photos-helpers.ts` does not exist.

- [ ] **Step 3: Implement the helpers and the CLI script**

Create `scripts/upload-photos-helpers.ts`:
```ts
export interface PhotoEntry {
  url: string;
  caption: string;
}

export function captionFromFilename(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, "");
  return base.replace(/[-_]/g, " ").trim();
}

export function buildPhotoEntries(filenames: string[], urls: string[]): PhotoEntry[] {
  if (filenames.length !== urls.length) {
    throw new Error("filenames and urls must be the same length");
  }
  return filenames.map((filename, i) => ({
    url: urls[i],
    caption: captionFromFilename(filename),
  }));
}
```

Create `scripts/upload-photos.ts`:
```ts
import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { buildPhotoEntries } from "./upload-photos-helpers";

async function main() {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Usage: npm run upload-photos -- <folder-of-images>");
    process.exit(1);
  }

  const dir = path.resolve(folder);
  const filenames = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

  if (filenames.length === 0) {
    console.error(`No images found in ${dir}`);
    process.exit(1);
  }

  const urls: string[] = [];
  for (const filename of filenames) {
    const filePath = path.join(dir, filename);
    const buffer = fs.readFileSync(filePath);
    const blob = await put(filename, buffer, { access: "public" });
    urls.push(blob.url);
    console.log(`Uploaded ${filename} -> ${blob.url}`);
  }

  const entries = buildPhotoEntries(filenames, urls);
  console.log('\nPaste this into the race or gallery JSON\'s "photos" array:\n');
  console.log(JSON.stringify(entries, null, 2));
}

main();
```

Add to `package.json`'s `"scripts"` block:
```json
"upload-photos": "tsx scripts/upload-photos.ts"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/upload-photos-helpers.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Manually verify the CLI against a real Blob store**

Requires a Vercel Blob store to exist and `BLOB_READ_WRITE_TOKEN` to be available locally — set this up as part of Task 12's Vercel project setup, then return here to verify. Once the token is in `.env.local`:

Run:
```bash
mkdir -p /tmp/test-photos
# copy 1-2 small jpg/png files into /tmp/test-photos
npm run upload-photos -- /tmp/test-photos
```

Expected: console logs one `Uploaded <file> -> <url>` line per image, followed by a JSON array of `{ url, caption }` entries; opening one of the printed URLs in a browser shows the uploaded image.

- [ ] **Step 6: Commit**

```bash
git add scripts/upload-photos-helpers.ts scripts/upload-photos-helpers.test.ts scripts/upload-photos.ts package.json
git commit -m "feat: add Vercel Blob photo upload script"
```

---

### Task 12: Deploy to Vercel

**Files:**
- None (infrastructure/config task; may touch `.env.local` locally, which is gitignored)

**Interfaces:**
- Consumes: the full app from Tasks 1–11
- Produces: a live deployment at a `*.vercel.app` URL

- [ ] **Step 1: Install the Vercel CLI**

Run:
```bash
npm i -g vercel
```

- [ ] **Step 2: Log in and link the project**

Run:
```bash
vercel login
vercel link
```
Follow the prompts to create/select a Vercel project for this repo.

- [ ] **Step 3: Create a Blob store and pull env vars**

In the Vercel dashboard for this project, add a Blob store (Storage → Create Database → Blob) and connect it to the project. Then run:
```bash
vercel env pull .env.local
```
Expected: `.env.local` now contains `BLOB_READ_WRITE_TOKEN`. Go back to Task 11 Step 5 and verify the upload script works against this store.

- [ ] **Step 4: Deploy a preview**

Run:
```bash
vercel deploy
```
Expected: a preview URL is printed. Open it and click through all 5 nav sections (Home, Results, Gallery, Roster, About) to confirm each renders with the seed content.

- [ ] **Step 5: Deploy to production**

Run:
```bash
vercel deploy --prod
```
Expected: a production URL on the `*.vercel.app` subdomain is printed and live.

- [ ] **Step 6: Commit any config changes**

If `vercel link` created a `.vercel` directory, confirm it's gitignored (Vercel CLI adds this automatically). If no files changed, there is nothing to commit — this task's deliverable is the live deployment itself, not a code change.

---
