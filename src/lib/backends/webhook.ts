import type { Attachment } from '@/types/chat';
import type { ChatRequestPayload, UploadResult } from './types';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function buildChatPayload(
  message: string,
  sessionId: string,
  attachments: Attachment[] = [],
): ChatRequestPayload {
  return {
    message: message.trim(),
    timestamp: new Date().toISOString(),
    sessionId,
    attachments,
  };
}

/** POST a chat message. Throws on non-2xx. Callers handle streaming vs JSON. */
export async function postChat(
  payload: ChatRequestPayload,
  url: string,
  token = '',
): Promise<Response> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response;
}

/** Extract display text from the supported JSON shapes (see docs/BACKEND_CONTRACT.md). */
export function extractJsonContent(data: Record<string, unknown>): string {
  const output = data.output as { response?: unknown } | string | undefined;
  // Empty/whitespace-only strings count as missing so the next field is used
  // (e.g. `{ response: '', message: 'real answer' }` renders 'real answer').
  const nonEmpty = (value: unknown) =>
    typeof value === 'string' && value.trim().length === 0 ? undefined : value;
  const pick =
    nonEmpty(typeof output === 'object' ? output?.response : output) ??
    nonEmpty(data.response) ??
    nonEmpty(data.message) ??
    nonEmpty(data.content);
  return typeof pick === 'string' ? pick : JSON.stringify(data);
}

/**
 * Upload a file. Server rejections (non-2xx) and malformed responses return
 * `success: false` so callers can surface them. A simulated result (same data
 * shape, `simulated: true`) is only used when the request never completed —
 * no URL configured or the server was unreachable (fetch rejects with
 * TypeError) — so attachment UI stays testable.
 */
export async function uploadFileRequest(
  file: File,
  uploadUrl: string,
  token = '',
): Promise<UploadResult> {
  if (!uploadUrl) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      simulated: true,
      data: { status: 'success', file_id: `file_mock_${generateId()}` },
    };
  }
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!response.ok) {
      return {
        success: false,
        message: `Upload failed: HTTP ${response.status} ${response.statusText}`.trim(),
      };
    }
    return { success: true, data: await response.json() };
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    console.error('[webhook] Upload unreachable, falling back to simulated attachment:', error);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      simulated: true,
      message: error instanceof Error ? error.message : 'Upload failed',
      data: { status: 'success', file_id: `file_mock_${generateId()}` },
    };
  }
}
