import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, Link } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { WebhookConfig } from '@/types/chat';

interface SidebarProps {
  onNewChat: () => void;
  webhookConfig: WebhookConfig;
}

export function Sidebar({ onNewChat, webhookConfig }: SidebarProps) {
  const chats = [
    { id: '1', name: 'React component styles' },
    { id: '2', name: 'State management discussion' },
    { id: '3', name: 'useEffect vs useMemo' },
  ];
  
  const randomName = 'John Doe'; // Placeholder

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground p-3">
      {/* New Chat */}
      <div className="mb-4">
        <Button onClick={onNewChat} className="w-full justify-start gap-2">
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Your Chats */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-sidebar-primary">
          Your Chats
        </h2>
        <div className="space-y-1 mb-4">
          {chats.map((chat) => (
            <Button
              key={chat.id}
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="truncate">{chat.name}</span>
            </Button>
          ))}
        </div>

        {/* Saved Webhooks */}
        {webhookConfig.url && (
          <div>
            <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-sidebar-primary">
              Saved Webhooks
            </h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Link className="h-4 w-4" />
                <span className="truncate">{webhookConfig.url}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="mt-auto">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold truncate">{randomName}</p>
          </div>
          <Badge variant="secondary">Free</Badge>
        </div>
      </div>
    </div>
  );
}
