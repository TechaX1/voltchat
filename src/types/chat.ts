export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  toolCalls?: ToolCall[];
  reasoning?: ReasoningBlock[];
}

// AG-UI specific types
export type AgUIMessageRole = 'user' | 'assistant' | 'tool' | 'reasoning' | 'system' | 'developer';

export interface ToolCall {
  toolCallId: string;
  toolCallName: string;
  args: string;
  result?: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

export interface AgentState {
  snapshot: Record<string, unknown>;
  lastDelta?: unknown[];
}

export interface ReasoningBlock {
  messageId: string;
  content: string;
  status: 'streaming' | 'complete';
}

export interface AgUIRunState {
  threadId: string;
  runId: string | null;
  isRunning: boolean;
  currentStep?: string;
  agentState: AgentState | null;
}

export interface WebhookConfig {
  url: string;
  isConnected: boolean;
  isExternal?: boolean;
  isAgUI?: boolean;
  agUIUrl?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  webhookConfig: WebhookConfig;
}
