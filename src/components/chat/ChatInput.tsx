import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  isConnected: boolean;
  messages: Message[];
}

export function ChatInput({ onSend, isLoading, isConnected, messages }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
      setHistoryIndex(-1);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
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

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm px-4 py-4">
      <div className="mx-auto max-w-3xl">
        <div
          className={cn(
            'relative flex items-end gap-2 rounded-lg border bg-card p-2 transition-all duration-200',
            'focus-within:border-primary/50 focus-within:volt-glow',
            isLoading && 'opacity-70'
          )}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Send a message...' : 'Demo mode — configure webhook to connect'}
            disabled={isLoading}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent px-2 py-2 text-sm',
              'placeholder:text-muted-foreground/60',
              'focus:outline-none disabled:cursor-not-allowed',
              'max-h-[200px] min-h-[40px]'
            )}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className={cn(
              'h-9 w-9 shrink-0 rounded-md transition-all duration-150',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 hover:volt-glow',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              input.trim() && !isLoading && 'volt-pulse'
            )}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
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
