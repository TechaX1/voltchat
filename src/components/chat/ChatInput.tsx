import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { StopCircle, Plus, Paperclip, Scan, Camera, Image, Lightbulb, Telescope, Globe, MoreHorizontal, ChevronRight, ArrowUp, FileText, FileSpreadsheet, FileCode, File, X, Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Message, Attachment } from '@/types/chat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  isConnected: boolean;
  messages: Message[];
  isStreamingEnabled: boolean;
  onStopStreaming: () => void;
  onUpload?: (file: File) => Promise<{ success: boolean; data?: any; message?: string }>;
  hasUploadConfig?: boolean;
  transparent?: boolean;
}

interface ChatInputAttachment extends Attachment {
  localId: string;
  isUploading: boolean;
}

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
      icon: Image,
    };
  }
  
  return {
    type: ext.toUpperCase() || 'File',
    color: 'bg-slate-500 dark:bg-slate-600',
    icon: File,
  };
}

interface AttachmentCardProps {
  attachment: ChatInputAttachment;
  onRemove: () => void;
}

function AttachmentCard({ attachment, onRemove }: AttachmentCardProps) {
  const fileInfo = getFileTypeInfo(attachment.name);
  const Icon = fileInfo.icon;
  
  return (
    <div className="relative flex items-center gap-3 rounded-2xl bg-[#1e1e24]/60 dark:bg-[#18181c] border border-border/50 p-2.5 w-[220px] max-w-[220px] shrink-0 group transition-all">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm",
        fileInfo.color
      )}>
        {attachment.isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1 pr-3">
        <span className="text-[13px] font-semibold text-foreground/90 truncate leading-tight">
          {attachment.name}
        </span>
        <span className="text-[11px] text-muted-foreground truncate leading-normal mt-0.5">
          {attachment.isUploading ? 'Uploading...' : fileInfo.type}
        </span>
      </div>
      <button
        onClick={onRemove}
        type="button"
        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-black border border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-md z-10 cursor-pointer"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function ChatInput({
  onSend,
  isLoading,
  isConnected,
  messages,
  isStreamingEnabled,
  onStopStreaming,
  onUpload,
  hasUploadConfig,
  transparent,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatInputAttachment[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userMessages = messages.filter((m) => m.role === 'user').reverse();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (attachments.some(a => a.isUploading)) {
      toast.warning('Please wait for all attachments to finish uploading.');
      return;
    }

    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSend(
        input,
        attachments.map(({ name, type, fileId, url }) => ({ name, type, fileId, url }))
      );
      setInput('');
      setAttachments([]);
      setHistoryIndex(-1);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUpload) return;

    const maxAttachments = Number(import.meta.env.VITE_MAX_ATTACHMENTS) || 5;
    const currentCount = attachments.length;
    const incomingCount = files.length;

    if (currentCount + incomingCount > maxAttachments) {
      toast.error(`Maximum of ${maxAttachments} attachments allowed. You currently have ${currentCount}.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const filesArray = Array.from(files);

    for (const file of filesArray) {
      const localId = Math.random().toString(36).substring(2, 15);
      const fileInfo = getFileTypeInfo(file.name);

      const newAttachment: ChatInputAttachment = {
        localId,
        name: file.name,
        type: fileInfo.type,
        fileId: '',
        isUploading: true,
      };

      setAttachments(prev => [...prev, newAttachment]);

      onUpload(file).then((result) => {
        if (result.success) {
          const fileId = (result.data && result.data.file_id) || `file_${Math.random().toString(36).substring(2, 9)}`;
          setAttachments(prev => prev.map(att =>
            att.localId === localId
              ? { ...att, isUploading: false, fileId }
              : att
          ));
        } else {
          setAttachments(prev => prev.filter(att => att.localId !== localId));
          toast.error(`Failed to upload ${file.name}: ${result.message || 'Unknown error'}`);
        }
      }).catch((err) => {
        setAttachments(prev => prev.filter(att => att.localId !== localId));
        toast.error(`Failed to upload ${file.name}: ${err.message || 'Unknown error'}`);
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (localId: string) => {
    setAttachments(prev => prev.filter(att => att.localId !== localId));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'ArrowUp') {
      if (userMessages.length > 0 && historyIndex < userMessages.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(userMessages[newIndex].content);
        e.preventDefault();
        moveCursorToEnd();
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(userMessages[newIndex].content);
        e.preventDefault();
        moveCursorToEnd();
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
        e.preventDefault();
      }
    }
  };

  useEffect(() => {
    if (input === '') {
      setHistoryIndex(-1);
    }
  }, [input]);

  const moveCursorToEnd = () => {
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }
    }, 0);
  };

  const isSendDisabled = (!input.trim() && attachments.length === 0) || isLoading || attachments.some(a => a.isUploading);

  return (
    <div className={cn(
      "px-4 py-6 pointer-events-none",
      !transparent && "bg-gradient-to-t from-background via-background/40 to-transparent pt-12"
    )}>
      <div className="mx-auto max-w-3xl pointer-events-auto">
        <div
          className={cn(
            'relative flex flex-col rounded-[26px] bg-secondary/15 dark:bg-card/50 backdrop-blur-xl p-2.5 transition-all duration-200 border border-border/40 shadow-2xl',
            'focus-within:volt-glow focus-within:bg-secondary/20 dark:focus-within:bg-card focus-within:border-primary/30',
            isLoading && 'opacity-70'
          )}
        >
          {/* File Attachments Queue */}
          {attachments.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 px-1.5 scrollbar-none select-none">
              {attachments.map((att) => (
                <AttachmentCard
                  key={att.localId}
                  attachment={att}
                  onRemove={() => handleRemoveAttachment(att.localId)}
                />
              ))}
            </div>
          )}

          {/* Lower Input Controls */}
          <div className="flex items-center gap-2 w-full">
            {hasUploadConfig && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={isLoading}
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
                    <DropdownMenuItem onClick={handleFileClick} className="cursor-pointer">
                      <Paperclip className="mr-2 h-4 w-4" />
                      <span>Upload photos & files</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Scan className="mr-2 h-4 w-4" />
                      <span>Take screenshot</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Camera className="mr-2 h-4 w-4" />
                      <span>Take photo</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      <Image className="mr-2 h-4 w-4" />
                      <span>Create image</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      <span>Thinking</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Telescope className="mr-2 h-4 w-4" />
                      <span>Deep research</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Globe className="mr-2 h-4 w-4" />
                      <span>Web search</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="flex justify-between items-center">
                      <div className="flex items-center">
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                        <span>More</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? 'Ask anything...' : 'Ask anything (Demo mode)...'}
              disabled={isLoading && !isStreamingEnabled}
              rows={1}
              className={cn(
                'flex-1 resize-none bg-transparent px-3 py-2.5 text-sm',
                'placeholder:text-muted-foreground/60',
                'focus:outline-none disabled:cursor-not-allowed',
                'max-h-[200px] min-h-[44px]'
              )}
            />
            
            {/* Microphone Icon */}
            <TooltipProvider>
              <Button
                disabled={isLoading}
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0 rounded-full text-muted-foreground/60 hover:text-foreground"
              >
                <Mic className="h-5 w-5" />
                <span className="sr-only">Voice Input</span>
              </Button>
            </TooltipProvider>

            {isLoading && isStreamingEnabled ? (
              <Button
                onClick={onStopStreaming}
                size="icon"
                variant="destructive"
                className="h-8 w-8 shrink-0 rounded-full"
              >
                <StopCircle className="h-4 w-4" />
                <span className="sr-only">Stop generating</span>
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={isSendDisabled}
                size="icon"
                className={cn(
                  'h-8 w-8 shrink-0 rounded-full transition-all duration-150',
                  'bg-white text-black hover:bg-white/90',
                  'disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed'
                )}
              >
                <ArrowUp className="h-5 w-5 stroke-[3]" />
                <span className="sr-only">Send message</span>
              </Button>
            )}
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="mt-2 flex items-center justify-between gap-1 text-[10px] text-muted-foreground/50 font-mono">
          <div>
            <span className="font-bold">↑↓</span> to browse history
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">Enter</span>
            <span>to send</span>
            <span className="mx-1">•</span>
            <span className="font-bold">Shift+Enter</span>
            <span>for newline</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper wrapper to prevent compilation errors if tooltip provider is needed
function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
