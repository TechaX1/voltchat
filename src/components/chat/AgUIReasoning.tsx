import { useState } from 'react';
import { ReasoningBlock } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { LoadingDots } from './LoadingDots';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AgUIReasoningProps {
  reasoning: ReasoningBlock;
}

export function AgUIReasoning({ reasoning }: AgUIReasoningProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Brain className="h-4 w-4" />
          <span className="text-sm">Reasoning</span>
          {reasoning.status === 'streaming' ? (
            <LoadingDots className="h-4" />
          ) : isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className={cn(
          "border rounded-lg p-3 text-sm bg-muted/50",
          reasoning.status === 'streaming' && 'border-blue-500/50'
        )}>
          {reasoning.content || (reasoning.status === 'streaming' && <LoadingDots />)}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
