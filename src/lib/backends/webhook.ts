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
  const pick =
    (typeof output === 'object' ? output?.response : output) ??
    data.response ??
    data.message ??
    data.content;
  return typeof pick === 'string' ? pick : JSON.stringify(data);
}

/**
 * Upload a file. Falls back to a mock success (same shape) when no upload URL
 * is configured or the server is unreachable, so attachment UI stays testable.
 */
export async function uploadFileRequest(
  file: File,
  uploadUrl: string,
  token = '',
): Promise<UploadResult> {
  if (!uploadUrl) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true, data: { status: 'success', file_id: `file_mock_${generateId()}` } };
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
    if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('[webhook] Upload error, falling back to mock upload:', error);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true, data: { status: 'success', file_id: `file_mock_${generateId()}` } };
  }
}
