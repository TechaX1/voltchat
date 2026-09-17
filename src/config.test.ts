import { describe, it, expect } from 'vitest';
import { parseAppConfig, isDemoMode } from '@/config';

describe('parseAppConfig', () => {
  it('applies template defaults for an empty env', () => {
    const config = parseAppConfig({});
    expect(config.appName).toBe('VoltChat');
    expect(config.enableUploads).toBe(true);
    expect(config.maxAttachments).toBe(5);
    expect(config.defaultTheme).toBe('dark');
    expect(config.demoMode).toBe('auto');
    expect(config.webhookUrl).toBe('');
  });

  it('parses demo mode, uploads, and branding overrides', () => {
    const config = parseAppConfig({
      VITE_WEBHOOK_URL: 'https://api.example.com/chat',
      VITE_DEMO_MODE: 'off',
      VITE_ENABLE_UPLOADS: 'false',
      VITE_MAX_ATTACHMENTS: '3',
      VITE_APP_NAME: 'MyChat',
      VITE_DEFAULT_THEME: 'light',
    });
    expect(config.webhookUrl).toBe('https://api.example.com/chat');
    expect(config.demoMode).toBe('off');
    expect(config.enableUploads).toBe(false);
    expect(config.maxAttachments).toBe(3);
    expect(config.appName).toBe('MyChat');
    expect(config.defaultTheme).toBe('light');
  });

  it('rejects invalid enum values', () => {
    expect(() => parseAppConfig({ VITE_DEMO_MODE: 'sometimes' })).toThrow();
    expect(() => parseAppConfig({ VITE_DEFAULT_THEME: 'neon' })).toThrow();
  });
});

describe('isDemoMode', () => {
  it('returns true when no webhook URL is configured (auto)', () => {
    expect(isDemoMode('')).toBe(true);
  });

  it('returns false when a webhook URL is configured (auto)', () => {
    expect(isDemoMode('https://api.example.com/chat')).toBe(false);
  });
});
