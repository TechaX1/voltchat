import type { Attachment } from '@/types/chat';

export type { UploadResult } from '@/types/chat';

export interface ChatRequestPayload {
  message: string;
  sessionId: string;
  timestamp: string;
  attachments: Attachment[];
}

// Backend helpers live in this folder: `webhook.ts` (HTTP transport) and
// `demo.ts` (local canned responses). Hooks/components must call these helpers
// instead of `fetch` directly. See docs/BACKEND_CONTRACT.md.
