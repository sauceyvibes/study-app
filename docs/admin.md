# The admin site

The `additions` branch is a separate deployment of this repository: a
password-protected editor for adding and correcting places, routes, kingdoms,
territories, events, people and subjects. It runs on its own domain or subdomain
and **is never merged into main.**

## How it works

```
admin.yourdomain  (additions branch)               yourdomain  (main)
┌────────────────────────────┐   commit via      ┌──────────────────────────┐
│ /admin  forms + validation │ ── GitHub API ──► │ src/atlas/data/additions │
└────────────────────────────┘   to main         │  *.json  → redeploy      │
                                                 └──────────────────────────┘
```

- Each save is **one commit to main** (`admin: Add place "…" (id)`) that edits a
  JSON file in `src/atlas/data/additions/`. Vercel sees the commit and redeploys
  the public site. Every addition has a diff, an author and a history, and can
  be reverted like any other commit.
- `src/atlas/data/additions.ts` merges those files over the corpus by id. **A new
  id adds an entry; an existing id replaces that entry.** That is how you correct
  a curated or generated place: open it under *Correct an existing …*, change
  it, save. *Remove* deletes the addition, and any entry it overrode comes back.
- Before committing, the server checks every field and applies the same rules
  as `tests/corpus.test.ts`: every referenced id exists (including anything added
  a minute ago), a contested place names its alternatives, route legs join real
  places, extents are real polygons, and so on. A save that would break the
  public build is refused, and the form lists the reasons.

Only data crosses to main, never admin code. Main needs one thing before it can
read that data: the loader commit (see *One-time setup on main* below).

## Field formats

| Field | Type it like |
| --- | --- |
| Years | Signed integers: `-1000` is 1000 BC. Leave *To* empty for "still extant". |
| Coordinates | Longitude first, then latitude (Jerusalem is `35.2345`, `31.7767`). |
| Scripture | `Genesis 12:4-6; Acts 16; 1 Kings 12:28`, with full book names. |
| References (people, places…) | Ids separated by commas. Use *Find an id* to look them up. |
| Sources | One per line: `Aharoni, The Land of the Bible, 184 \| what it supports` |
| Route legs | One per line: `antioch-syria \| paphos \| sea \| Acts 13:4-6 \| optional note` |
| Extent | A GeoJSON `Polygon`/`MultiPolygon` geometry. Draw it at geojson.io and paste the `geometry` object. |

## One-time setup on main

Main needs the loader before it will read the additions. The loader is one
self-contained commit on this branch, *Merge admin-written additions into the
corpus*. It touches only `src/atlas/data/additions*`, `src/atlas/corpus.ts` and a
test. Copy that one commit to main, not the whole branch:

```bash
git checkout main
git cherry-pick <sha of "Merge admin-written additions into the corpus">
git push origin main
```

## Deploying on a subdomain (Vercel)

Use the same Vercel project that serves main:

1. **Domain.** Go to Project → Settings → Domains and add `admin.yourdomain.com`.
   In its settings, choose **Git Branch: `additions`**. Then add the DNS record
   Vercel shows you (usually a `CNAME` to `cname.vercel-dns.com`).
2. **Environment variables.** Go to Project → Settings → Environment Variables.
   For each variable below, pick the **Preview** environment and **only the
   `additions` branch**, so production (main) never gets the token or password.

   | Variable | Value |
   | --- | --- |
   | `ADMIN_PASSWORD` | A long passphrase. Changing it signs everyone out. |
   | `ADMIN_SESSION_SECRET` | Any long random string (`openssl rand -hex 32`). |
   | `GITHUB_TOKEN` | A fine-grained personal access token, limited to the repository `sauceyvibes/study-app`, with permission **Contents: Read and write**. |
   | `GITHUB_REPO` | Optional. Defaults to `sauceyvibes/study-app`. |
   | `GITHUB_TARGET_BRANCH` | Optional. Defaults to `main`. Set another branch to stage edits there instead. |

3. Redeploy the `additions` branch. `admin.yourdomain.com` then redirects to the
   login page.

The admin pages are marked `noindex`. Every `/admin` and `/api/admin` request
needs a signed session cookie (HttpOnly, SameSite=Strict, valid 7 days), and each
wrong password costs a one-second delay.

## Keeping this branch off main

- `.github/workflows/keep-additions-off-main.yml` fails any pull request from
  this branch into main. To make that binding, go to Settings → Branches (or
  Rules) → main, turn on **require status checks to pass**, and select
  *additions must not merge into main*.
- Changes to the public atlas (components, curated data, tests) go to main as
  usual. To bring them to the admin site, merge main **into** `additions`
  (`git checkout additions && git merge origin/main`). That direction is safe;
  the reverse is not.

## Running it locally

```bash
ADMIN_PASSWORD=dev GITHUB_TOKEN=… GITHUB_TARGET_BRANCH=some-scratch-branch npm run dev
# http://localhost:3000 → /admin
```

While you experiment, point `GITHUB_TARGET_BRANCH` at a scratch branch so test
saves don't land on main.
