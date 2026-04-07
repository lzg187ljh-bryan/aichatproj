/**
 * Components - Messages
 * 消息列表组件
 * 参考 Vercel AI Chatbot 模板
 */

'use client';

import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message as MessageComponent } from './Message';
import { Greeting } from './Greeting';
import type { Message } from '@/core/types/message';

interface MessagesProps {
  messages: Message[];
  isLoading?: boolean;
  onExampleClick: (prompt: string) => void;
  onArtifactClick?: (artifact: { id: string; type: 'code' | 'document'; title: string; content: string; language?: string }) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: () => void;
}

export function Messages({
  messages,
  isLoading,
  onExampleClick,
  onArtifactClick,
  onEdit,
  onRegenerate,
}: MessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);

  // Wait for hydration to avoid flash of Greeting
  useEffect(() => {
    // Short delay to allow messages to load from store
    const timer = setTimeout(() => {
      setHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current && messages.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Show loading state during hydration
  if (!hydrated) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
        </div>
      </div>
    );
  }

  // Show greeting if no messages after hydration
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Greeting onExampleClick={onExampleClick} />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {messages.map((message, index) => (
          <MessageComponent
            key={message.id || index}
            message={message}
            onArtifactClick={onArtifactClick}
            onEdit={onEdit}
            onRegenerate={onRegenerate}
            isLastMessage={index === messages.length - 1}
          />
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
              <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
              <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
            </div>
            <span className="text-sm">Thinking...</span>
          </div>
        )}
        
        {/* Bottom anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}