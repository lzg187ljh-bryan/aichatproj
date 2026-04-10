/**
 * Hooks - useSessionSync
 * 会话消息同步 - 简化版
 * 
 * 重要：切换会话时不应该同步消息！
 * 只在用户发送新消息时才需要同步到 sessionStore（用于 localStorage 持久化）
 * 加载消息由 ChatLayoutClient 单独负责
 */

'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useSessionStore } from '@/store/sessionStore';
import type { Message } from '@/core/types/message';

export function useSessionSync() {
  // 使用 any 类型避免循环依赖
  const chatMessages = useChatStore((state: any) => state.messages);
  const currentSessionId = useSessionStore((state: any) => state.currentSessionId);
  const sessions = useSessionStore((state: any) => state.sessions);
  const addMessageToCurrentSession = useSessionStore((state: any) => state.addMessageToCurrentSession);
  const updateMessageInCurrentSession = useSessionStore((state: any) => state.updateMessageInCurrentSession);
  
  // 使用 ref 跟踪上一次同步时的 chatMessages 长度
  // 只有当消息变多（用户发送消息）时才同步，而不是切换会话时
  const prevMessagesLengthRef = useRef<number>(0);

  // 当消息变化时，同步到 sessionStore
  useEffect(() => {
    if (!currentSessionId) return;

    const currentSession = sessions.find((s: any) => s.id === currentSessionId);
    if (!currentSession) return;

    // 如果消息变多了（用户发送了新消息），才同步
    // 如果消息数量减少了或不变，说明是切换会话，不同步
    if (chatMessages.length > prevMessagesLengthRef.current) {
      const sessionMessages = currentSession.messages;
      const sessionMessageIds = new Set(sessionMessages.map((m: Message) => m.id));

      // 检测新增的消息（通过 ID 判断）
      const newMessages = chatMessages.filter((msg: Message) => !sessionMessageIds.has(msg.id));
      for (const msg of newMessages) {
        addMessageToCurrentSession(msg);
      }

      // 检测更新的消息（内容或状态变化）
      for (const msg of chatMessages) {
        const existingMsg = sessionMessages.find((m: Message) => m.id === msg.id);
        if (existingMsg && (
          existingMsg.content !== msg.content || 
          existingMsg.status !== msg.status
        )) {
          updateMessageInCurrentSession(msg.id, msg);
        }
      }
    }
    // 即使消息数量不变，也检查状态变化（用于流完成后更新状态）
    else if (chatMessages.length === prevMessagesLengthRef.current && chatMessages.length > 0) {
      const currentSession = sessions.find((s: any) => s.id === currentSessionId);
      if (currentSession) {
        const sessionMessages = currentSession.messages;
        
        // 检测状态变化
        for (const msg of chatMessages) {
          const existingMsg = sessionMessages.find((m: Message) => m.id === msg.id);
          if (existingMsg && existingMsg.status !== msg.status) {
            updateMessageInCurrentSession(msg.id, msg);
          }
        }
      }
    }

    // 更新上一次的消息长度
    prevMessagesLengthRef.current = chatMessages.length;
  }, [chatMessages, currentSessionId, sessions, addMessageToCurrentSession, updateMessageInCurrentSession]);
}
