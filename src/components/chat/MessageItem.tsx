/**
 * Components - MessageItem
 * 单条消息渲染组件
 * 使用动态导入的 MarkdownRenderer
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

  return (
    <article
      className={`message-enter mb-4 ${
        isUser ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[90%]'
      }`}
    >
      <div
        className={`rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-user-msg text-foreground'
            : 'bg-ai-msg text-foreground'
        }`}
      >
        {/* 角色标签 */}
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {isUser ? 'You' : 'AI Assistant'}
        </div>

        {/* 消息内容 - 使用动态加载的 MarkdownRenderer */}
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
      </div>

      {/* 时间戳 */}
      <time className="text-xs text-muted-foreground mt-1 block">
        {new Date(message.timestamp).toLocaleTimeString()}
      </time>
    </article>
  );
}
