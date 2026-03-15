/**
 * Components - ChatLayoutClient
 * 交互式布局组件 - 客户端水合
 * 处理侧边栏切换等交互逻辑
 */

'use client';

import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useSessionStore } from '@/store/sessionStore';
import { useChatStore } from '@/store/chatStore';
import { useSidebarStore } from '@/store/sidebarStore';

type ClientType = 'sidebar' | 'toggle';

interface ChatLayoutClientProps {
  sidebarType: ClientType;
}

export function ChatLayoutClient({ sidebarType }: ChatLayoutClientProps) {
  const { isOpen, toggle } = useSidebarStore();
  const { sessions, currentSessionId, getCurrentSession, createSession } = useSessionStore();
  const { setMessages } = useChatStore();

  // 初始化会话或加载当前会话
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('Welcome Chat');
    } else if (currentSessionId) {
      const currentSession = getCurrentSession();
      if (currentSession) {
        setMessages(currentSession.messages);
      }
    }
  }, []);

  // 当会话切换时，加载对应的消息
  useEffect(() => {
    const currentSession = getCurrentSession();
    if (currentSession) {
      setMessages(currentSession.messages);
    } else {
      setMessages([]);
    }
  }, [currentSessionId, getCurrentSession, setMessages]);

  const handleSessionSelect = (sessionId: string) => {
    // 切换会话时不需要额外操作，useEffect 会处理
  };

  if (sidebarType === 'sidebar') {
    return <Sidebar isOpen={isOpen} onToggle={toggle} onSessionSelect={handleSessionSelect} />;
  }

  // Toggle button
  return (
    <button
      onClick={toggle}
      className="p-2 hover:bg-muted rounded-lg transition-colors"
      title={isOpen ? 'Hide sidebar' : 'Show sidebar'}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d={isOpen ? "M11 19l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
