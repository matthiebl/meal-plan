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
| Hosting | GitHub Pages |

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
  category?: {              // absent until picked; see §5
    main: Category          // one of the 13 categories in §5
    secondary?: Category    // never equal to main
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
- **`category` is optional.** A meal without one renders as uncategorised (§5), so a meal
  without one needs no migration. Saving a meal deletes a cleared
  `category` rather than writing an empty one, and deletes any `visual`, a retired field
  that older meal documents carry.

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

Each cook in the displayed week also carries a detail line, derived the same way
(`cookDetails` in `lib/planner.ts`):

| Cook | Detail |
|---|---|
| `cook` | calendar days from the same meal's previous `kind: 'cook'` date to **this cook's date** (`24 days since last cooked`), or `first time cooked` |
| `leftovers` | `Leftovers from` the parent cook's weekday (or date, when more than six days earlier); `Leftovers` if the parent is gone |

The gap is measured to the cook's own date, not to today, so it reads the same for a plan
as for a record.

## 5. Visual system

### Interface palette

The interface draws from a closed set of tokens defined in `src/index.css` under
`@theme`, each a light/dark pair that swaps under `.dark`, so one class holds in both
themes:

| Token | Role |
|---|---|
| `surface-2` | the ground of both panes |
| `surface-1` | what sits on the ground: cards, chips, fields, pills |
| `surface-3` | raised panels and bottom sheets |
| `ink`, `ink-2`, `ink-3` | primary, secondary, and muted text |
| `line`, `line-strong` | hairlines; dashed and outlined edges |
| `accent`, `accent-soft` | today, the active sort, planned meals, suggested days |
| `primary`, `on-primary` | the one filled button in a group, the current day in a strip, toasts |
| `danger` | Remove and Archive |

Interface icons are inline SVG stroke paths in `components/Icon.tsx`. There is no icon
font and no emoji anywhere in the interface.

### Meal categories

A meal is styled by what it is built on, not by a colour chosen for it. Its category is
picked from a closed set of thirteen, each with a fixed colour hue and a custom SVG icon:

| Group | Categories |
|---|---|
| Protein | `beef` red · `lamb` fuchsia · `pork` pink · `chicken` amber · `egg` yellow · `fish` sky · `seafood` teal · `veggie` green |
| Carb | `pasta` orange · `rice` slate · `noodles` violet · `bread` stone · `potato` lime |

A meal has a **main** category and optionally a **secondary** one, both from the same
set: steak is `beef`; chicken carbonara is `chicken` with `pasta`; dahl is `veggie` with
`rice`. There is no free colour picker and no free icon choice — arbitrary colours break
palette coherence and dark-mode contrast, and a category says more than a colour does.

Every appearance of a meal derives from its category, identically wherever the meal's id
appears:

- **Tile** — the meal's image. The main category's icon on that category's tint. Where
  the tile carries one (meal card, sheet header, editor preview), the secondary
  category is a small round badge in its bottom-right corner, ringed in the colour of the
  surface beneath so it reads as cut out of the tile. Tints are opaque in both themes so
  the badge never blends into the tile.
- **Chips** — the category names as small tinted pills beside the servings line. The
  icons alone do not tell lamb from pork reliably; the names do.
- **Marks** — the main category's colour at full strength, for marks too small to carry a
  tint: the month view's bars and dots.

An uncategorised meal has a neutral tile with a plate icon, no chips, and a grey mark.

**Leftovers styling is derived, never chosen.** A `leftovers` cook renders outlined rather
than filled, with its tile dimmed and its name in secondary text, and a return-arrow in
place of the tile's secondary badge — before the name where a mark stands in for the tile,
as in the month view. This treatment is fixed so leftovers are recognisable by
construction.

## 6. Layout and interaction

A full-height two-pane shell. It fills the viewport exactly and **the document itself
never scrolls** — each pane scrolls within its own space. A page that scrolls as well as
its panes ends at a band of bare body below the app, because a phone's `100vh` is taller
than its visible viewport.

From `md` up, both panes sit side by side beneath one header: the app title on the left,
the planner's toolbar (below) in the centre, and the dark-mode toggle on the right.

Below `md`, **one pane is on screen at a time, chosen by a two-tab bottom bar** — Plan and
Meals. Stacking both panes leaves each too short to work in; separating them gives
whichever is in use the whole screen. There is no app header at this width; each pane
carries a title of its own instead.

Because the two panes are never on screen together on a phone, **every gesture that spans
them has an equivalent that does not** — see the meal card's plan menu below.

**Nothing is typed where it can be tapped.** Text entry is reserved for the two things
that are genuinely free text: a meal's name, and the search boxes. Servings, sort order,
category, and every choice of day are tapped from a fixed set.

### Left pane — meal library

A single large scrolling list of every non-archived meal. Each meal card shows its tile, its
name, its category chips and servings, and a **headline figure** at its right, set apart
from the rest because it is what the list is sorted by:

- sorted by days since or name: days since last eaten (`Today`, or `New` if never eaten) —
  unless the meal is already planned, when it shows `Planned` and the planned day
  instead, and the card carries an accent outline. A meal already scheduled is then not
  planned twice.
- sorted by times cooked: times cooked.

Below `md` the pane is titled "Meals" with the library's size beneath, and the dark-mode
toggle beside it.

Controls: a name search with a New meal button beside it, and sort pills for **days since
(descending, default)**, name, and times cooked; the active pill is tinted and carries a
down arrow. The default sort is the answer to "what has not been cooked in a while"; no
separate view exists for that.

**Clicking a meal card opens its menu**: the displayed week's eight days as a strip, which
plans the meal on the day picked, and an entry to edit the meal. As a sheet, its header
shows when the meal was last eaten and how many times it has been cooked. The strip is the
click equivalent of dragging the card onto a day, and on a phone it is the only path from
the library to the planner.

Meals are created and edited in a dialog: a live preview of the card, then name, servings,
and category (§5). Its header row carries Cancel, the title, and Save, so Save is on
screen however far the form scrolls; Archive is the last row of an existing meal's form.
Servings is a stepper, not a number field. The main category is a grid of labelled icon
tiles, grouped protein then carb, and tapping the chosen tile again clears it; the
secondary category is a row of chips beginning with "Nothing", offered only once a main is
picked, and never offering the main itself. Below `md` the dialog is a bottom sheet.

**A search that matches nothing offers to create that meal, with the name prefilled.**
Coming up empty is the moment the meal is most likely missing from the library, so it is
the moment to offer to add it, rather than making it a separate trip to a New meal
button.

### Right pane — planner

Two views. One set of controls carries everything that moves the planner — previous,
next, **today**, and the week/month switch — and serves both views, so neither spends
vertical space on navigation of its own. From `md` up they are the centre of the app
header, around the displayed week's dates or the month's name. Below `md` they head the
pane, with previous, next, and the switch to the right of a title and subtitle. A week
within one of now is titled by where it sits (`This week`, `Next week`, `Last week`) with
its dates beneath; any other week is titled by its dates with the year beneath; a month
is titled by its name with the year beneath. Today is offered at the end of the subtitle,
and only once the planner has moved away from the current week or month.

**Week view** (the primary view):

- Saturday through to the following Saturday inclusive — eight days. There is no limit on
  cooks per day.
- **Every cook is a card, the same size at every width**: the meal's tile (with its
  secondary badge), its name, and a second line — `Serves n ·` and the cook's detail from
  §4 — with the leftovers tab at its right. A leftovers card's second line is its detail
  alone. A desktop screen has more room than a phone, so a meal never gets less of it
  there.
- **From `md` up, each day is a horizontal band**: its date, its cook cards side by side
  at a fixed width, and a shop-marker slot at the right. The band grows, wrapping onto
  further lines, as cooks are added.
  - The eight rows share the pane's height, growing past an equal share only when a day
    fills up. They do not bunch at the top of a tall window, and each row's contents sit
    vertically centred in its band.
  - The width a day's cooks have not filled is that day's add button, so spare room reads
    as somewhere to drop a meal rather than as emptiness. It is a card's height. On an
    empty day it is a dashed outline, "Add a meal, or drop one here"; beside cooks it is
    invisible until hovered.
  - Today's row is tinted `accent-soft` with "Today" above its date in accent, and its
    cards take `surface-2` so they stand off the tint.
- **Below `md`, the week is a scrolling list of days**, each a heading over its cook cards
  at full width. A phone's width goes to the meal rather than to a date column.
  - The day heading is the date — `Today · Mon 14` in accent for today — with the shop
    marker and, once the day has cooks, a `+` at its right. An empty day is a large dashed
    "Add a meal" card.
  - When the displayed week contains today, the days before today are folded behind an
    "n earlier days" toggle at the top of the list, so the week opens at what is still to
    plan. The fold resets when the displayed week changes.
- **The day's date is its add button** at every width, so a day that already has cooks can
  be added to without aiming at the gap beside them.
- Both Saturdays carry a shop-day marker: a bag and "Shop". The marker can be moved to the
  Sunday of that week, persisted as `weeks/{saturdayISO}.shopDate`; where the shop is not,
  the marker is a faint bag to tap. From `md` up its slot is reserved on every row, so a
  day carrying one is no narrower than its neighbours.

**Month view** (for historical browsing):

- A Sunday-to-Saturday grid, six rows.
- Borderless rounded cells. Each cook is its category mark (§5) plus truncated meal name;
  leftovers are dimmed with a return-arrow. A day with more cooks than its cell fits ends
  in a `+n more` line rather than clipping them. Below `md` each cook is a thin bar in its
  category's colour, since a phone-width cell truncates a name to nothing; the grid is
  followed by the hint "Tap any day to open its week".
- Not a drag target. Clicking a day switches to the week view containing that day.
- Today's cell is tinted `accent-soft`; days outside the displayed month are dimmed.

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
| Cook card | within its own day | reindex `order` |
| Cook card | one day → another day | update `date`, insert at drop index, reindex both days |
| Leftovers tab on a cook card | → a day | create a `leftovers` cook with `fromCookId` set |

Requirements:

- The leftovers gesture is an **explicit small grab-tab on the cook card** — a
  return-arrow at the right end of a `cook` card (leftovers do not carry one) — not a
  modifier drag. It must be discoverable without instruction and must work on touch. Dragging the
  tab places leftovers on any day; clicking it adds them to the next day, which is the
  answer nearly every time.
- Every day row is its own droppable, so empty days accept drops.
- A `DragOverlay` renders the floating card.
- Reordering and moving between days must feel immediate, because re-planning mid-week is
  the common case.
- There is no hand-rolled optimistic state. Firestore applies local writes to `onSnapshot`
  immediately, so the write is the update.
- **Nothing in the UI waits on a write.** A Firestore write promise settles only when the
  server acknowledges it, which offline never happens, so awaiting one holds a dialog
  open or a button disabled long after the change is on screen. Mutations issue the write
  and return; failures are logged.
- Every drag gesture has a click/keyboard equivalent: each day row's add button adds a
  cook, and cook cards can be moved and deleted without dragging. Drag is never the only
  path.
- The day row's meal picker is a search field over the library as meal cards — the same
  full-size cards as the left pane, **sorted longest since cooked first**, planned meals outlined —
  ending in a dashed "New meal" card (`Create "…"` while a search is typed). As a sheet it
  is titled `Add to Tue 15`, with "Longest since cooked first" beneath. Like the library's,
  a search that matches nothing offers to create that meal with the name prefilled. The
  new meal is planned on that day as well as added to the library — planning it is why it
  was searched for.
- **Clicking a cook card opens its menu**, so the card is a tap target before it is a drag
  handle; there is no separate menu button. The menu offers **move to** and **add
  leftovers to** as strips of the week's eight days — a small calendar to point at, never
  a list of day names to read down. In the move strip the card's own day is filled and
  not pickable. In the leftovers strip the card's day and every day before it are
  disabled, and the next day is tinted as the likeliest pick. Below the strips, the menu
  reorders the card earlier or later within its day (when the day has another cook) and
  removes it.
- Drag handles allow vertical panning rather than suppressing touch outright. Chips and
  meal cards cover most of both panes, and a finger landing on one has to be able to
  scroll. The touch sensor starts on a hold, so a swipe scrolls and a hold still drags.
  The leftovers tab is the exception: it is small and precise, and claims the gesture.
- A cook card's menu and a day's meal picker flip above or right-align themselves when
  there is no room below. Both panes scroll, so a panel that always opened downwards
  would be clipped. Below `md` these panels are **bottom sheets** instead — reachable by
  thumb, and never squeezed against an edge. Every sheet has the same header: the tile of
  the meal it acts on where there is one, a title, a subtitle (the day, or the meal's
  history), and a close button. A sheet is portalled to the body: a dragging card carries
  a transform, and a `fixed` descendant of a transformed element positions against that
  element rather than the viewport.
- The meal picker's search field is not focused when it opens on a phone. The library is
  a list to point at, and a keyboard sliding up over it is the opposite of that gesture.
- An open panel, **and the card that owns it**, are raised above the rest of the planner.
  A cook card carries a drag transform, which makes it a stacking context, so a z-index
  on the panel alone cannot lift it over later rows — whose own add buttons are
  positioned, and would otherwise paint straight through the open panel.
- Removing a cook, and adding leftovers to a day, are undoable: a toast names what
  changed and offers Undo for a few seconds. Removal is the only hard,
  irreversible-by-default delete in the app, since meals are archived rather than deleted
  (see §3) and weeks are never deleted at all.

## 7. Firebase, access control, and deployment

- Config is read from `VITE_FIREBASE_*` variables: `.env.local` locally (`*.local` is
  already gitignored), and repository Actions *variables* — not secrets — in CI. Vite
  inlines them into the bundle, so they are public either way; keeping them out of the
  repository only avoids tripping secret scanners.
- The app calls `signInAnonymously` on boot. There is no login UI and no user concept in
  the interface.
- `firestore.rules` is committed to the repository. Rules require `request.auth != null`
  for both reads and writes, and validate document shape for `meals`, `cooks`, and
  `weeks`. Anonymous auth exists solely to stop scripted access by anyone who reads the
  Firebase config out of the JS bundle.
- The app is hosted on GitHub Pages and served from `/meal-plan/`, so Vite's `base` and
  the router's `basename` are both that path.
- Pushing to `master` builds and deploys through `.github/workflows/deploy.yml`. Nothing
  is deployed from a developer machine except `firestore.rules`, which goes out with the
  Firebase CLI.
- GitHub Pages has no rewrites, so the build writes `dist/404.html` as a copy of
  `index.html`. That is what makes a deep link survive a hard refresh.

## 8. File structure

```
src/
  types.ts               # Meal, Cook, Week, Category, MealCategory, MealStats
  lib/
    firebase.ts          # app init, db handle, anonymous sign-in
    dates.ts             # Saturday-week maths, month grid, ISO helpers, labels
    categories.ts        # the category set, and its tile and mark classes
    planner.ts           # cooksOnDate, and cookDetails: each cook's §4 detail line
    mealSort.ts          # sortMeals, shared by the library and the day picker
    plannerRoute.ts      # usePlannerRoute: the displayed week or month, and moves
    dnd.ts               # drag id helpers, DragData/DropData payload types
    responsive.ts        # useIsMobile, for the cases where markup differs, not just CSS
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
    MealSummary.tsx      # a meal card's contents: tile, chips, headline figure
    MealDialog.tsx       # create/edit
    CategoryPicker.tsx   # main tiles and secondary chips
    MealTile.tsx         # a meal's image: category icon, tint, secondary badge
    CategoryChips.tsx    # a meal's category names as small chips
    Icon.tsx             # inline SVG paths: category icons and interface glyphs
    Planner.tsx          # view switch
    PlannerToolbar.tsx   # the planner's controls: desktop header, phone pane header
    WeekView.tsx
    DayRow.tsx
    CookChip.tsx
    MonthView.tsx
    DragOverlayChip.tsx
    DayStrip.tsx         # the week's eight days as buttons, wherever something
                         # is placed on a day without dragging it there
    Popover.tsx          # anchored panel that flips to stay on screen, and is a
                         # bottom sheet below md: the day picker, the cook chip
                         # menu, the meal card menu
  App.tsx                # shell with header and tab bar, routes, dark mode, DndContext
  main.tsx
  index.css              # Tailwind import, dark variant, @theme interface palette
firestore.rules
.github/workflows/deploy.yml   # build and publish to GitHub Pages
```

## 9. Build order

Phases 1–4 are the product; 5–6 are comfort. Update these boxes as work lands.

- [x] **1. Foundations** — remove the template's `src/pages/` and demo layout; two-pane
      shell with dark toggle; `lib/firebase.ts` with anonymous auth; `types.ts`;
      `lib/dates.ts`; colour tokens in `index.css`; `firestore.rules`.
- [x] **2. Meals** — `useMeals`; left pane list with search and sort; meal create/edit
      dialog with category picker; archive. *Checkpoint: the real meal library can be
      entered.*
- [x] **3. Week planner** — eight Sat→Sat day rows; cook chips; add via `+`; delete;
      `useMealStats` wired into the left pane. *Checkpoint: usable for planning without
      dragging.*
- [x] **4. Drag and drop** — all four gestures from §6; batch reindexing; drag overlay.
      *Checkpoint: the app as specified.*
- [x] **5. Month view and shop day** — historical grid; click-through to week; movable
      shop marker.
- [x] **6. Polish** — empty states, undo for deletes, README, deploy.
- [x] **7. Phone** — tabbed panes under a bottom bar, bottom sheets, tap equivalents for
      everything that spanned the two panes, condensed spacing.
- [x] **8. Categories and redesign** — meal categories with SVG tiles, chips, and marks;
      interface palette tokens; toolbar in the desktop header; pane headers on a phone;
      sort pills; phone month bars; the phone week as a list of cook cards with earlier
      days folded; the picker as sorted cards.

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

The app does not include: ratings, prep or cook time, free-form tags, categories beyond
the closed set in §5, per-cook
serving overrides, shopping lists, meal photos, recipe or ingredient storage, any "done"
or "skipped" state on a cook, accounts, or sharing controls.
