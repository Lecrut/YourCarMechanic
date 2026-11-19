# AGENTS.md – guide for AI agents

Your Car Mechanic ("Twój mechanik") – customers book car repairs at workshops, workshops run the
repair (statuses, quotes, scope changes, client lists, price list) and moderators manage companies,
the service catalog, reviews and can inspect and moderate everything.

Stack: **Nuxt 4 (SPA, `ssr: false`) · Vue 3.5 · Vuetify 4 · Pinia 4 · @nuxtjs/i18n 10 (pl/en) ·
Firebase 13 (Auth + Firestore, called directly from the browser) · Storybook 10 + Vitest 5 · ESLint 10 · TypeScript 6 · bun**.

There is **no backend of our own**. Authorization lives in [`firestore.rules`](firestore.rules) –
every data-model change needs a matching rules change.

---

## 1. Working rules (Karpathy guidelines)

Follow the skill [`.claude/skills/karpathy-guidelines`](.claude/skills/karpathy-guidelines/SKILL.md). In short:

1. **Think before coding** – state assumptions, surface ambiguity, ask instead of guessing.
2. **Simplicity first** – the minimum code that solves the problem; no speculative abstractions.
3. **Surgical changes** – touch only what the task needs; match the existing style; mention (don't delete) unrelated dead code.
4. **Goal-driven execution** – turn the task into checks and loop until they pass (see "Definition of done").

## 2. Definition of done

`bun run lint` · `bun run typecheck` · `bun run test` all green, and for UI changes the story renders
and its `play` test passes. Don't report "done" otherwise – report what failed.

## 3. Project rules

- **Git:** work on `develop`; `main` is release-only. Small, focused commits.
- **Package manager:** `bun` only (lockfile `bun.lock`). Node ≥ 22. TypeScript stays on 6.x until typescript-eslint supports 7.
- **Firebase only through `app/services/`.** Components, pages and stores never import `firebase/*`.
  Storybook/Vitest alias `~/services` to [`.storybook/mocks/services.ts`](.storybook/mocks/services.ts) –
  **every new service function needs a mock with the same signature.**
- **Realtime vs one-off reads:** use `onSnapshot` (`watch*` functions) only for data another party changes
  while it is on screen – active repairs, the signed-in user/company doc, booked slots in the date picker.
  Everything else is `getDocs`/`getDoc`. Listeners live in stores via `createSubscription()` and must be
  stopped (`onUnmounted`, `resetState`, logout).
- **Soft delete only:** never `deleteDoc` business data. Use `softDelete()`/`restore()` from
  `app/services/softDelete.ts` (`deletedAt`, `deletedBy`). Owners filter with `notDeleted()`, moderators see
  everything. Exception: `companies/{id}/slots` (technical booking index). Repairs keep their own car snapshot.
- **Data-model change ⇒** update `app/models/*`, `firestore.rules`, `firestore.indexes.json` (if a query needs it),
  the mock in `.storybook/mocks/`, and the table in section 6.
- **Roles:** `user`, `workshop`, `moderator`. `moderator` is never self-assigned – set `users/{uid}.role` in the
  Firebase console. Self-registered companies start `pending` (blocked) until a moderator unlocks them after the
  contract is signed (`contractSignedAt`).
- **Domain logic is pure and tested:** pricing (`models/priceList.ts`), stats (`models/stats.ts`), client lists
  (`models/client.ts`), repair rules (`models/fix.ts`). Put new rules there with a `*.test.ts`, not in components.
- **i18n:** no hard-coded UI strings; add keys to **both** `i18n/locales/pl.json` and `en.json`.
- **Service catalog** comes from Firestore `services` via `useServicesStore()` (`options`, `label(key)`).
- **UI: Vuetify only.** No custom CSS. MD3 typography (`text-headline-small`…), grid alignment via classes
  (`class="justify-center"`), elevation 0–5, v3 breakpoints (see `utils/vuetifyOptions.ts`).
  Consistency: pages start with `PageHeader`; lists of repairs use `RepairList`; dialogs put "cancel" (text) left
  of the primary action; empty states use `v-empty-state`; every icon-only button has `v-tooltip` + `aria-label`.
- **Components:** `<script setup lang="ts">`, typed `defineProps`, `defineModel`; import child components explicitly
  (Storybook has no Nuxt auto-registration). Don't name a ref like a component used in the template
  (`workshopForm` ref + `<workshop-form>` resolves to the ref!) – use `…Ref`.
- **Stories:** every new component/page gets a `*.stories.ts` with `play` tests. Set the signed-in user with
  `parameters: { app: { user, company } }`; assert service calls with `mocked(service.fn)`; dialogs render in
  `document.body` (use `screen`).
- **No `@ts-ignore`.** **Secrets:** Firebase web config via `.env` (`NUXT_PUBLIC_FIREBASE_*`, see `.env.example`).

## 4. Commands

| Command | What it does |
|---|---|
| `bun install` | install deps (runs `nuxt prepare`) |
| `bun run dev` | dev server on http://localhost:3000 |
| `bun run lint` / `lint:fix` | ESLint (`@nuxt/eslint` flat config + storybook plugin) |
| `bun run typecheck` | `nuxt typecheck` (vue-tsc) |
| `bun run test` | unit tests (node) + every story as a browser test (Chromium) |
| `bun run storybook` | Storybook on http://localhost:6006 (toolbar: language, theme) |
| `bun run build-storybook` | static Storybook into `storybook-static/` |
| `bun run generate` | static app build into `.output/public` |
| `bun run deploy` | generate + `firebase deploy --only hosting,firestore` |
| `firebase emulators:start` | local Auth/Firestore; run the app with `NUXT_PUBLIC_USE_EMULATORS=true` |

First-time test setup: `bunx playwright install chromium`.

## 5. File map

```
app/
  app.vue                       theme restore, loads service catalog, <NuxtLayout>/<NuxtPage>
  plugins/
    firebase.client.ts          init Firebase; Auth is the session source of truth (starts/clears session)
    vuetify.ts                  createVuetify(vuetifyOptions)
  services/                     ★ the ONLY code talking to Firebase
    index.ts                    re-exports (aliased to the mock in Storybook/Vitest)
    firebase.ts                 initFirebase() (local persistence, emulators), auth(), db()
    mappers.ts                  snapshot → model (Timestamps → Date, recursive; `reference` = doc path)
    softDelete.ts               softDelete()/restore()
    authService.ts              sign up/in/out, reset password, watchUser, profile/role writes
    carsService.ts              user cars (soft delete)
    fixesService.ts             repairs: live active list, history, booking + slot transaction,
                                statuses, proposals (propose/accept/reject), confirm workshop booking
    workshopsService.ts         companies, live company doc, live booked slots
    pricingService.ts           companies/{id}/priceList
    reviewsService.ts           reviews (one per fix), public ratings, moderation
    servicesCatalogService.ts   service catalog
    moderatorService.ts         moderator-only reads/writes (all users/fixes/cars, status, create company)
  stores/                       Pinia setup stores (auto-imported); all async via sharedStore.run()
    authStore.ts                user + company (persisted in localStorage as a cache), session, homePath
    fixesStore.ts               live active repairs, history, proposals
    workshopStore.ts            workshop search, price lists + ratings for estimates, live free hours
    pricingStore.ts             own price list + estimate()
    clientsStore.ts             workshop client list
    reviewsStore.ts             add review, moderation
    servicesStore.ts            service catalog (options/label/CRUD)
    moderatorStore.ts           moderator panel data and actions
    carsStore.ts, sharedStore.ts, carsJsonStore.ts, citiesJsonStore.ts
  models/                       interfaces + mappers + pure domain logic (*.test.ts next to them)
    fix.ts                      repair, proposal, progress, ViewerMode, decision/review rules
    priceList.ts                car segments, estimates, ranges
    stats.ts                    moderator statistics
    client.ts                   client list from repairs
    review.ts, softDelete.ts, notification.ts, workshop.ts, service.ts, user.ts, car.ts, …
  composables/                  role & status option lists
  utils/                        rules, form validation, time, subscription, vuetifyOptions (auto-imported)
  middleware/                   auth.ts (meta.role guard, waits for Firebase), guest.ts
  layouts/default.vue           single layout with AppNavigation
  types/page-meta.d.ts          `definePageMeta({ role })`
  components/
    appNavigation.vue           app bar, rail drawer per role, account card, bottom nav
    authCard, pageHeader, workshopForm, clientsTable, mySnackbar
    fix/                        repairCard, repairList, repairDetails, clientDecision, proposeChangeDialog
    user/                       carCard, addCarForm, workshopCard, freeDates, reviewDialog
    company/                    priceItemDialog, bookForClientDialog
    moderator/                  statsPanel, companiesTable, servicesTable, usersTable, fixesTable, reviewsTable
  pages/
    index, about                public
    auth/                       login, register, reset-password, role-choice
    user/                       index (booking wizard), notifications (live), history, profile
    company/                    index (live repairs), clients, pricing, profile
    moderator/index             tabs: stats, companies, services, clients, repairs, reviews (?tab=)
  assets/data/                  cars.json, cities.json
  **/*.stories.ts               Storybook stories + play tests
i18n/                           i18n.config.ts, locales/pl.json, locales/en.json
.storybook/
  main.ts, preview.ts           config, decorator (fresh fake DB + Pinia per story, user via parameters.app)
  vite.shared.ts                aliases + Nuxt auto-imports shared with vitest.config.ts
  mocks/                        services.ts (in-memory, fn() spies), fixtures.ts, nuxt.ts
firestore.rules                 ★ authorization layer
firestore.indexes.json          composite indexes (none needed today)
firebase.json, .firebaserc      hosting (SPA) + firestore + emulators
vitest.config.ts                projects: unit (node) + storybook (Chromium)
eslint.config.mjs               ESLint flat config
*.drawio                        old diagrams (predate the Firebase-direct rewrite)
```

## 6. Firestore data model

| Collection | Doc id | Key fields | Access (see rules) |
|---|---|---|---|
| `users` | auth uid | `email`, `role`, `profile{name,surname,phone}`, `companyRef` | owner, moderator |
| `companies` | auto | `name`, `nip`, `city`, `address`, `phone`, `openingTime`, `closingTime`, `services[]`, `ownerUid`, `status` (`pending`/`approved`/`suspended`), `contractSignedAt`, `hourlyRate`, `deletedAt` | read: signed in · owner edits profile fields · moderator all |
| `companies/{id}/priceList` | auto | `serviceKey`, `name`, `laborHours{min,max}`, `partsCost{economy,standard,premium}{min,max}`, `deletedAt` | read: signed in · write: owner, moderator |
| `companies/{id}/slots` | ISO hour | `date`, `userUid`, `fixRef` | read: signed in · create once · delete: participant/moderator |
| `cars` | auto | `manufacturer`, `model`, `productionYear`, `vin`, `userRef`, `deletedAt` | owner, moderator (read) |
| `fixes` | auto | `date`, `bookDate`, `userRef`, `companyRef`, `car` (snapshot), `services[]`, `description`, `clientName`, `clientPhone`, `marketingConsent`, `notifications[]`, `isClosed`, `estimate{min,max}`, `createdBy`, `confirmed`, `proposal`, `reviewed` | client, workshop, moderator – field-level updates per role |
| `services` | key | `key`, `namePl`, `nameEn`, `active`, `order`, `deletedAt` | read: everyone · write: moderator |
| `reviews` | fix id | `companyRef`, `fixRef`, `userRef`, `authorName`, `rating`, `comment`, `hidden`, `createdAt`, `deletedAt` | read: visible ones · create: the fix's client · moderate: moderator |

References between documents are stored as document **paths** (`users/abc`, `companies/xyz`) in `*Ref` fields.

Repair statuses (`notifications[].notificationType`): `getCar`, `addQuote`, `addGiveBackTime`, `addExpense`,
`giveBackCar`, `userCancel`, `workshopCancel`, `moderatorCancel`, `changeProposed`, `changeAccepted`,
`changeRejected`, `bookingConfirmed`. Closing ones: `giveBackCar` and the three cancellations.
