import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';

  return (
    <div
      className={cn(
        'message-enter flex w-full gap-3 px-4 py-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative max-w-[85%] md:max-w-[70%] rounded-lg px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground volt-glow'
            : 'bg-card border border-border',
          isError && 'border-destructive/50 bg-destructive/10',
          isStreaming && 'volt-shimmer'
        )}
      >
        {/* Message content */}
        <div
          className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap break-words',
            isStreaming && message.content && 'cursor-blink'
          )}
        >
          {message.content || (isStreaming && <span className="text-muted-foreground">...</span>)}
        </div>

        {/* Error state with retry */}
        {isError && onRetry && (
          <div className="mt-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Retry
            </Button>
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            'mt-1.5 font-mono text-[10px] opacity-50',
            isUser ? 'text-primary-foreground' : 'text-muted-foreground'
          )}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
