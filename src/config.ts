import { z } from 'zod';

const rawSchema = z.object({
  VITE_WEBHOOK_URL: z.string().trim().optional().default(''),
  VITE_API_TOKEN: z.string().optional().default(''),
  VITE_UPLOAD_URL: z.string().trim().optional().default(''),
  VITE_DEMO_MODE: z.enum(['auto', 'on', 'off']).optional().default('auto'),
  VITE_APP_NAME: z.string().min(1).optional().default('VoltChat'),
  VITE_APP_DESCRIPTION: z
    .string()
    .optional()
    .default('A high-performance chat interface.'),
  VITE_APP_LOGO_URL: z.string().trim().optional().default(''),
  VITE_FAVICON_URL: z.string().trim().optional().default('/favicon.svg'),
  VITE_ENABLE_UPLOADS: z
    .enum(['true', 'false'])
    .optional()
    .default('true'),
  VITE_MAX_ATTACHMENTS: z.coerce.number().int().min(1).max(20).optional().default(5),
  VITE_DEFAULT_THEME: z.enum(['light', 'dark', 'deep-dark']).optional().default('dark'),
});

export type AppConfig = {
  webhookUrl: string;
  apiToken: string;
  uploadUrl: string;
  demoMode: 'auto' | 'on' | 'off';
  appName: string;
  appDescription: string;
  appLogoUrl: string;
  faviconUrl: string;
  enableUploads: boolean;
  maxAttachments: number;
  defaultTheme: 'light' | 'dark' | 'deep-dark';
};

/**
 * appConfig is parsed at import time, so a raw ZodError here would surface as
 * an unactionable stack trace (blank page in production builds). Re-throw with
 * the offending env key named instead.
 */
function parse(raw: Record<string, string | undefined>): AppConfig {
  try {
    return toAppConfig(rawSchema.parse(raw));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues
        .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
        .join('; ');
      throw new Error(`Invalid app configuration — fix the .env values. ${details}`);
    }
    throw error;
  }
}

function toAppConfig(parsed: z.infer<typeof rawSchema>): AppConfig {
  return {
    webhookUrl: parsed.VITE_WEBHOOK_URL,
    apiToken: parsed.VITE_API_TOKEN ?? '',
    uploadUrl: parsed.VITE_UPLOAD_URL,
    demoMode: parsed.VITE_DEMO_MODE,
    appName: parsed.VITE_APP_NAME,
    appDescription: parsed.VITE_APP_DESCRIPTION,
    appLogoUrl: parsed.VITE_APP_LOGO_URL,
    faviconUrl: parsed.VITE_FAVICON_URL,
    enableUploads: parsed.VITE_ENABLE_UPLOADS === 'true',
    maxAttachments: parsed.VITE_MAX_ATTACHMENTS,
    defaultTheme: parsed.VITE_DEFAULT_THEME,
  };
}

export const appConfig: AppConfig = parse(import.meta.env as Record<string, string | undefined>);

/** Resolve whether demo responses should be used for this session. */
export function isDemoMode(webhookUrl: string): boolean {
  if (appConfig.demoMode === 'on') return true;
  if (appConfig.demoMode === 'off') return false;
  return webhookUrl.trim().length === 0;
}

export function parseAppConfig(raw: Record<string, string | undefined>): AppConfig {
  return parse(raw);
}
