import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, WebhookConfig, Attachment } from '@/types/chat';
import { appConfig, isDemoMode } from '@/config';
import { getDemoResponse } from '@/lib/backends/demo';
import { buildChatPayload, extractJsonContent, postChat, uploadFileRequest } from '@/lib/backends/webhook';

const WEBHOOK_STORAGE_KEY = 'voltchat-webhook-url';
const MESSAGES_STORAGE_KEY = 'voltchat-messages';
const SESSION_ID_STORAGE_KEY = 'voltchat-session-id';
const STREAMING_ENABLED_KEY = 'voltchat-streaming-enabled';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useChat() {
  const ENV_WEBHOOK_URL = appConfig.webhookUrl;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    url: ENV_WEBHOOK_URL || '',
    isConnected: !!ENV_WEBHOOK_URL,
    isExternal: !!ENV_WEBHOOK_URL, // Track if it's fixed via Env
  });
  const [isStreamingEnabled, setIsStreamingEnabled] = useState(true);
  const [sessionId, setSessionId] = useState<string>(() => {
    let savedSessionId = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (!savedSessionId) {
      savedSessionId = generateId();
      sessionStorage.setItem(SESSION_ID_STORAGE_KEY, savedSessionId);
    }
    return savedSessionId;
  });
  const streamCleanupRef = useRef<(() => void) | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(WEBHOOK_STORAGE_KEY);
    const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
    const savedStreaming = localStorage.getItem(STREAMING_ENABLED_KEY);

    if (!ENV_WEBHOOK_URL && savedUrl) {
      setWebhookConfig({ url: savedUrl, isConnected: true, isExternal: false });
    }

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(
          parsed.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
            status: m.status === 'streaming' ? 'complete' : m.status,
          }))
        );
      } catch (e) {
        console.error('Failed to parse saved messages:', e);
      }
    }

    if (savedStreaming !== null) {
      setIsStreamingEnabled(JSON.parse(savedStreaming));
    }
  }, [ENV_WEBHOOK_URL]);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Persist streaming setting to localStorage
  useEffect(() => {
    localStorage.setItem(STREAMING_ENABLED_KEY, JSON.stringify(isStreamingEnabled));
  }, [isStreamingEnabled]);



  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
    const newSessionId = generateId();
    sessionStorage.setItem(SESSION_ID_STORAGE_KEY, newSessionId);
    setSessionId(newSessionId);
  }, []);

  const updateWebhookUrl = useCallback((url: string) => {
    if (ENV_WEBHOOK_URL) return; // Prevent manual updates if env var is set
    const trimmedUrl = url.trim();
    localStorage.setItem(WEBHOOK_STORAGE_KEY, trimmedUrl);
    setWebhookConfig({
      url: trimmedUrl,
      isConnected: trimmedUrl.length > 0,
      isExternal: false,
    });
    clearMessages();
  }, [clearMessages, ENV_WEBHOOK_URL]);

  const toggleStreaming = useCallback(() => {
    setIsStreamingEnabled((prev) => !prev);
  }, []);

  const stopStreaming = useCallback(() => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
    setMessages(prev => prev.map(m => m.status === 'streaming' ? { ...m, status: 'complete' } : m));
    setIsLoading(false);
  }, []);

  const simulateStreaming = useCallback(
    (messageId: string, fullContent: string) => {
      let currentIndex = 0;
      const chunkSize = 2 + Math.floor(Math.random() * 3); // 2-4 chars at a time
      const baseDelay = 20; // ms between chunks

      const streamInterval = setInterval(() => {
        currentIndex += chunkSize;

        if (currentIndex >= fullContent.length) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, content: fullContent, status: 'complete' }
                : m
            )
          );
          clearInterval(streamInterval);
          setIsLoading(false);
          streamCleanupRef.current = null;
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, content: fullContent.slice(0, currentIndex) }
                : m
            )
          );
        }
      }, baseDelay + Math.random() * 15);

      streamCleanupRef.current = () => clearInterval(streamInterval);
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string, attachments?: Attachment[]) => {
      const hasAttachments = attachments && attachments.length > 0;
      if ((!content.trim() && !hasAttachments) || isLoading) return;

      setIsLoading(true);
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        status: 'complete',
        attachments,
      };

      setMessages((prev) => [...prev, userMessage]);

      const assistantMessageId = generateId();
      const placeholderMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        status: isStreamingEnabled ? 'streaming' : 'complete',
      };

      setMessages((prev) => [...prev, placeholderMessage]);

      try {
        if (isDemoMode(webhookConfig.url)) {
          // Demo mode - simulate a response
          const demoResponse = getDemoResponse(content, attachments);
          setTimeout(() => {
            if (isStreamingEnabled) {
              simulateStreaming(assistantMessageId, demoResponse);
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: demoResponse, status: 'complete' }
                    : m
                )
              );
              setIsLoading(false);
            }
          }, 300);
          return;
        }

        const response = await postChat(
          buildChatPayload(content, sessionId, attachments || []),
          webhookConfig.url,
          appConfig.apiToken,
        );

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const data = await response.json();
          const responseContent = extractJsonContent(data);

          if (isStreamingEnabled) {
            simulateStreaming(assistantMessageId, responseContent);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: responseContent, status: 'complete' }
                  : m
              )
            );
            setIsLoading(false);
          }
        } else if (response.body) {
          // REAL Streaming
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;
          let fullContent = '';

          // Update status to streaming
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, status: 'streaming' }
                : m
            )
          );

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              fullContent += chunk;

              if (isStreamingEnabled) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: fullContent }
                      : m
                  )
                );
              }
            }
          }

          // Mark as complete and update final content
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: fullContent, status: 'complete' }
                : m
            )
          );
          setIsLoading(false);
        } else {
          throw new Error('Empty response from server');
        }
      } catch (error) {
        console.error('[useChat] Send message error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Connection failed';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                ...m,
                content: `Error: ${errorMessage}. Check your webhook URL and try again.`,
                status: 'error',
              }
              : m
          )
        );
        setIsLoading(false);
      }
    },
    [webhookConfig.url, isLoading, simulateStreaming, sessionId, isStreamingEnabled]
  );

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');
    if (lastUserMessage) {
      setMessages((prev) => prev.slice(0, -1));
      sendMessage(lastUserMessage.content, lastUserMessage.attachments);
    }
  }, [messages, sendMessage]);

  const uploadFile = useCallback(async (file: File) => {
    // Demo backends always use simulated uploads so attachment UI stays testable.
    if (isDemoMode(webhookConfig.url)) {
      console.log(`[useChat] Demo-mode simulated upload for: ${file.name}`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        success: true,
        simulated: true,
        data: {
          status: 'success',
          file_id: `file_mock_${generateId()}`,
        }
      };
    }
    return uploadFileRequest(file, appConfig.uploadUrl, appConfig.apiToken);
  }, [webhookConfig.url]);

  return {
    messages,
    isLoading,
    webhookConfig,
    isStreamingEnabled,
    sendMessage,
    updateWebhookUrl,
    toggleStreaming,
    clearMessages,
    retryLastMessage,
    stopStreaming,
    uploadFile,
    hasUploadConfig: appConfig.enableUploads,
    appName: appConfig.appName,
    appDescription: appConfig.appDescription,
    appLogoUrl: appConfig.appLogoUrl,
  };
}
