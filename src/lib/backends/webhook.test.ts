import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildChatPayload, extractJsonContent, uploadFileRequest } from './webhook';

vi.spyOn(console, 'error').mockImplementation(() => {});

describe('buildChatPayload', () => {
  it('trims the message and includes session metadata', () => {
    const payload = buildChatPayload('  hello  ', 'sess-1', []);
    expect(payload.message).toBe('hello');
    expect(payload.sessionId).toBe('sess-1');
    expect(payload.timestamp).toBeTruthy();
    expect(payload.attachments).toEqual([]);
  });
});

describe('extractJsonContent', () => {
  it('prefers output.response, then response/message/content', () => {
    expect(extractJsonContent({ output: { response: 'a' } })).toBe('a');
    expect(extractJsonContent({ output: 'b' })).toBe('b');
    expect(extractJsonContent({ response: 'c' })).toBe('c');
    expect(extractJsonContent({ message: 'd' })).toBe('d');
    expect(extractJsonContent({ content: 'e' })).toBe('e');
  });

  it('stringifies unknown shapes instead of crashing', () => {
    const data = { weird: 123 };
    expect(extractJsonContent(data)).toBe(JSON.stringify(data));
  });
});

describe('uploadFileRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns success:true with the parsed body for 2xx responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', file_id: 'file_123' }),
      })
    );
    const result = await uploadFileRequest(new File(['x'], 'a.txt'), 'http://x/upload');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ status: 'success', file_id: 'file_123' });
  });

  it('returns success:false for server rejections instead of a mock success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' })
    );
    const result = await uploadFileRequest(new File(['x'], 'a.txt'), 'http://x/upload');
    expect(result.success).toBe(false);
    expect(result.message).toContain('401');
  });

  it('falls back to a mock success only when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const result = await uploadFileRequest(new File(['x'], 'a.txt'), 'http://x/upload');
    expect(result.success).toBe(true);
    expect(JSON.stringify(result.data)).toContain('file_mock_');
  });

  it('surfaces unexpected errors (e.g. malformed JSON) instead of masking them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => Promise.reject(new SyntaxError('bad')) })
    );
    await expect(uploadFileRequest(new File(['x'], 'a.txt'), 'http://x/upload')).rejects.toThrow(
      SyntaxError
    );
  });
});
