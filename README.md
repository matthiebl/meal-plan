# Meal Plan

A single-screen meal planner: a meal library on the left, a Saturday-to-Saturday week
planner on the right. See [PLAN.md](PLAN.md) for the full specification and
[CLAUDE.md](CLAUDE.md) for how this repository is maintained.

## Stack

React 19 + TypeScript, Vite, Tailwind CSS v4, React Router 7, `@dnd-kit`, and Firebase
Firestore accessed directly from the frontend. There is no backend.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Firebase project's web app config
npm run dev
```

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Type-check + production build → dist/
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint
```

## Firebase

`firestore.rules` is committed and deployed with the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```
