/**
 * Hooks - useSessionSync
 * 会话消息同步
 * 将 chatStore 的消息同步到 sessionStore
 */

'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useSessionStore } from '@/store/sessionStore';
import type { Message } from '@/core/types/message';

export function useSessionSync() {
  const messages = useChatStore((state) => state.messages);
  const { currentSessionId, addMessageToCurrentSession, updateMessageInCurrentSession } = useSessionStore();
  
  const prevMessagesRef = useRef<Message[]>([]);
  const prevSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 如果没有当前会话，跳过
    if (!currentSessionId) return;

    // 如果会话切换了，重置引用
    if (currentSessionId !== prevSessionIdRef.current) {
      prevMessagesRef.current = messages;
      prevSessionIdRef.current = currentSessionId;
      return;
    }

    // 检测新消息或更新的消息
    const prevMessages = prevMessagesRef.current;
    
    // 找到新增的消息
    if (messages.length > prevMessages.length) {
      const newMessages = messages.slice(prevMessages.length);
      for (const msg of newMessages) {
        addMessageToCurrentSession(msg);
      }
    }

    // 检测更新的消息 (如 status 变化)
    for (const msg of messages) {
      const prevMsg = prevMessages.find(m => m.id === msg.id);
      if (prevMsg && prevMsg.content !== msg.content) {
        updateMessageInCurrentSession(msg.id, msg);
      }
    }

    // 更新引用
    prevMessagesRef.current = messages;
  }, [messages, currentSessionId, addMessageToCurrentSession, updateMessageInCurrentSession]);
}
