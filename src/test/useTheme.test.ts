import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

type UseThemeModule = typeof import('@/hooks/useTheme');

// The hook reads the default theme at module scope, so stub the env before
// each fresh import.
const loadHook = async () => {
  vi.resetModules();
  const mod: UseThemeModule = await import('@/hooks/useTheme');
  return mod.useTheme;
};

beforeEach(() => {
  vi.stubEnv('VITE_DEFAULT_THEME', 'dark');
  localStorage.clear();
  document.documentElement.className = '';
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('useTheme', () => {
  it('cycles dark → light → deep-dark → dark', async () => {
    const useTheme = await loadHook();
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('deep-dark');

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('persists the theme to localStorage', async () => {
    const useTheme = await loadHook();
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());

    expect(localStorage.getItem('voltchat-theme')).toBe('light');
  });

  it('applies the theme class to the document root', async () => {
    const useTheme = await loadHook();
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());
    const root = document.documentElement;

    expect(root.classList.contains('light')).toBe(true);
    expect(root.classList.contains('dark')).toBe(false);
  });

  it('deep-dark keeps the base dark class alongside deep-dark', async () => {
    const useTheme = await loadHook();
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());
    act(() => result.current.toggleTheme());

    const root = document.documentElement;
    expect(result.current.theme).toBe('deep-dark');
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.classList.contains('deep-dark')).toBe(true);
    expect(root.classList.contains('light')).toBe(false);
  });
});
