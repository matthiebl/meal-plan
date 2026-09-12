# CLAUDE.md

A meal planner: a meal library on the left, a Sat→Sat week planner on the right. React 19 +
Vite + Tailwind v4, with Firestore accessed directly from the frontend. No backend.

## Start here

**[PLAN.md](PLAN.md) is the single source of truth.** Read it before doing any work. It
specifies the data model, the visual system, the layout, the drag-and-drop gestures, and
the build order. Section 9 tracks which phases are done.

Do not infer requirements from the code when PLAN.md covers them. If the code and PLAN.md
disagree, one of them is wrong — fix the code, or correct the requirement in PLAN.md. Never
leave a note describing the disagreement.

## Maintaining PLAN.md

PLAN.md describes the app as it is specified, in the present tense. It is a specification,
not a history of how the specification got there.

- **When a decision changes, rewrite the affected requirement in place.** Edit the sentence
  or table row so it states the new requirement as though it had always been the
  requirement. Delete what it replaced.
- **When a new requirement comes up, slot it into the section it belongs to.** New
  requirements go inside §3 Data model, §6 Layout and interaction, and so on — never into
  an appendix, and never at the end of the document.
- **Never add** a changelog, a decisions section, dates, version markers, or phrasing like
  "previously", "changed from", "we decided", "note that this used to". If such text
  appears in PLAN.md, remove it and fold the surviving requirement into place.
- **Keep the voice declarative.** "Dates are stored as `YYYY-MM-DD` strings." Not "we chose
  to store dates as strings because…". A short rationale is fine where it stops someone
  undoing the requirement by accident; a narrative is not.
- **Tick the §9 boxes as phases land**, and update §9 if the remaining work changes shape.
- If something is explicitly ruled out, it goes in §11 Out of scope as a plain statement,
  not as a discussion.

Update PLAN.md in the same change as the code it describes.

## Commands

```bash
npm run dev       # dev server
npm run build     # tsc -b && vite build
npm run lint      # eslint
```

## Conventions

- Dates are `YYYY-MM-DD` local-date strings everywhere. Never a Firestore `Timestamp`, and
  never a `Date` in a document. See PLAN.md §3.
- All derived meal statistics are computed on the frontend from the cook list. Nothing
  derived is denormalized onto a meal document. See PLAN.md §4.
- Colour and fill come from the closed token sets in PLAN.md §5. Do not introduce ad-hoc
  colours or a free colour picker.
- Every drag gesture needs a click or keyboard equivalent. See PLAN.md §6.
