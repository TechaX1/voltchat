import { ToolCall } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Wrench, CheckCircle, Loader2, XCircle } from 'lucide-react';

interface AgUIToolCallProps {
  toolCall: ToolCall;
}

export function AgUIToolCall({ toolCall }: AgUIToolCallProps) {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
        return <Wrench className="h-4 w-4 text-muted-foreground" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Wrench className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn(
      "mt-2 border rounded-lg p-3",
      toolCall.status === 'error' ? 'border-destructive/50 bg-destructive/10' : 'border-muted',
      toolCall.status === 'running' && 'border-blue-500/50 bg-blue-500/10'
    )}>
      <div className="flex items-center gap-2 mb-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">{toolCall.toolCallName}</span>
        <span className="text-xs text-muted-foreground capitalize">{toolCall.status}</span>
      </div>
      
      {toolCall.args && (
        <div className="mb-2">
          <div className="text-xs text-muted-foreground mb-1">Arguments:</div>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {toolCall.args}
          </pre>
        </div>
      )}
      
      {toolCall.result && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">Result:</div>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {toolCall.result}
          </pre>
        </div>
      )}
    </div>
  );
}
