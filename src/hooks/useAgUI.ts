import { useState, useCallback, useEffect, useRef } from 'react';
import { HttpAgent, AgentSubscriber } from '@ag-ui/client';
import { Message, ToolCall, AgentState, ReasoningBlock, AgUIRunState } from '@/types/chat';

const generateId = () => Math.random().toString(36).substring(2, 15);

interface UseAgUIOptions {
  url: string;
  apiToken?: string;
  onError?: (error: string) => void;
}

export function useAgUI({ url, apiToken, onError }: UseAgUIOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [reasoning, setReasoning] = useState<ReasoningBlock[]>([]);
  const [runState, setRunState] = useState<AgUIRunState>({
    threadId: generateId(),
    runId: null,
    isRunning: false,
    currentStep: undefined,
    agentState: null,
  });

  const agentRef = useRef<HttpAgent | null>(null);
  const currentMessageRef = useRef<Message | null>(null);
  const currentToolCallRef = useRef<ToolCall | null>(null);
  const currentReasoningRef = useRef<ReasoningBlock | null>(null);

  useEffect(() => {
    if (url) {
      agentRef.current = new HttpAgent({
        url,
        headers: apiToken ? { Authorization: `Bearer ${apiToken}` } : {},
        initialState: {},
      });
    }
  }, [url, apiToken]);

  const subscriber: AgentSubscriber = useRef<AgentSubscriber>({
    onRunStartedEvent({ event }) {
      console.log('[useAgUI] Run started:', event);
      setRunState(prev => ({
        ...prev,
        runId: event.runId,
        isRunning: true,
      }));
    },

    onTextMessageStartEvent({ event }) {
      console.log('[useAgUI] Text message start:', event);
      const newMessage: Message = {
        id: event.messageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        status: 'streaming',
      };
      currentMessageRef.current = newMessage;
      setMessages(prev => [...prev, newMessage]);
    },

    onTextMessageContentEvent({ event, textMessageBuffer }) {
      console.log('[useAgUI] Text message content:', event);
      if (currentMessageRef.current) {
        setMessages(prev =>
          prev.map(m =>
            m.id === currentMessageRef.current?.id
              ? { ...m, content: textMessageBuffer }
              : m
          )
        );
      }
    },

    onTextMessageEndEvent({ event }) {
      console.log('[useAgUI] Text message end:', event);
      setMessages(prev =>
        prev.map(m =>
          m.id === event.messageId
            ? { ...m, status: 'complete' }
            : m
        )
      );
      currentMessageRef.current = null;
    },

    onToolCallStartEvent({ event }) {
      console.log('[useAgUI] Tool call start:', event);
      const newToolCall: ToolCall = {
        toolCallId: event.toolCallId,
        toolCallName: event.toolCallName,
        args: '',
        status: 'pending',
      };
      currentToolCallRef.current = newToolCall;
      setToolCalls(prev => [...prev, newToolCall]);
    },

    onToolCallArgsEvent({ event, toolCallBuffer }) {
      console.log('[useAgUI] Tool call args:', event);
      if (currentToolCallRef.current) {
        setToolCalls(prev =>
          prev.map(tc =>
            tc.toolCallId === currentToolCallRef.current?.toolCallId
              ? { ...tc, args: toolCallBuffer, status: 'running' }
              : tc
          )
        );
      }
    },

    onToolCallEndEvent({ event, toolCallName }) {
      console.log('[useAgUI] Tool call end:', event);
      setToolCalls(prev =>
        prev.map(tc =>
          tc.toolCallId === event.toolCallId
            ? { ...tc, status: 'complete', toolCallName }
            : tc
        )
      );
      currentToolCallRef.current = null;
    },

    onStateSnapshotEvent({ event }) {
      console.log('[useAgUI] State snapshot:', event);
      const snapshot = typeof event.snapshot === 'string'
        ? JSON.parse(event.snapshot)
        : event.snapshot;
      setRunState(prev => ({
        ...prev,
        agentState: { snapshot },
      }));
    },

    onStateDeltaEvent({ event }) {
      console.log('[useAgUI] State delta:', event);
      setRunState(prev => {
        if (!prev.agentState) return prev;
        const delta = typeof event.delta === 'string'
          ? JSON.parse(event.delta)
          : event.delta;
        return {
          ...prev,
          agentState: {
            snapshot: { ...prev.agentState.snapshot, ...delta },
            lastDelta: delta,
          },
        };
      });
    },

    onMessagesSnapshotEvent({ event }) {
      console.log('[useAgUI] Messages snapshot:', event);
      setMessages(event.messages.map(m => ({
        id: m.id,
        role: m.role as Message['role'],
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        timestamp: new Date(),
        status: 'complete' as const,
      })));
    },

    onCustomEvent({ event }) {
      console.log('[useAgUI] Custom event:', event);
      if (event.name === 'reasoning_start') {
        const newReasoning: ReasoningBlock = {
          messageId: generateId(),
          content: '',
          status: 'streaming',
        };
        currentReasoningRef.current = newReasoning;
        setReasoning(prev => [...prev, newReasoning]);
      } else if (event.name === 'reasoning_content' && currentReasoningRef.current) {
        const content = typeof event.value === 'string'
          ? event.value
          : JSON.stringify(event.value);
        setReasoning(prev =>
          prev.map(r =>
            r.messageId === currentReasoningRef.current?.messageId
              ? { ...r, content: r.content + content }
              : r
          )
        );
      } else if (event.name === 'reasoning_end' && currentReasoningRef.current) {
        setReasoning(prev =>
          prev.map(r =>
            r.messageId === currentReasoningRef.current?.messageId
              ? { ...r, status: 'complete' }
              : r
          )
        );
        currentReasoningRef.current = null;
      }
    },

    onStepStartedEvent({ event }) {
      console.log('[useAgUI] Step started:', event);
      setRunState(prev => ({
        ...prev,
        currentStep: event.stepName,
      }));
    },

    onStepFinishedEvent() {
      console.log('[useAgUI] Step finished');
      setRunState(prev => ({
        ...prev,
        currentStep: undefined,
      }));
    },

    onRunFinishedEvent({ outcome }) {
      console.log('[useAgUI] Run finished:', outcome);
      setRunState(prev => ({
        ...prev,
        isRunning: false,
      }));
    },

    onRunErrorEvent({ event }) {
      console.error('[useAgUI] Run error:', event);
      onError?.(event.message);
      setRunState(prev => ({
        ...prev,
        isRunning: false,
      }));
    },
  }).current;

  const sendMessage = useCallback(async (content: string) => {
    if (!agentRef.current || !content.trim()) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'complete',
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      setRunState(prev => ({ ...prev, isRunning: true }));

      agentRef.current.addMessage({ id: userMessage.id, role: 'user', content: content.trim() });

      await agentRef.current.runAgent(
        {},
        subscriber
      );
    } catch (error) {
      console.error('[useAgUI] Send message error:', error);
      const errorMessage = error instanceof Error ? error.message : 'AG-UI connection failed';
      onError?.(errorMessage);

      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
        status: 'error',
      }]);
      setRunState(prev => ({ ...prev, isRunning: false }));
    }
  }, [runState.threadId, subscriber, onError]);

  const stopRun = useCallback(() => {
    if (agentRef.current) {
      agentRef.current.abortRun();
    }
    setRunState(prev => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setToolCalls([]);
    setReasoning([]);
    setRunState({
      threadId: generateId(),
      runId: null,
      isRunning: false,
      currentStep: undefined,
      agentState: null,
    });
  }, []);

  return {
    messages,
    toolCalls,
    reasoning,
    runState,
    sendMessage,
    stopRun,
    clearMessages,
  };
}
