/**
 * Components - ToolResult
 * 工具调用结果展示组件
 * 参考 Vercel AI Chatbot 模板
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Wrench,
} from 'lucide-react';
import type { ToolCall } from '@/core/types/message';
import { cn } from '@/lib/utils';

interface ToolResultProps {
  toolCall: ToolCall;
  isExpanded?: boolean;
}

const statusConfig = {
  pending: {
    icon: Loader2,
    color: 'text-muted-foreground',
    badge: 'secondary',
    animate: true,
  },
  running: {
    icon: Loader2,
    color: 'text-blue-500',
    badge: 'default',
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    badge: 'success',
    animate: false,
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    badge: 'destructive',
    animate: false,
  },
};

export function ToolResult({ toolCall, isExpanded = false }: ToolResultProps) {
  const [expanded, setExpanded] = useState(isExpanded);

  const config = statusConfig[toolCall.status];
  const StatusIcon = config.icon;

  // 格式化工具名称（去除前缀）
  const displayName = toolCall.name.replace(/^[a-z]+_/, '');

  // 格式化输入/输出为可读字符串
  const formatContent = (content: unknown): string => {
    if (typeof content === 'string') return content;
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  };

  return (
    <div className="border rounded-lg my-2 overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors',
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand Icon */}
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}

        {/* Tool Icon */}
        <Wrench className="h-4 w-4 text-muted-foreground" />

        {/* Tool Name */}
        <span className="font-medium text-sm">{displayName}</span>

        {/* Status Badge */}
        <Badge
          variant={config.badge as 'default' | 'secondary' | 'destructive' | 'success'}
          className={cn('ml-auto', config.animate && 'animate-pulse')}
        >
          <StatusIcon
            className={cn(
              'h-3 w-3 mr-1',
              config.color,
              config.animate && 'animate-spin',
            )}
          />
          {toolCall.status}
        </Badge>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 py-2 space-y-2 bg-background text-sm">
          {/* Tool Input */}
          {toolCall.input && Object.keys(toolCall.input).length > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Input:</div>
              <pre className="bg-muted/30 p-2 rounded text-xs overflow-x-auto">
                {formatContent(toolCall.input)}
              </pre>
            </div>
          )}

          {/* Tool Output */}
          {toolCall.output && (
            <div>
              <div className="text-muted-foreground mb-1">Output:</div>
              <pre className="bg-muted/30 p-2 rounded text-xs overflow-x-auto">
                {formatContent(toolCall.output)}
              </pre>
            </div>
          )}

          {/* Error Message */}
          {toolCall.status === 'error' && !toolCall.output && (
            <div className="text-red-500 text-xs">
              Tool execution failed. Check logs for details.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ToolResultList - 多个工具调用的列表
 */
interface ToolResultListProps {
  toolCalls: ToolCall[];
}

export function ToolResultList({ toolCalls }: ToolResultListProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="space-y-2">
      {toolCalls.map((toolCall, index) => (
        <ToolResult
          key={toolCall.id || `tool-${index}`}
          toolCall={toolCall}
          isExpanded={toolCall.status === 'error'}
        />
      ))}
    </div>
  );
}