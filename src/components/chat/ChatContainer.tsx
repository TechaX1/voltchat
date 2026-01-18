import { useState, useRef, useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { WebhookSettings } from './WebhookSettings';
import { Zap } from 'lucide-react';

export function ChatContainer() {
  const {
    messages,
    isLoading,
    webhookConfig,
    sendMessage,
    updateWebhookUrl,
    clearMessages,
    retryLastMessage,
  } = useChat();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen flex-col bg-background">
        <ChatHeader
          isConnected={webhookConfig.isConnected}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onClearChat={clearMessages}
          messagesCount={messages.length}
        />

        {/* Messages area */}
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onOpenSettings={() => setIsSettingsOpen(true)} />
          ) : (
            <div className="mx-auto max-w-3xl py-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRetry={
                    message.status === 'error' && index === messages.length - 1
                      ? retryLastMessage
                      : undefined
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          isConnected={webhookConfig.isConnected}
          messages={messages}
        />

        <WebhookSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          webhookUrl={webhookConfig.url}
          onUpdateUrl={updateWebhookUrl}
        />
      </div>
    </TooltipProvider>
  );
}

function EmptyState({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary volt-glow-strong">
        <Zap className="h-8 w-8" />
      </div>
      <h2 className="mb-2 text-xl font-semibold tracking-tight">
        Welcome to VoltChat
      </h2>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        High-performance AI interface for developers. Configure your webhook to
        connect to any AI backend, or start chatting in demo mode.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onOpenSettings}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-all hover:border-primary/50 hover:volt-glow"
        >
          <Zap className="h-4 w-4 text-primary" />
          Configure Webhook
        </button>
      </div>
      <p className="mt-8 font-mono text-xs text-muted-foreground/50">
        Enter to send • Shift+Enter for newline
      </p>
    </div>
  );
}
