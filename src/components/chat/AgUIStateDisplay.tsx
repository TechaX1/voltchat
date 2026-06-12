import { useState } from 'react';
import { AgentState } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AgUIStateDisplayProps {
  state: AgentState;
  currentStep?: string;
}

export function AgUIStateDisplay({ state, currentStep }: AgUIStateDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Activity className="h-4 w-4" />
          <span className="text-sm">Agent State</span>
          {currentStep && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {currentStep}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="border rounded-lg p-3 bg-muted/50 max-h-64 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap break-words">
            {JSON.stringify(state.snapshot, null, 2)}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
