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
import { ToolResultList } from './ToolResult';
import { Copy, Check, Pencil, RotateCcw, Code, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { Message } from '@/core/types/message';
import { cn } from '@/lib/utils';

interface MessageProps {
  message: Message;
  onArtifactClick?: (artifact: { id: string; type: 'code' | 'document'; title: string; content: string; language?: string }) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: () => void;
  isLastMessage?: boolean;
}

export function Message({ message, onArtifactClick, onEdit, onRegenerate, isLastMessage }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditClick = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    if (onEdit && editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(message.content);
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
            isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] bg-background text-foreground resize-none"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={handleEditCancel}>
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleEditSave}>
                    <Check className="h-3 w-3 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )
          ) : (
            <div className="space-y-3">
              <MarkdownRenderer message={message} />
              {/* Tool Calls */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <ToolResultList toolCalls={message.toolCalls} />
              )}
            </div>
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
          
          {isUser && !isEditing && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEditClick}>
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
          
          {!isUser && isLastMessage && onRegenerate && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRegenerate}>
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}