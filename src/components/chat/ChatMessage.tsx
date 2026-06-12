import { Message, Attachment } from '@/types/chat';
import { FileText, FileSpreadsheet, FileCode, Image as ImageIcon, File } from 'lucide-react';

function getFileTypeInfo(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['csv', 'xlsx', 'xls', 'ods'].includes(ext)) {
    return {
      type: 'Spreadsheet',
      color: 'bg-green-600 dark:bg-green-600',
      icon: FileSpreadsheet,
    };
  }
  
  const codeExtensions: Record<string, string> = {
    py: 'Python',
    js: 'JavaScript',
    jsx: 'JavaScript React',
    ts: 'TypeScript',
    tsx: 'TypeScript React',
    go: 'Go',
    rs: 'Rust',
    cpp: 'C++',
    c: 'C',
    h: 'C Header',
    cs: 'C#',
    java: 'Java',
    rb: 'Ruby',
    php: 'PHP',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    md: 'Markdown',
    sh: 'Shell Script',
    bat: 'Batch File',
    ps1: 'PowerShell',
    sql: 'SQL'
  };
  
  if (codeExtensions[ext]) {
    return {
      type: codeExtensions[ext],
      color: 'bg-zinc-500 dark:bg-zinc-600',
      icon: FileCode,
    };
  }
  
  if (ext === 'pdf') {
    return {
      type: 'PDF',
      color: 'bg-red-500 dark:bg-red-600',
      icon: FileText,
    };
  }
  
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
    return {
      type: 'Document',
      color: 'bg-blue-600 dark:bg-blue-600',
      icon: FileText,
    };
  }
  
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return {
      type: 'Image',
      color: 'bg-cyan-500 dark:bg-cyan-600',
      icon: ImageIcon,
    };
  }
  
  return {
    type: ext.toUpperCase() || 'File',
    color: 'bg-slate-500 dark:bg-slate-600',
    icon: File,
  };
}

function MessageAttachmentCard({ attachment, isUser }: { attachment: Attachment; isUser: boolean }) {
  const fileInfo = getFileTypeInfo(attachment.name);
  const Icon = fileInfo.icon;
  
  return (
    <div className={cn(
      "flex items-center gap-2.5 rounded-xl p-2 w-[180px] max-w-[180px] shrink-0 border",
      isUser 
        ? "bg-primary-foreground/10 border-primary-foreground/15 text-primary-foreground"
        : "bg-secondary/25 border-border/40 text-foreground"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm",
        fileInfo.color
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs font-semibold truncate leading-tight">
          {attachment.name}
        </span>
        <span className={cn(
          "text-[10px] truncate leading-normal mt-0.5",
          isUser ? "text-primary-foreground/75" : "text-muted-foreground"
        )}>
          {fileInfo.type}
        </span>
      </div>
    </div>
  );
}
import { cn } from '@/lib/utils';
import { AlertCircle, RotateCcw, Clipboard, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { LoadingDots } from './LoadingDots';

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [thumbUpActive, setThumbUpActive] = useState(false);
  const [thumbDownActive, setThumbDownActive] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const handleThumbUp = () => {
    setThumbUpActive(!thumbUpActive);
    setThumbDownActive(false);
    console.log('Thumbs Up clicked. Active:', !thumbUpActive);
  };

  const handleThumbDown = () => {
    setThumbDownActive(!thumbDownActive);
    setThumbUpActive(false);
    console.log('Thumbs Down clicked. Active:', !thumbDownActive);
  };

  return (
    <div
      className={cn(
        'message-enter flex w-full gap-3 px-4 py-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative max-w-[85%] md:max-w-[70%] rounded-3xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-transparent border-transparent',
          isError && 'border-destructive/50 bg-destructive/10'
        )}
      >
        {/* Message content */}
        {isUser ? (
          <div className="flex flex-col gap-2">
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1">
                {message.attachments.map((att, i) => (
                  <MessageAttachmentCard key={i} attachment={att} isUser={true} />
                ))}
              </div>
            )}
            <div
              className={cn(
                'text-sm leading-relaxed whitespace-pre-wrap break-words'
              )}
            >
              {message.content}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1">
                {message.attachments.map((att, i) => (
                  <MessageAttachmentCard key={i} attachment={att} isUser={false} />
                ))}
              </div>
            )}
            <div
              className={cn(
                'prose dark:prose-invert prose-sm max-w-none'
              )}
            >
              {message.content ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : isStreaming ? (
                <LoadingDots />
              ) : null}
            </div>
          </div>
        )}

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

        {/* Action buttons for AI messages */}
        {!isUser && !isStreaming && !isError && (
          <div className="mt-2 flex items-center justify-start gap-1">
            {message.content && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-7 w-7 text-xs text-muted-foreground opacity-50 hover:opacity-100 transition-opacity"
                  >
                    {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThumbUp}
                  className={cn(
                    "h-7 w-7 text-xs opacity-50 hover:opacity-100 transition-opacity",
                    thumbUpActive ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  <ThumbsUp className={cn("h-4 w-4", thumbUpActive && "fill-accent")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Good response</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThumbDown}
                  className={cn(
                    "h-7 w-7 text-xs opacity-50 hover:opacity-100 transition-opacity",
                    thumbDownActive ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  <ThumbsDown className={cn("h-4 w-4", thumbDownActive && "fill-accent")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bad response</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}