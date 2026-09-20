export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'error';

export interface Attachment {
  name: string;
  type: string;
  fileId: string;
  url?: string;
}

export type ToolCallStatus = 'running' | 'done' | 'error';

export interface ToolCall {
  id: string;
  name: string;
  status: ToolCallStatus;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  attachments?: Attachment[];
  toolCalls?: ToolCall[];
}

export interface WebhookConfig {
  url: string;
  isConnected: boolean;
  isExternal?: boolean;
}

export interface UploadResponseData {
  status?: string;
  file_id?: string;
  fileId?: string;
  [key: string]: unknown;
}

export interface UploadResult {
  success: boolean;
  /** True when the file was not really uploaded (demo mode, or upload endpoint unreachable and the demo fallback kicked in). */
  simulated?: boolean;
  /** Error details when a real upload attempt failed and the simulated fallback was used instead. */
  message?: string;
  data?: UploadResponseData;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  webhookConfig: WebhookConfig;
}
