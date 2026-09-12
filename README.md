# React + Tailwind Template

A minimal, production-ready starter built with React 19, TypeScript, Vite, Tailwind CSS v4, and React Router v7.

## Stack

| Tool | Version | Purpose |
|---|---|---|
| [React](https://react.dev) | 19 | UI library |
| [TypeScript](https://www.typescriptlang.org) | 6 | Type safety |
| [Vite](https://vite.dev) | 8 | Dev server & bundler |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Utility-first styling |
| [React Router](https://reactrouter.com) | 7 | Client-side routing |

## Getting started

```bash
npm install
npm run dev
```

## What to update when starting a new app

### 1. App name & metadata
- `index.html` — update `<title>` and `<link rel="icon">`
- `package.json` — update `"name"` and `"version"`
- `src/App.tsx` — update the logo/brand text in the header and footer copyright

### 2. Navigation
- `src/App.tsx` — add or remove `<NavLink>` entries in the header nav to match your routes

### 3. Routes & pages
- `src/App.tsx` — add `<Route>` entries inside `<Routes>`
- `src/pages/` — add a new `.tsx` file for each route; `Home.tsx`, `About.tsx`, and `NotFound.tsx` are included as starting points

### 4. Colors & theme
- Tailwind v4 has no config file — override the default theme in `src/index.css` using `@theme`:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-brand: #6366f1;
  --font-sans: "Inter", sans-serif;
}
```

## Dark mode

Dark mode is class-based (`dark` on `<html>`). The toggle in the header sets it; initial state is read from `prefers-color-scheme`. Use `dark:` variants in Tailwind as normal:

```tsx
<div className="bg-white dark:bg-gray-900">...</div>
```

## Project structure

```
src/
  pages/          # One file per route
    Home.tsx
    About.tsx
    NotFound.tsx
  App.tsx         # Root layout: router, header, footer, dark mode state
  main.tsx        # React entry point
  index.css       # Tailwind import + @custom-variant dark + @theme overrides
index.html        # HTML shell — update title and favicon here
```

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Type-check + production build → dist/
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint
```
