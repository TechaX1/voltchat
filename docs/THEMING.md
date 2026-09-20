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

`index.html` uses Vite `%VITE_*%` placeholders, so branding applies at build time.
Build-time fallbacks for those placeholders live in `vite.config.ts`
(`HTML_ENV_DEFAULTS`) so `npm run build` works even with no `.env` — any key
defined in `.env` overrides the fallback. Runtime overrides after build are not
supported — rebuild to rebrand.

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
