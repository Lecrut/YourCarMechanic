# AGENTS.md – guide for AI agents

Your Car Mechanic ("Twój mechanik") – a web app where drivers book car repairs at workshops,
workshops manage the repair timeline, and moderators manage companies, the service catalog
and can inspect everything.

Stack: **Nuxt 4 (SPA, `ssr: false`) · Vue 3.5 · Vuetify 4 · Pinia 4 · @nuxtjs/i18n 10 (pl/en) ·
Firebase 13 (Auth + Firestore, called directly from the browser) · Storybook 10 + Vitest 5 (browser mode) · ESLint 10 (@nuxt/eslint)**.

There is **no backend of our own**. Access control lives in [`firestore.rules`](firestore.rules) –
any change to the data model must come with a matching rules change.

---

## 1. Working rules (Karpathy guidelines)

Follow the skill [`.claude/skills/karpathy-guidelines`](.claude/skills/karpathy-guidelines/SKILL.md). In short:

1. **Think before coding** – state assumptions, surface ambiguity, ask instead of guessing.
2. **Simplicity first** – the minimum code that solves the problem; no speculative abstractions.
3. **Surgical changes** – touch only what the task needs; match the existing style; mention (don't delete) unrelated dead code.
4. **Goal-driven execution** – turn the task into checks (`pnpm lint`, `pnpm test`, a Storybook story) and loop until they pass.

## 2. Project rules

- **Git:** all work goes to the `develop` branch; `main` is release-only. Small, focused commits.
- **Package manager:** `pnpm` only (lockfile: `pnpm-lock.yaml`). Node ≥ 22.
- **Firestore access only through `app/services/`.** Components and pages never import `firebase/*`.
  Stores call services; Storybook swaps `app/services` for [`.storybook/mocks/services.ts`](.storybook/mocks/services.ts).
  If you add a service function, add its mock too.
- **Every data-model change updates** `app/models/*`, `firestore.rules` and (if a new query needs it) `firestore.indexes.json`.
- **Roles:** `user`, `workshop`, `moderator` (`app/models/user.ts`). `moderator` can never be self-assigned –
  it is set manually on `users/{uid}.role` in the Firebase console. The rules enforce this.
- **i18n:** no hard-coded UI strings. Add keys to **both** `i18n/locales/pl.json` and `i18n/locales/en.json`.
- **Service catalog** (types of repairs) is data in the Firestore `services` collection, managed by moderators.
  Use `useServicesStore()` – never hard-code service keys in components.
- **Vuetify 4:** MD3 typography classes (`text-headline-small`, `text-title-large`, …), grid alignment via
  utility classes (`class="justify-center"`, not `justify="center"`), elevation 0–5.
  v3 breakpoints are restored in `app/plugins/vuetify.ts`.
- **Components:** `<script setup lang="ts">`, props typed with `defineProps<…>()`, `v-model` via `defineModel`.
  Any new presentational component gets a `*.stories.ts` next to it with at least one `play` test.
- **No `@ts-ignore`** – fix the type instead.
- **Secrets:** Firebase web config comes from `.env` (`NUXT_PUBLIC_FIREBASE_*`, see `.env.example`). Never commit `.env`.

## 3. Commands

| Command | What it does |
|---|---|
| `pnpm install` | install deps (runs `nuxt prepare`) |
| `pnpm dev` | dev server on http://localhost:3000 |
| `pnpm lint` / `pnpm lint:fix` | ESLint (flat config from `@nuxt/eslint`) |
| `pnpm storybook` | Storybook on http://localhost:6006 |
| `pnpm test` | runs every story as a test (Vitest browser mode + Playwright Chromium) |
| `pnpm generate` | static build into `.output/public` |
| `pnpm deploy` | generate + `firebase deploy --only hosting,firestore` |
| `firebase emulators:start` | local Auth/Firestore; run the app with `NUXT_PUBLIC_USE_EMULATORS=true` |

First-time test setup: `pnpm exec playwright install chromium`.

## 4. File map

```
app/
  app.vue                     root: theme + locale restore, <NuxtLayout>/<NuxtPage>
  plugins/
    firebase.client.ts        initialises Firebase from runtimeConfig, syncs auth state with the store
    vuetify.ts                Vuetify 4 setup: themes, defaults, v3 breakpoints
  services/                   ★ the ONLY place that talks to Firebase
    firebase.ts               initFirebase(), auth(), db()
    index.ts                  re-exports all services (Storybook aliases this file)
    authService.ts            sign up / in / out, reset password, user profile docs
    carsService.ts            cars collection
    fixesService.ts           fixes collection + notifications + booked slots
    workshopsService.ts       companies collection, free-slot lookup
    servicesCatalogService.ts services (repair types) collection
    moderatorService.ts       moderator-only reads/writes (all users, all fixes, delete company…)
    mappers.ts                Firestore doc → model helpers (Timestamp → Date, path refs)
  stores/                     Pinia setup stores (auto-imported)
    authStore.ts              current user + their company, auth actions
    carsStore.ts              user's cars
    fixesStore.ts             active + history repairs
    workshopStore.ts          workshop search, free hours
    servicesStore.ts          service catalog (options for selects, labels)
    moderatorStore.ts         moderator panel data
    sharedStore.ts            global loading/error + run() helper
    carsJsonStore.ts          static car brands/models (public/cars.json)
    citiesJsonStore.ts        static cities (public/cities.json)
  models/                     TS interfaces + mappers (car, fix, notification, user, userProfile, workshop, service…)
  composables/                small option lists (roles, notification types)
  utils/                      form validation, rules, time helpers (auto-imported)
  middleware/                 auth.ts, company.ts, moderator.ts route guards
  layouts/                    default (guest), user, company, moderator, no-role
  components/
    navigation/               app bars per role
    user/                     car/workshop cards, forms, free dates, repair details
    moderator/                tables + dialogs for the moderator panel
    repairCard.vue, mySnackbar.vue
    **/*.stories.ts           Storybook stories + play tests (colocated)
  pages/
    index.vue, about.vue      public landing pages
    auth/                     login, register, reset-password, role-choice
    user/                     book repair (index), notifications, history, profile
    company/                  repair list (index), profile
    moderator/                moderator panel (index)
i18n/
  i18n.config.ts              vue-i18n options
  locales/pl.json, en.json    translations
public/                       images, cars.json, cities.json, terms PDF
.storybook/
  main.ts, preview.ts         Storybook config (Vuetify, i18n, Pinia, auto-imports)
  mocks/                      services.ts (fake Firestore), nuxt.ts (navigateTo etc.), fixtures.ts
firestore.rules               ★ security rules – the real authorization layer
firestore.indexes.json        composite indexes
firebase.json, .firebaserc    hosting + firestore deploy config
eslint.config.mjs             ESLint flat config
vitest.config.ts              Storybook-as-tests config
*.drawio                      architecture / DB / UI diagrams (may predate the Firebase-direct rewrite)
```

## 5. Firestore data model

| Collection | Doc id | Key fields | Who can access |
|---|---|---|---|
| `users` | auth `uid` | `email`, `role`, `profile{name,surname,phone}`, `companyRef` | owner, moderator |
| `companies` | auto | `name`, `nip`, `city`, `address`, `phone`, `openingTime`, `closingTime`, `services[]`, `ownerUid` | read: signed in · write: owner, moderator |
| `companies/{id}/slots` | `date` ISO | `date`, `userUid`, `fixRef` | read: signed in · create once · delete: participant/moderator |
| `cars` | auto | `manufacturer`, `model`, `productionYear`, `vin`, `userRef` | owner, moderator |
| `fixes` | auto | `date`, `bookDate` (Timestamps), `userRef`, `companyRef`, `car`, `services[]`, `notifications[]`, `isClosed` | client, workshop, moderator |
| `services` | service key | `key`, `namePl`, `nameEn`, `active`, `order` | read: everyone · write: moderator |

References between docs are stored as document **paths** (e.g. `users/abc`, `companies/xyz`) in `*Ref` fields.
