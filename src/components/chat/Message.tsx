/**
 * Components - Message
 * 单条消息组件
 * 参考 Vercel AI Chatbot 模板
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Copy, Check, Pencil, RotateCcw, Code } from 'lucide-react';
import type { Message } from '@/core/types/message';
import { cn } from '@/lib/utils';

interface MessageProps {
  message: Message;
  onArtifactClick?: (artifact: { id: string; type: 'code' | 'document'; title: string; content: string; language?: string }) => void;
}

export function Message({ message, onArtifactClick }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract code blocks for artifact detection
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const hasCodeBlock = codeBlockRegex.test(message.content);

  return (
    <div
      className={cn(
        'flex gap-4 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            'text-xs',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {isUser ? 'U' : 'AI'}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div
        className={cn(
          'flex-1 max-w-[85%] space-y-2',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer message={message} />
          )}
        </div>

        {/* Action buttons */}
        <div
          className={cn(
            'flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          
          {isUser && (
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          
          {!isUser && hasCodeBlock && onArtifactClick && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                // Extract first code block
                const match = /```(\w+)?\n([\s\S]*?)```/.exec(message.content);
                if (match) {
                  onArtifactClick({
                    id: `artifact-${Date.now()}`,
                    type: 'code',
                    title: `Code Snippet (${match[1] || 'text'})`,
                    content: match[2],
                    language: match[1],
                  });
                }
              }}
            >
              <Code className="h-3 w-3" />
            </Button>
          )}
          
          {!isUser && (
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}