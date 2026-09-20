/**
 * Single source of truth for app branding.
 *
 * index.html ships static defaults so a build without a .env file still renders
 * correctly; this module overrides them at startup when VITE_* values exist.
 * Import it once, before any component renders (see src/main.tsx).
 */

const env = import.meta.env;

export const APP_NAME: string = env.VITE_APP_NAME || 'VoltChat';
export const APP_DESCRIPTION: string =
  env.VITE_APP_DESCRIPTION || 'A high-performance chat interface.';
export const APP_LOGO_URL: string = env.VITE_APP_LOGO_URL || '';

document.title = APP_NAME;

const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) metaDescription.setAttribute('content', APP_DESCRIPTION);

const ogTitle = document.querySelector('meta[property="og:title"]');
if (ogTitle) ogTitle.setAttribute('content', APP_NAME);

const ogDescription = document.querySelector('meta[property="og:description"]');
if (ogDescription) ogDescription.setAttribute('content', APP_DESCRIPTION);

if (env.VITE_FAVICON_URL) {
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) favicon.setAttribute('href', env.VITE_FAVICON_URL);
}
