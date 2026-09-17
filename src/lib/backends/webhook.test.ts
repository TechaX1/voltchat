import { describe, it, expect } from 'vitest';
import { buildChatPayload, extractJsonContent } from './webhook';

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
