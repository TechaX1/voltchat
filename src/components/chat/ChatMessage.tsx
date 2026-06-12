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
import { AlertCircle, RotateCcw, Clipboard, Copy, Code, Check, ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useState } from 'react';
import { LoadingDots } from './LoadingDots';

interface CodeBlockProps {
  language: string;
  value: string;
}

function CodeBlock({ language, value }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const capitalizeLanguage = (lang: string) => {
    if (!lang) return '';
    const map: { [key: string]: string } = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      bash: 'Bash',
      shell: 'Shell',
      python: 'Python',
      cpp: 'C++',
      csharp: 'C#',
      rust: 'Rust',
      go: 'Go',
      sql: 'SQL',
      yaml: 'YAML',
      markdown: 'Markdown',
    };
    return map[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-zinc-800 bg-[#0d0d0d] text-zinc-100 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
          <Code className="h-3.5 w-3.5" />
          <span className="text-zinc-200">{capitalizeLanguage(language)}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Copy code"
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <div className="overflow-x-auto text-sm">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [thumbUpActive, setThumbUpActive] = useState(false);
  const [thumbDownActive, setThumbDownActive] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
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

  const toggleTool = (id: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
          'relative rounded-3xl px-4 py-3',
          isUser
            ? 'max-w-[85%] md:max-w-[70%] bg-primary text-primary-foreground'
            : 'w-full max-w-full bg-transparent border-transparent',
          isError && 'border-destructive/50 bg-destructive/10'
        )}
      >
        {/* Tool Calls */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-3 space-y-1.5 max-w-2xl">
            {message.toolCalls
              .slice(0, message.toolCalls.length > 3 && !isToolsExpanded ? 2 : undefined)
              .map((tc) => (
                <div
                  key={tc.id}
                  className="rounded-xl border border-border/60 bg-card/50 overflow-hidden"
                >
                  <button
                    onClick={() => toggleTool(tc.id)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                  >
                    <ChevronRight
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                        expandedTools.has(tc.id) && 'rotate-90'
                      )}
                    />
                    <span
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        tc.status === 'running'
                          ? 'bg-amber-400 animate-pulse'
                          : tc.status === 'done'
                            ? 'bg-emerald-500'
                            : 'bg-red-500'
                      )}
                    />
                    <span className="text-sm font-medium text-foreground truncate">
                      {tc.name}
                    </span>
                    <span className="ml-auto shrink-0">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                          tc.status === 'running'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : tc.status === 'done'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}
                      >
                          {tc.status === 'running' ? 'Running' : tc.status === 'done' ? 'Done' : 'Error'}
                      </span>
                    </span>
                  </button>
                </div>
              ))}

            {message.toolCalls.length > 3 && (
              <button
                onClick={() => setIsToolsExpanded(!isToolsExpanded)}
                className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border/60 bg-muted/10 hover:bg-muted/20 text-xs font-semibold text-muted-foreground transition-all duration-200"
              >
                <span>
                  {isToolsExpanded ? 'Show less' : `+ ${message.toolCalls.length - 2} more tool calls`}
                </span>
              </button>
            )}
          </div>
        )}

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
              {message.content && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <CodeBlock
                          language={match[1]}
                          value={String(children).replace(/\n$/, '')}
                        />
                      ) : (
                        <code className={cn("bg-zinc-800/85 text-zinc-200 rounded px-1.5 py-0.5 font-mono text-[11px] before:hidden after:hidden", className)} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
              {isStreaming && (
                <div className={cn("inline-block align-middle", message.content && "mt-2")}>
                  <LoadingDots />
                </div>
              )}
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