import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, WebhookConfig } from '@/types/chat';
import { useAgUI } from './useAgUI';

const WEBHOOK_STORAGE_KEY = 'voltchat-webhook-url';
const MESSAGES_STORAGE_KEY = 'voltchat-messages';
const SESSION_ID_STORAGE_KEY = 'voltchat-session-id';
const STREAMING_ENABLED_KEY = 'voltchat-streaming-enabled';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useChat() {
  const ENV_WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL;
  const ENV_API_TOKEN = import.meta.env.VITE_API_TOKEN;
  const ENV_UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL;
  const ENV_AGUI_URL = import.meta.env.VITE_AGUI_URL;
  const ENV_APP_NAME = import.meta.env.VITE_APP_NAME || 'VoltChat';
  const ENV_APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION || 'A high-performance chat interface.';
  const ENV_ENABLE_UPLOADS = import.meta.env.VITE_ENABLE_UPLOADS === 'true';
  const ENV_APP_LOGO_URL = import.meta.env.VITE_APP_LOGO_URL || '';
  const ENV_FAVICON_URL = import.meta.env.VITE_FAVICON_URL || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    url: ENV_WEBHOOK_URL || '',
    isConnected: !!ENV_WEBHOOK_URL,
    isExternal: !!ENV_WEBHOOK_URL,
    isAgUI: !!ENV_AGUI_URL,
    agUIUrl: ENV_AGUI_URL || '',
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

  // AG-UI Hook
  const agUI = useAgUI({
    url: webhookConfig.isAgUI ? (webhookConfig.agUIUrl || '') : '',
    apiToken: ENV_API_TOKEN,
    onError: (error) => {
      console.error('[useChat] AG-UI error:', error);
      setIsLoading(false);
    },
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(WEBHOOK_STORAGE_KEY);
    const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
    const savedStreaming = localStorage.getItem(STREAMING_ENABLED_KEY);

    if (!ENV_WEBHOOK_URL && savedUrl) {
      setWebhookConfig(prev => ({
        ...prev,
        url: savedUrl,
        isConnected: true,
        isExternal: false,
      }));
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
  }, []);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0 && !webhookConfig.isAgUI) {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, webhookConfig.isAgUI]);

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
    if (webhookConfig.isAgUI) {
      agUI.clearMessages();
    }
  }, [webhookConfig.isAgUI, agUI]);

  const updateWebhookUrl = useCallback((url: string) => {
    if (ENV_WEBHOOK_URL) return;
    const trimmedUrl = url.trim();
    localStorage.setItem(WEBHOOK_STORAGE_KEY, trimmedUrl);
    setWebhookConfig({
      url: trimmedUrl,
      isConnected: trimmedUrl.length > 0,
      isExternal: false,
      isAgUI: false,
      agUIUrl: '',
    });
    clearMessages();
  }, [clearMessages, ENV_WEBHOOK_URL]);

  const updateAgUIUrl = useCallback((url: string) => {
    const trimmedUrl = url.trim();
    setWebhookConfig(prev => ({
      ...prev,
      isAgUI: trimmedUrl.length > 0,
      agUIUrl: trimmedUrl,
    }));
    clearMessages();
  }, [clearMessages]);

  const toggleStreaming = useCallback(() => {
    setIsStreamingEnabled((prev) => !prev);
  }, []);

  const stopStreaming = useCallback(() => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
    if (webhookConfig.isAgUI) {
      agUI.stopRun();
    }
    setMessages(prev => prev.map(m => m.status === 'streaming' ? { ...m, status: 'complete' } : m));
    setIsLoading(false);
  }, [webhookConfig.isAgUI, agUI]);

  const simulateStreaming = useCallback(
    (messageId: string, fullContent: string) => {
      let currentIndex = 0;
      const chunkSize = 2 + Math.floor(Math.random() * 3);
      const baseDelay = 20;

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
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setIsLoading(true);

      // Route to AG-UI if enabled
      if (webhookConfig.isAgUI && webhookConfig.agUIUrl) {
        try {
          await agUI.sendMessage(content.trim());
          setIsLoading(false);
        } catch (error) {
          console.error('[useChat] AG-UI send error:', error);
          setIsLoading(false);
        }
        return;
      }

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        status: 'complete',
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
        if (!webhookConfig.url) {
          const demoResponse = getDemoResponse(content);
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

        console.log(`[useChat] Sending message to: ${webhookConfig.url}`, {
          message: content.trim(),
          sessionId,
          timestamp: new Date().toISOString()
        });

        const response = await fetch(webhookConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(ENV_API_TOKEN ? { 'Authorization': `Bearer ${ENV_API_TOKEN}` } : {}),
          },
          body: JSON.stringify({
            message: content.trim(),
            timestamp: new Date().toISOString(),
            sessionId,
          }),
        });

        console.log(`[useChat] Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const data = await response.json();
          console.log('[useChat] Received data:', data);
          const responseContent =
            (typeof data.output === 'object' ? data.output?.response : data.output) ||
            data.response ||
            data.message ||
            data.content ||
            JSON.stringify(data);

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
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;
          let fullContent = '';

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
    [webhookConfig, isLoading, simulateStreaming, sessionId, isStreamingEnabled, agUI]
  );

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');
    if (lastUserMessage) {
      setMessages((prev) => prev.slice(0, -1));
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  const uploadFile = useCallback(async (file: File) => {
    if (!ENV_UPLOAD_URL) {
      console.warn('VITE_UPLOAD_URL is not configured');
      return { success: false, message: 'Upload URL not configured' };
    }

    setIsLoading(true);
    try {
      console.log(`[useChat] Uploading file to: ${ENV_UPLOAD_URL}`, { fileName: file.name, fileSize: file.size });
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(ENV_UPLOAD_URL, {
        method: 'POST',
        headers: {
          ...(ENV_API_TOKEN ? { 'Authorization': `Bearer ${ENV_API_TOKEN}` } : {}),
        },
        body: formData,
      });

      console.log(`[useChat] Upload response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[useChat] Upload success data:', data);

      const systemMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Successfully uploaded file: **${file.name}**`,
        timestamp: new Date(),
        status: 'complete',
      };
      setMessages(prev => [...prev, systemMessage]);

      return { success: true, data };
    } catch (error) {
      console.error('[useChat] Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Error uploading file: ${errorMessage}`,
        timestamp: new Date(),
        status: 'error',
      };
      setMessages(prev => [...prev, errorMsg]);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [ENV_UPLOAD_URL, ENV_API_TOKEN]);

  // Merge messages: use AG-UI messages when in AG-UI mode
  const activeMessages = webhookConfig.isAgUI ? agUI.messages : messages;

  return {
    messages: activeMessages,
    isLoading: webhookConfig.isAgUI ? agUI.runState.isRunning : isLoading,
    webhookConfig,
    isStreamingEnabled,
    sendMessage,
    updateWebhookUrl,
    updateAgUIUrl,
    toggleStreaming,
    clearMessages,
    retryLastMessage,
    stopStreaming,
    uploadFile,
    toolCalls: webhookConfig.isAgUI ? agUI.toolCalls : [],
    reasoning: webhookConfig.isAgUI ? agUI.reasoning : [],
    agentState: webhookConfig.isAgUI ? agUI.runState.agentState : null,
    currentStep: webhookConfig.isAgUI ? agUI.runState.currentStep : undefined,
    hasUploadConfig: !!ENV_UPLOAD_URL && ENV_ENABLE_UPLOADS,
    appName: ENV_APP_NAME,
    appDescription: ENV_APP_DESCRIPTION,
    appLogoUrl: ENV_APP_LOGO_URL,
  };
}

function getDemoResponse(input: string): string {
  const responses = [
    "I'm VoltChat running in demo mode. Configure a webhook URL to connect to your AI backend.",
    "This is a simulated response. Your message was received instantly — that's the VoltChat difference.",
    "Demo mode active. Set up your webhook endpoint to see real AI responses with the same electric speed.",
    "How far connect your webhook now.. wetin dey worry you sef😂",
    "No webhook configured. I'm showing you how fast responses feel in VoltChat. Ready to connect your backend?",
  ];

  if (input.toLowerCase().includes('hello') || input.toLowerCase().includes('hi')) {
    return "Connected. Ready. What can I help you build today?";
  }

  if (input.toLowerCase().includes('webhook')) {
    return "Click the ⚡ icon in the top right to configure your webhook URL. VoltChat will POST your messages and display responses with simulated streaming.";
  }

  return responses[Math.floor(Math.random() * responses.length)];
}
