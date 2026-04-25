import { useState, useRef, useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useChat } from '@/hooks/useChat';
import { useTheme } from '@/hooks/useTheme';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { WebhookSettings } from './WebhookSettings';
import { Sidebar } from '../Sidebar';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatContainer() {
  const {
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
  } = useChat();
  const { theme, toggleTheme } = useTheme();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Auto-scroll to bottom on new messages, but only if user is near the bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 200;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen bg-background">
        <div
          className={cn(
            'border-r border-border transition-all duration-300 ease-in-out',
            isSidebarOpen ? 'w-72' : 'w-0 p-0'
          )}
        >
          <Sidebar onNewChat={clearMessages} webhookConfig={webhookConfig} />
        </div>
        <div className="flex flex-1 flex-col">
          <ChatHeader
            isConnected={webhookConfig.isConnected}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onClearChat={clearMessages}
            messagesCount={messages.length}
            isStreamingEnabled={isStreamingEnabled}
            onToggleStreaming={toggleStreaming}
            onToggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
            theme={theme}
            onToggleTheme={toggleTheme}
            isExternal={webhookConfig.isExternal}
          />

          {/* Messages area */}
          <main ref={scrollContainerRef} className={cn("flex-1 overflow-y-auto", messages.length === 0 && "flex items-center justify-center pb-64")}>
            {messages.length === 0 ? (
              <div className="w-full max-w-3xl flex flex-col items-center">
                <EmptyState 
                  onOpenSettings={() => setIsSettingsOpen(true)} 
                  isExternal={webhookConfig.isExternal} 
                />
                <div className="w-full mt-4">
                  <ChatInput
                    onSend={sendMessage}
                    isLoading={isLoading}
                    isConnected={webhookConfig.isConnected}
                    messages={messages}
                    isStreamingEnabled={isStreamingEnabled}
                    onStopStreaming={stopStreaming}
                    transparent
                  />
                </div>
              </div>
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

          {messages.length > 0 && (
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              isConnected={webhookConfig.isConnected}
              messages={messages}
              isStreamingEnabled={isStreamingEnabled}
              onStopStreaming={stopStreaming}
            />
          )}

          <WebhookSettings
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            webhookUrl={webhookConfig.url}
            onUpdateUrl={updateWebhookUrl}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

function EmptyState({ onOpenSettings, isExternal }: { onOpenSettings: () => void; isExternal?: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary volt-glow-strong">
        <Zap className="h-8 w-8" />
      </div>
      <h2 className="mb-2 text-xl font-semibold tracking-tight">
        Welcome to [App Name]
      </h2>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        [App Description]
      </p>
      {!isExternal && (
        <div className="flex gap-3">
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-all hover:border-primary/50 hover:volt-glow"
          >
            <Zap className="h-4 w-4 text-primary" />
            Configure Webhook
          </button>
        </div>
      )}
    </div>
  );
}
