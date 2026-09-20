# Theming & Branding

All branding flows from `.env` → `src/config.ts` (validated with zod) → components.
There are no hardcoded product names in the UI shell.

## Env keys

| Key                    | Used in                                        |
| ---------------------- | ---------------------------------------------- |
| `VITE_APP_NAME`        | header, empty state, `index.html` title/OG     |
| `VITE_APP_DESCRIPTION` | empty state, `index.html` meta/OG              |
| `VITE_APP_LOGO_URL`    | header + empty state logo (empty = Zap icon)   |
| `VITE_FAVICON_URL`     | `index.html` icon link                         |
| `VITE_DEFAULT_THEME`   | `src/hooks/useTheme.ts` initial theme          |

`index.html` ships static branding defaults, so a build with no `.env` still
renders correctly. At startup `src/lib/branding.ts` (imported once in
`src/main.tsx`) overrides the page title, meta description, OG tags and favicon
from the `VITE_APP_*` env values. The component layer reads the same values via
`src/config.ts` — keep both defaults in sync when renaming the app. Runtime
overrides after a production build are not supported — rebuild to rebrand.

## Themes

`useTheme()` cycles `dark → light → deep-dark`, persisted as `voltchat-theme`.
Tokens live in `src/index.css` (`:root.dark`, `:root.deep-dark`, `:root.light` —
all HSL) and are wired into `tailwind.config.ts` (`volt.glow`, `volt.pulse`,
sidebar tokens). To rebrand:

1. Edit the three `:root.*` blocks in `src/index.css`.
2. Keep token names stable — components reference `bg-primary`, `volt-glow`, etc.
3. Check all three themes in the header toggle before shipping.

Fonts (`Inter` + `JetBrains Mono`) are imported in `src/index.css:1` — swap or
self-host there to avoid the Google Fonts dependency.
