This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploying

The site is hosted on Vercel and deploys from GitHub. Every push to a branch gets a preview deployment, and merging into `master` deploys production. A new deployment should appear in the Vercel project's Deployments tab within a few seconds of a push.

If no deployment appears, Vercel has lost its connection to the repo. Reconnect it under the project's Settings, then Git. To publish in the meantime, deploy by hand from an up-to-date `master`:

```bash
git checkout master && git pull origin master
npx vercel --prod
```

Builds download the header fonts (`next/font/google`), so they need internet access.

Every pull request also adds an entry to `RELEASE_NOTES.md`; see `AGENTS.md`.
