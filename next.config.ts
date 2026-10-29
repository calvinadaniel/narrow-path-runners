import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site is the marathon tracker for now: no nav, root opens on it.
  async redirects() {
    return [{ source: "/", destination: "/marathon", permanent: false }];
  },
};

export default nextConfig;
