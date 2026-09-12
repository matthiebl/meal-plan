# Meal Plan — Specification

This document is the single source of truth for what this app is. It describes the app
in the present tense as a set of requirements. It is not a change log — see `CLAUDE.md`
for how to maintain it.

## 1. Purpose

A single-screen app for two things:

1. **Recording what has been cooked**, so it is possible to see what has not been cooked
   in a while.
2. **Planning roughly the next week of meals**, so shopping and each night's cooking are
   decided in advance.

There is no user concept. All data is public and shared. There is no authentication UI.

## 2. Stack

| Concern | Choice |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (`@theme` tokens in `src/index.css`, class-based dark mode) |
| Routing | React Router 7 |
| Data | Firebase Firestore (web SDK), accessed directly from the frontend |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` |
| Dates | `date-fns` |

All application logic runs on the frontend. There is no backend service and no Cloud
Functions. Firestore is the only persistence layer.

A backend is introduced only if one of these becomes a requirement: a server-held secret
(e.g. LLM recipe import, server-side recipe scraping), scheduled work (e.g. a weekly
shopping-list push), or private per-user data. None of these are in scope.

## 3. Data model

Three Firestore collections. **All dates are stored as `YYYY-MM-DD` local-date strings.
Dates are never stored as `Timestamp`.** This avoids timezone off-by-one errors and sorts
lexicographically.

```ts
// meals/{mealId}
type Meal = {
  name: string
  servings: number          // estimated servings per cook
  visual: {
    color: ColorToken       // one of the 10 tokens in §5
    fill: 'solid' | 'soft' | 'outline'
    icon?: string           // single emoji, optional
  }
  archived?: boolean        // soft delete; history continues to render
  createdAt: Timestamp
}

// cooks/{cookId}
type Cook = {
  mealId: string
  date: string              // 'YYYY-MM-DD'
  kind: 'cook' | 'leftovers'
  order: number             // position within that day, 0-based
  fromCookId?: string       // leftovers only: the cook it came from
  createdAt: Timestamp
}

// weeks/{saturdayISO}
type Week = {
  shopDate: string          // 'YYYY-MM-DD'; defaults to that week's Saturday
}
```

Requirements on this model:

- **`cooks` is both the plan and the history.** A cook with a future date is a plan; a cook
  with a past date is a record. There is no separate history collection and no "mark as
  done" step.
- **`order` is reindexed integers, not fractional ranks.** On every drop, the affected
  day's cooks are rewritten with consecutive `order` values in a single `writeBatch`. At
  most two days are affected by any one drop.
- **Leftovers are their own `Cook` documents**, not a field on the parent cook. They
  reorder and re-drag like any other cook and survive deletion of the parent.
  `fromCookId` exists only for display.
- **Nothing derived is denormalized onto `Meal`.** There is no cached `lastEatenAt`. All
  statistics in §4 are computed on the frontend from the cook list.
- Meals are never hard-deleted while cooks reference them; they are archived. Archived
  meals are hidden from the meal list but still render in the planner.

### Reads

Two `onSnapshot` subscriptions: all meals, and all cooks. The full cook history is held in
memory (on the order of a few hundred documents per year). If volume ever makes this
unreasonable, the escape hatch is a `where('date', '>=', bound)` query on `cooks` plus
denormalized per-meal stats — not a backend.

## 4. Derived statistics

A single hook groups cooks by `mealId` and computes, per meal:

| Field | Definition |
|---|---|
| `lastEaten` | the greatest cook date **on or before today**, counting both `cook` and `leftovers` |
| `daysSince` | calendar days from `lastEaten` to today; `null` if never eaten |
| `timesCooked` | count of `kind: 'cook'` documents |
| `nextPlanned` | the smallest cook date **after today**, if any |

`nextPlanned` is displayed on the meal card so a meal already scheduled later in the week
is not planned twice.

## 5. Visual system

Each meal carries its own visual style, and that style renders identically everywhere the
meal's id appears — meal card, week chip, month chip.

All three visual dimensions are closed sets. There is no free colour picker, because
arbitrary colours break palette coherence and dark-mode contrast.

1. **Colour** — exactly ten tokens: `slate`, `rose`, `red`, `amber`, `lime`, `emerald`,
   `teal`, `sky`, `indigo`, `violet`. Each is defined in `src/index.css` under `@theme` as
   a light/dark pair so contrast holds in both themes.
2. **Fill** — exactly three treatments:
   - `solid` — saturated background, with whichever of near-black or white text contrasts
     against that token in that theme. The ten tokens span a wide lightness range and all
     lighten under `.dark`, so one fixed text colour is unreadable on several of them.
   - `soft` — ~10% tinted background, coloured text
   - `outline` — transparent background, coloured border
3. **Icon** — an optional single emoji rendered before the name.

**Leftovers styling is derived, never chosen.** A `leftovers` cook renders with its meal's
colour plus: a dashed left edge, a `↩` prefix, and reduced opacity. This treatment is
fixed so leftovers are recognisable by construction. The prefix carries a
text-presentation selector (`U+FE0E`); bare `↩` is drawn on most systems as a blue
emoji tile that reads as an unrelated icon.

## 6. Layout and interaction

A full-height two-pane shell. Below the `md` breakpoint the panes stack into one column,
meal library above planner, with the meal library capped to 40% of the viewport height so
both panes scroll independently within their own space rather than one pushing the other
off-screen. There is a dark-mode toggle.

### Left pane — meal library

A single large scrolling list of every non-archived meal. Each meal card shows:

- name (with icon, if set)
- estimated servings
- last eaten date and days since (or a `never` badge)
- times cooked
- next planned date, if any

Days since is the card's headline figure, set apart from the rest of the line, because
it is what the default sort orders by.

Controls: a name search, and a sort selector over **days since (descending, default)**,
name, servings, and times cooked. The default sort is the answer to "what has not been
cooked in a while"; no separate view exists for that.

Meals are created and edited in a dialog covering name, servings, and the three visual
dimensions from §5.

**A search that matches nothing offers to create that meal, with the name prefilled.**
Coming up empty is the moment the meal is most likely missing from the library, so it is
the moment to offer to add it, rather than making it a separate trip to a New meal
button.

### Right pane — planner

Two views. One toolbar at the top of the pane carries everything that moves the planner
— previous, next, **today**, and the week/month switch — and serves both views, so
neither spends vertical space on navigation of its own.

**Week view** (the primary view):

- Saturday through to the following Saturday inclusive — eight day rows.
- Each day is a horizontal band; its cooks sit side by side and the band grows as cooks
  are added. There is no limit on cooks per day.
- The eight rows share the pane's height, growing past an equal share only when a day
  fills up. They do not bunch at the top of a tall window.
- The width a day's cooks have not filled is that day's add button, so spare room reads
  as somewhere to drop a meal rather than as emptiness.
- Both Saturdays carry a shop-day marker. The marker can be moved to the Sunday of that
  week, persisted as `weeks/{saturdayISO}.shopDate`. Its slot is reserved on every row,
  so a day carrying one is no taller than its neighbours.
- Today's row is highlighted and its date circled.

**Month view** (for historical browsing):

- A Sunday-to-Saturday grid, six rows.
- Compact chips: colour dot plus truncated meal name. A day with more cooks than its
  cell fits ends in a `+n more` line rather than clipping them.
- Not a drag target. Clicking a day switches to the week view containing that day.
- Today's cell is highlighted; days outside the displayed month are dimmed.

### Routes

- `/` — the current week
- `/week/:date` — the week containing `date`
- `/month/:ym` — that month

Browser back and forward navigate between weeks and months.

### Drag and drop

One `DndContext` wraps both panes. Four gestures:

| Drag handle | From → to | Effect |
|---|---|---|
| Meal card | left pane → a day | create a `cook` at the drop index |
| Cook chip | within its own day | reindex `order` |
| Cook chip | one day → another day | update `date`, insert at drop index, reindex both days |
| Leftovers tab on a cook chip | → a day | create a `leftovers` cook with `fromCookId` set |

Requirements:

- The leftovers gesture is an **explicit small grab-tab on the cook chip**, not a modifier
  drag. It must be discoverable without instruction and must work on touch. Dragging the
  tab places leftovers on any day; clicking it adds them to the next day, which is the
  answer nearly every time.
- Every day row is its own droppable, so empty days accept drops.
- A `DragOverlay` renders the floating chip.
- Reordering and moving between days must feel immediate, because re-planning mid-week is
  the common case.
- There is no hand-rolled optimistic state. Firestore applies local writes to `onSnapshot`
  immediately, so the write is the update.
- **Nothing in the UI waits on a write.** A Firestore write promise settles only when the
  server acknowledges it, which offline never happens, so awaiting one holds a dialog
  open or a button disabled long after the change is on screen. Mutations issue the write
  and return; failures are logged.
- Every drag gesture has a click/keyboard equivalent: each day row's add button adds a
  cook, and cook chips can be moved and deleted without dragging. Drag is never the only
  path.
- The day row's meal picker searches the library, and on no match offers to create that
  meal with the name prefilled. The new meal is planned on that day as well as added to
  the library — planning it is why it was searched for.
- A cook chip's `⋯` menu offers **move to** and **add leftovers to** as a strip of the
  week's eight days — a small calendar to point at, never a list of day names to read
  down. It also reorders the chip within its day and removes it.
- A cook chip's menu and a day's meal picker flip above or right-align themselves when
  there is no room below. Both panes scroll, so a panel that always opened downwards
  would be clipped.
- An open panel, **and the chip that owns it**, are raised above the rest of the planner.
  A cook chip carries a drag transform, which makes it a stacking context, so a z-index
  on the panel alone cannot lift it over later rows — whose own add buttons are
  positioned, and would otherwise paint straight through the open panel.
- Removing a cook, and adding leftovers to a day, are undoable: a toast names what
  changed and offers Undo for a few seconds. Removal is the only hard,
  irreversible-by-default delete in the app, since meals are archived rather than deleted
  (see §3) and weeks are never deleted at all.

## 7. Firebase and access control

- Config is read from `.env.local` as `VITE_FIREBASE_*` variables (`*.local` is already
  gitignored). The config is never committed.
- The app calls `signInAnonymously` on boot. There is no login UI and no user concept in
  the interface.
- `firestore.rules` is committed to the repository. Rules require `request.auth != null`
  for both reads and writes, and validate document shape for `meals`, `cooks`, and
  `weeks`. Anonymous auth exists solely to stop scripted access by anyone who reads the
  Firebase config out of the JS bundle.
- Deployment target is Firebase Hosting.

## 8. File structure

```
src/
  types.ts               # Meal, Cook, Week, ColorToken, MealStats
  lib/
    firebase.ts          # app init, db handle, anonymous sign-in
    dates.ts             # Saturday-week maths, month grid, ISO helpers
    visuals.ts           # colour tokens, fill treatments, chip class builder
    planner.ts           # cooksOnDate: a day's cooks sorted by order
    dnd.ts               # drag id helpers, DragData/DropData payload types
  data/
    useMeals.ts          # onSnapshot over meals
    useCooks.ts          # onSnapshot over cooks
    useMealStats.ts      # derives the §4 statistics
    useWeekMeta.ts       # shop-day read/write
    mutations.ts         # addMeal, updateMeal, archiveMeal, addCook, insertCook,
                         # moveCook, reorderDay, addLeftovers, deleteCook, setShopDate
  components/
    MealList.tsx
    MealCard.tsx
    MealDialog.tsx       # create/edit
    VisualPicker.tsx
    Planner.tsx          # view switch
    WeekView.tsx
    DayRow.tsx
    CookChip.tsx
    MonthView.tsx
    DragOverlayChip.tsx
    Popover.tsx          # anchored panel that flips to stay on screen:
                         # the day picker, the cook chip menu
  App.tsx                # two-pane shell, routes, dark mode, DndContext
  main.tsx
  index.css              # Tailwind import, dark variant, @theme colour tokens
firestore.rules
```

## 9. Build order

Phases 1–4 are the product; 5–6 are comfort. Update these boxes as work lands.

- [x] **1. Foundations** — remove the template's `src/pages/` and demo layout; two-pane
      shell with dark toggle; `lib/firebase.ts` with anonymous auth; `types.ts`;
      `lib/dates.ts`; colour tokens in `index.css`; `firestore.rules`.
- [x] **2. Meals** — `useMeals`; left pane list with search and sort; meal create/edit
      dialog with visual picker; archive. *Checkpoint: the real meal library can be
      entered.*
- [x] **3. Week planner** — eight Sat→Sat day rows; cook chips; add via `+`; delete;
      `useMealStats` wired into the left pane. *Checkpoint: usable for planning without
      dragging.*
- [x] **4. Drag and drop** — all four gestures from §6; batch reindexing; drag overlay.
      *Checkpoint: the app as specified.*
- [x] **5. Month view and shop day** — historical grid; click-through to week; movable
      shop marker.
- [x] **6. Polish** — empty states, mobile stacking, undo for deletes, README, deploy.

## 10. Forward compatibility

Ingredients, recipes, and methods are **not** in scope, but the schema must not need
migrating when they arrive. Two standing constraints:

- **`meals/{mealId}` stays narrow.** The left pane loads every meal on boot, so ingredient
  lists and method text must never be added to that document. They belong in a
  subdocument (`meals/{mealId}/detail/recipe`) fetched on demand. The `Meal` type in §3 is
  the list-view projection and is to be kept that way.
- **`mealId` is the stable spine.** Cooks reference `mealId` and never copy meal fields, so
  a meal gaining a recipe, photo, or ingredient list changes nothing about existing
  history. Shopping-list generation later resolves as: this week's cooks → their `mealId`s
  → their ingredient subcollections.

## 11. Out of scope

The app does not include: ratings, prep or cook time, tags or categories, per-cook
serving overrides, shopping lists, meal photos, recipe or ingredient storage, any "done"
or "skipped" state on a cook, accounts, or sharing controls.
