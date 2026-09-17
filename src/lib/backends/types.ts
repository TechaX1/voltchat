import type { Attachment } from '@/types/chat';

export interface ChatRequestPayload {
  message: string;
  sessionId: string;
  timestamp: string;
  attachments: Attachment[];
}

export interface UploadResult {
  success: boolean;
  data?: unknown;
  message?: string;
}

// Backend helpers live in this folder: `webhook.ts` (HTTP transport) and
// `demo.ts` (local canned responses). Hooks/components must call these helpers
// instead of `fetch` directly. See docs/BACKEND_CONTRACT.md.
