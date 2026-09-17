import { describe, it, expect } from 'vitest';
import { getDemoResponse } from './demo';

describe('getDemoResponse', () => {
  it('mentions uploaded files', () => {
    const reply = getDemoResponse('hi', [{ name: 'a.pdf', type: 'PDF', fileId: 'x' }]);
    expect(reply).toContain('a.pdf');
    expect(reply).toContain('demo mode');
  });

  it('returns a python code block for code questions', () => {
    const reply = getDemoResponse('give me python code for snake');
    expect(reply).toContain('```python');
  });

  it('returns a markdown table for table questions', () => {
    const reply = getDemoResponse('show me a markdown table of fruits');
    expect(reply).toContain('| Fruit |');
  });

  it('answers webhook questions with setup guidance', () => {
    const reply = getDemoResponse('how do I set the webhook?');
    expect(reply).toContain('VITE_WEBHOOK_URL');
  });
});
