export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'error';

export interface Attachment {
  name: string;
  type: string;
  fileId: string;
  url?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  attachments?: Attachment[];
}

export interface WebhookConfig {
  url: string;
  isConnected: boolean;
  isExternal?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  webhookConfig: WebhookConfig;
}
