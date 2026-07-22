export const navLinks = [
  { href: "/#team", label: "Team" },
  { href: "/#events", label: "Events" },
  { href: "/#who-we-are", label: "Who We Are" },
] as const;

export const stravaClubUrl =
  process.env.NEXT_PUBLIC_STRAVA_CLUB_URL ??
  "https://www.strava.com/clubs/1969555/";
