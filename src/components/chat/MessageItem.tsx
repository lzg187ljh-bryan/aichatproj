/**
 * Components - MessageItem
 * 单条消息渲染组件
 * 支持多种消息类型: text, thinking, tool-call, source, code
 */

'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { Message } from '@/core/types/message';
import { useBookmarkStore } from '@/store/bookmarkStore';
import { useSessionStore } from '@/store/sessionStore';

// 动态导入 MarkdownRenderer - 首屏不加载
const MarkdownRenderer = dynamic(
  () => import('./MarkdownRenderer').then(mod => ({ default: mod.MarkdownRenderer })),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-4 bg-muted/30 rounded w-3/4"></div>
  }
);

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const messageIdRef = useRef(message.id);
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarkStore();
  const { currentSessionId } = useSessionStore();

  const bookmarked = isBookmarked(message.id);

  // 切换收藏状态
  const toggleBookmark = () => {
    if (bookmarked) {
      const bookmark = bookmarks.find(b => b.messageId === message.id);
      if (bookmark) {
        removeBookmark(bookmark.id);
      }
    } else if (currentSessionId) {
      addBookmark(message, currentSessionId);
    }
  };

  const isUser = message.role === 'user';
  const isAI = message.role === 'assistant';
  const isThinking = message.status === 'pending' && message.type === 'thinking';
  const isStreaming = message.status === 'streaming';

  return (
    <article
      className={`message-enter mb-4 ${
        isUser ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[90%]'
      }`}
    >
      {/* 消息主体 */}
      <div
        className={`rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-user-msg text-foreground'
            : 'bg-ai-msg text-foreground'
        }`}
      >
        {/* 角色标签 */}
        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
          {isUser ? (
            <>
              <span>You</span>
            </>
          ) : (
            <>
              <span>AI</span>
              {message.type === 'tool-call' && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                  Tool
                </span>
              )}
              {message.type === 'source' && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                  RAG
                </span>
              )}
            </>
          )}
        </div>

        {/* Thinking 状态 */}
        {isThinking && (
          <div className="flex items-center gap-2 text-muted-foreground py-2">
            <span className="animate-spin">⏳</span>
            <span className="text-sm">思考中...</span>
          </div>
        )}

        {/* 工具调用卡片 */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-3 space-y-2">
            {message.toolCalls.map((tool) => (
              <div
                key={tool.id}
                className={`p-2 rounded border text-xs ${
                  tool.status === 'running'
                    ? 'border-blue-300 bg-blue-50'
                    : tool.status === 'completed'
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">🔧 {tool.name}</span>
                  <span className="text-muted-foreground">
                    {tool.status === 'running' && '执行中...'}
                    {tool.status === 'completed' && '✓ 完成'}
                    {tool.status === 'error' && '✗ 错误'}
                  </span>
                </div>
                {tool.output && (
                  <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(tool.output, null, 2).slice(0, 200)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 引用来源 (RAG) */}
        {message.sources && message.sources.length > 0 && (
          <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
            <div className="text-xs font-medium text-green-700 mb-1">📚 参考资料</div>
            {message.sources.map((source) => (
              <div key={source.id} className="text-xs text-green-600 mb-1">
                <span className="font-medium">{source.title}</span>
                <span className="text-green-500 ml-1">
                  {source.score ? `(匹配度: ${(source.score * 100).toFixed(1)}%)` : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 消息内容 */}
        {!isThinking && (
          <>
            {!isUser ? (
              <MarkdownRenderer
                message={message}
                onBookmarkToggle={toggleBookmark}
                isBookmarked={bookmarked}
              />
            ) : (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}
          </>
        )}

        {/* 流式输出中的光标 */}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
        )}
      </div>

      {/* 时间戳 */}
      <time className="text-xs text-muted-foreground mt-1 block">
        {new Date(message.timestamp).toLocaleTimeString()}
      </time>
    </article>
  );
}
