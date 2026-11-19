# Twój mechanik – Your Car Mechanic

Web app for booking car repairs. Customers find a workshop, see a price estimate and free hours,
book a visit and follow the repair live. Workshops manage repairs, quotes, scope changes, their
price list and client list. Moderators unlock companies, manage the service catalog, moderate
repairs and reviews and see statistics.

**Stack:** Nuxt 4 (SPA) · Vue 3 · Vuetify 4 · Pinia · Firebase (Auth + Firestore + Storage) · Storybook 10 · Vitest 5 · bun

## What it does

- **Customers** – book a repair (services → car → workshop with estimate, rating, promotions, live free hours), follow it live,
  accept quotes and scope changes, add photos, add visits to their calendar, review workshops, see each car's history.
- **Workshops** – week board and list of repairs, itemised quotes from their price list, statuses, photos, notes
  (for the client and internal), proposals, client list for seasonal campaigns, promotions, working days and hours.
- **Moderators** – statistics, unlocking companies after signing the contract, service catalog, clients,
  moderation of every repair and of reviews.
- **Everyone** – notification bell (live) with visit reminders, pl/en, dark/light theme.

> Working on the code (human or AI agent)? Read [AGENTS.md](AGENTS.md) first.

## Setup

```bash
bun install
bunx playwright install chromium   # once, for the Storybook tests
cp .env.example .env               # fill in the Firebase web app config
bun run dev                        # http://localhost:3000
```

### Local Firebase (optional)

```bash
firebase emulators:start           # Auth :9099, Firestore :8080, Storage :9199, UI :4000
NUXT_PUBLIC_USE_EMULATORS=true bun run dev
```

### First moderator

Moderators cannot be created from the app. Register a normal account, then in the Firebase console
set `users/{uid}.role` to `"moderator"`.

## Scripts

| | |
|---|---|
| `bun run dev` | dev server |
| `bun run lint` | ESLint |
| `bun run typecheck` | vue-tsc |
| `bun run test` | unit tests + Storybook play tests (Chromium) |
| `bun run storybook` | component workshop on http://localhost:6006 |
| `bun run generate` | static build (`.output/public`) |
| `bun run deploy` | build + deploy hosting, Firestore rules/indexes and Storage rules |

## Architecture in one paragraph

There is no custom backend: the browser talks to Firebase through `app/services/`, and
[`firestore.rules`](firestore.rules) enforce who may read or change what. Data that another party
changes while you look at it (active repairs, booked hours, your own account) is streamed with
`onSnapshot`; everything else is read once. Nothing is hard-deleted – records get `deletedAt` and
stay available for history and moderators.

## Migrating data from the old backend

The previous Express backend stored users under random document ids. The app now expects
`users/{firebaseAuthUid}`. Existing `users`, `cars` and `fixes` documents need a one-off migration
(copy each user document to its auth uid and rewrite `userRef` fields) before going live.
