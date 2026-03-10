/**
 * Components - MessageList
 * 虚拟列表消息列表
 * 支持海量历史记录流畅滚动
 */

'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import { MessageItem } from './MessageItem';
import { useAutoScroll } from '@/hooks/useAutoScroll';

const ITEM_HEIGHT = 100; // 估计每条消息的高度
const OVERSCAN = 5;       // 上下额外渲染的数量

export function MessageList() {
  const containerRef = useRef<HTMLDivElement>(null);
  const messages = useChatStore((state) => state.messages);
  
  console.log('[MessageList] messages:', messages.map(m => ({ id: m.id, role: m.role, status: m.status, contentLen: m.content.length, contentPreview: m.content.slice(0, 20) })));
  
  const { scrollToBottom } = useAutoScroll(containerRef, {
    enabled: true,
    threshold: 200,
  });

  // 滚动到底部当新消息到来
  useEffect(() => {
    if (messages.length > 0) {
      // 延迟滚动，确保 DOM 已更新
      setTimeout(() => {
        scrollToBottom(true);
      }, 50);
    }
  }, [messages.length, scrollToBottom]);

  // 如果没有消息，显示欢迎语
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <h2 className="text-2xl font-semibold mb-2">Welcome to AI Chat</h2>
          <p>Start a conversation by typing a message below.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6"
    >
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
        />
      ))}
    </div>
  );
}
