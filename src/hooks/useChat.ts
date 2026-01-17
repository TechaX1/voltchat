import { useState, useCallback, useEffect } from 'react';
import { Message, WebhookConfig } from '@/types/chat';

const WEBHOOK_STORAGE_KEY = 'voltchat-webhook-url';
const MESSAGES_STORAGE_KEY = 'voltchat-messages';
const SESSION_ID_STORAGE_KEY = 'voltchat-session-id';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    url: '',
    isConnected: false,
  });
  const [sessionId, setSessionId] = useState<string>(() => {
    let savedSessionId = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (!savedSessionId) {
      savedSessionId = generateId();
      sessionStorage.setItem(SESSION_ID_STORAGE_KEY, savedSessionId);
    }
    return savedSessionId;
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(WEBHOOK_STORAGE_KEY);
    const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);

    if (savedUrl) {
      setWebhookConfig({ url: savedUrl, isConnected: true });
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
  }, []);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const updateWebhookUrl = useCallback((url: string) => {
    const trimmedUrl = url.trim();
    localStorage.setItem(WEBHOOK_STORAGE_KEY, trimmedUrl);
    setWebhookConfig({
      url: trimmedUrl,
      isConnected: trimmedUrl.length > 0,
    });
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

      return () => clearInterval(streamInterval);
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        status: 'complete',
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const assistantMessageId = generateId();
      const placeholderMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        status: 'streaming',
      };

      setMessages((prev) => [...prev, placeholderMessage]);

      try {
        if (!webhookConfig.url) {
          // Demo mode - simulate a response
          const demoResponse = getDemoResponse(content);
          setTimeout(() => {
            simulateStreaming(assistantMessageId, demoResponse);
            setIsLoading(false);
          }, 300);
          return;
        }

        const response = await fetch(webhookConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content.trim(),
            timestamp: new Date().toISOString(),
            sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const responseContent =
          data.response || data.message || data.content || JSON.stringify(data);

        simulateStreaming(assistantMessageId, responseContent);
      } catch (error) {
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
      } finally {
        setIsLoading(false);
      }
    },
    [webhookConfig.url, isLoading, simulateStreaming, sessionId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
    const newSessionId = generateId();
    sessionStorage.setItem(SESSION_ID_STORAGE_KEY, newSessionId);
    setSessionId(newSessionId);
  }, []);

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');
    if (lastUserMessage) {
      // Remove the error message
      setMessages((prev) => prev.slice(0, -1));
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    webhookConfig,
    sendMessage,
    updateWebhookUrl,
    clearMessages,
    retryLastMessage,
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
