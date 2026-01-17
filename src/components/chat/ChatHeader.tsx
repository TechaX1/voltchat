import { Zap, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  isConnected: boolean;
  onOpenSettings: () => void;
  onClearChat: () => void;
  messagesCount: number;
}

export function ChatHeader({
  isConnected,
  onOpenSettings,
  onClearChat,
  messagesCount,
}: ChatHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4">
      {/* Logo / Title */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md',
            'bg-primary/10 text-primary',
            isConnected && 'volt-glow'
          )}
        >
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight">VoltChat</h1>
          <p className="font-mono text-[10px] text-muted-foreground">
            {isConnected ? (
              <span className="text-success">Connected. Ready.</span>
            ) : (
              <span>Demo mode</span>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {messagesCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearChat}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Clear chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear conversation</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className={cn(
                'h-8 w-8',
                isConnected
                  ? 'text-primary hover:text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Webhook settings</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Webhook settings</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
