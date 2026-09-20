import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { UploadResult } from '@/types/chat';

type UseChatModule = typeof import('@/hooks/useChat');

// The hook reads VITE_* values at module scope, so stub the env before each
// fresh import (the project .env sets VITE_WEBHOOK_URL, which would otherwise
// put every test in "external" mode).
const loadHook = async () => {
  vi.resetModules();
  const mod: UseChatModule = await import('@/hooks/useChat');
  return mod.useChat;
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const makeFile = (name = 'notes.txt') => new File(['hello'], name, { type: 'text/plain' });

describe('useChat.uploadFile', () => {
  it('simulates the upload in demo mode and marks it as simulated', async () => {
    vi.stubEnv('VITE_WEBHOOK_URL', '');
    vi.stubEnv('VITE_UPLOAD_URL', '');
    const useChat = await loadHook();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useChat());

    let uploadResult!: UploadResult;
    await act(async () => {
      uploadResult = await result.current.uploadFile(makeFile());
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.simulated).toBe(true);
  });

  it('returns the server payload on a real successful upload', async () => {
    vi.stubEnv('VITE_WEBHOOK_URL', 'http://test/chat');
    vi.stubEnv('VITE_UPLOAD_URL', 'http://test/upload');
    const useChat = await loadHook();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', file_id: 'file_123' }),
    }));

    const { result } = renderHook(() => useChat());

    let uploadResult!: UploadResult;
    await act(async () => {
      uploadResult = await result.current.uploadFile(makeFile());
    });

    expect(uploadResult.success).toBe(true);
    expect(uploadResult.simulated).toBeUndefined();
    expect(uploadResult.message).toBeUndefined();
    expect(uploadResult.data?.file_id).toBe('file_123');
  });

  it('falls back to a simulated attachment — marked as such — when the upload server is unreachable', async () => {
    vi.stubEnv('VITE_WEBHOOK_URL', 'http://test/chat');
    vi.stubEnv('VITE_UPLOAD_URL', 'http://test/upload');
    const useChat = await loadHook();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const { result } = renderHook(() => useChat());

    let uploadResult!: UploadResult;
    await act(async () => {
      uploadResult = await result.current.uploadFile(makeFile());
    });

    // Never a bare fake success: simulated must be set and the error surfaced.
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.simulated).toBe(true);
    expect(uploadResult.message).toBe('Failed to fetch');
  });
});

describe('useChat webhook configuration', () => {
  it('starts external and blocks manual URL updates when VITE_WEBHOOK_URL is set', async () => {
    vi.stubEnv('VITE_WEBHOOK_URL', 'http://env-server/chat');
    const useChat = await loadHook();

    const { result } = renderHook(() => useChat());

    expect(result.current.webhookConfig.url).toBe('http://env-server/chat');
    expect(result.current.webhookConfig.isExternal).toBe(true);
    expect(result.current.webhookConfig.isConnected).toBe(true);

    act(() => result.current.updateWebhookUrl('http://manual/chat'));

    expect(result.current.webhookConfig.url).toBe('http://env-server/chat');
  });

  it('allows manual URL updates when no VITE_WEBHOOK_URL is configured', async () => {
    vi.stubEnv('VITE_WEBHOOK_URL', '');
    const useChat = await loadHook();

    const { result } = renderHook(() => useChat());

    expect(result.current.webhookConfig.isExternal).toBe(false);

    act(() => result.current.updateWebhookUrl('http://manual/chat'));

    expect(result.current.webhookConfig.url).toBe('http://manual/chat');
    expect(result.current.webhookConfig.isConnected).toBe(true);
    expect(result.current.webhookConfig.isExternal).toBe(false);
  });
});
