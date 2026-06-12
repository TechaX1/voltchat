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
    uploadFile,
    hasUploadConfig,
    appName,
    appDescription,
    appLogoUrl,
  } = useChat();
  const { theme, toggleTheme } = useTheme();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const prevMessageCountRef = useRef(0);

  // Auto-scroll only when a new message is added (user sends or assistant placeholder appears).
  // Does NOT re-scroll on streaming content updates, so the user can scroll up freely.
  useEffect(() => {
    const count = messages.length;
    if (count > prevMessageCountRef.current) {
      prevMessageCountRef.current = count;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);


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
        <div className="flex flex-1 flex-col relative overflow-hidden">
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
            appName={appName}
            appLogoUrl={appLogoUrl}
          />

          {/* Messages area */}
          <main ref={scrollContainerRef} className={cn("flex-1 overflow-y-auto", messages.length === 0 && "flex items-center justify-center pb-64")}>
            {messages.length === 0 ? (
              <div className="w-full max-w-3xl flex flex-col items-center">
                <EmptyState 
                  onOpenSettings={() => setIsSettingsOpen(true)} 
                  isExternal={webhookConfig.isExternal} 
                  appName={appName}
                  appDescription={appDescription}
                  appLogoUrl={appLogoUrl}
                />
                <div className="w-full mt-4">
                  <ChatInput
                    onSend={sendMessage}
                    isLoading={isLoading}
                    isConnected={webhookConfig.isConnected}
                    messages={messages}
                    isStreamingEnabled={isStreamingEnabled}
                    onStopStreaming={stopStreaming}
                    onUpload={uploadFile}
                    hasUploadConfig={hasUploadConfig}
                    transparent
                  />
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl py-4 pb-32">
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
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading}
                isConnected={webhookConfig.isConnected}
                messages={messages}
                isStreamingEnabled={isStreamingEnabled}
                onStopStreaming={stopStreaming}
                onUpload={uploadFile}
                hasUploadConfig={hasUploadConfig}
              />
            </div>
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

function EmptyState({ onOpenSettings, isExternal, appName, appDescription, appLogoUrl }: { 
  onOpenSettings: () => void; 
  isExternal?: boolean;
  appName: string;
  appDescription: string;
  appLogoUrl?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className={cn(
        "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary overflow-hidden",
        appLogoUrl && "p-0 bg-transparent"
      )}>
        {appLogoUrl ? (
          <img src={appLogoUrl} alt={appName} className="h-full w-full object-cover" />
        ) : (
          <Zap className="h-8 w-8" />
        )}
      </div>
      <h2 className="mb-2 text-xl font-semibold tracking-tight">
        Welcome to {appName}
      </h2>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        {appDescription}
      </p>
      {!isExternal && (
        <div className="flex gap-3">
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-all hover:border-primary/50"
          >
            <Zap className="h-4 w-4 text-primary" />
            Configure Webhook
          </button>
        </div>
      )}
    </div>
  );
}
