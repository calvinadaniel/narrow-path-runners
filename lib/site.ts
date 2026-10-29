export const navLinks = [
  { href: "/roster", label: "Team", letter: "T", color: "red" as const },
  { href: "/results", label: "Events", letter: "E", color: "green" as const },
  {
    href: "/marathon",
    label: "NYC Marathon",
    letter: "M",
    color: "red" as const,
  },
  {
    href: "/about",
    label: "Who We Are",
    letter: "W",
    color: "orange" as const,
  },
] as const;

export type SubwayColor = (typeof navLinks)[number]["color"];

export const stravaClubUrl =
  process.env.NEXT_PUBLIC_STRAVA_CLUB_URL ??
  "https://www.strava.com/clubs/1969555/";
