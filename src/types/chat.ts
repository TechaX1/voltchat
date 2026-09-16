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
  data?: UploadResponseData;
  message?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  webhookConfig: WebhookConfig;
}
