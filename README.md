# personal-os

Personal DONALD OS — personal command center (single `index.html` dashboard).

## What is live after the Aug 27 2026 merge

The stale-cards merge (`7ce4a24`) **did** create a Vercel Production deployment. Nothing in this repo (middleware, `vercel.json`, or the dashboard JS) is what you hit first. The team aliases return Vercel Deployment Protection SSO **before** the HTML loads.

| URL | What you get |
| --- | --- |
| https://personal-os-phi-gray.vercel.app | Public, byte-identical to current `main` `index.html` |
| https://personal-os-davidlgenuth-6527s-projects.vercel.app | Team production alias — **Vercel SSO** |
| https://personal-os-git-cursor-refre-36e055-davidlgenuth-6527s-projects.vercel.app | Team preview — **Vercel SSO** |
| https://personal-os.vercel.app | **Different app** (NextAuth `/api/auth/signin`). Not this repo. |

## Remaining block (dashboard click — code cannot do this)

`vercel.json` cannot turn off Deployment Protection. The `public` field is deprecated and does not change security.

In the Vercel project **personal-os** on team `davidlgenuth-6527s-projects`:

1. Open [Deployment Protection](https://vercel.com/davidlgenuth-6527s-projects/personal-os/settings/deployment-protection)
2. Set **Vercel Authentication** (Standard Protection) to **Only Preview Deployments** if you want the production alias public, or **Disabled** if you want previews public too
3. Save

Until that click, the team production alias will keep sending browsers to `https://vercel.com/sso-api`.
