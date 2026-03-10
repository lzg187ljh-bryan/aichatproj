/**
 * Components - ChatLayout
 * 语义化布局组件
 * 集成侧边栏会话管理
 */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { useSessionStore } from '@/store/sessionStore';
import { useChatStore } from '@/store/chatStore';

interface ChatLayoutProps {
  children: ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { sessions, currentSessionId, getCurrentSession, createSession } = useSessionStore();
  const { messages, setMessages, isLoading, setLoading } = useChatStore();

  // 初始化会话或加载当前会话
  useEffect(() => {
    if (sessions.length === 0) {
      // 创建第一个会话
      createSession('Welcome Chat');
    } else if (currentSessionId) {
      // 加载当前会话的消息
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

  return (
    <main className="min-h-screen bg-chat-bg">
      <div className="max-w-full mx-auto h-screen flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 flex-shrink-0`}>
          <Sidebar onSessionSelect={handleSessionSelect} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
            {/* Toggle Sidebar Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d={sidebarOpen ? "M11 19l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
              </svg>
            </button>
            
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                AI Interview Tutor
              </h1>
              <p className="text-sm text-muted-foreground">
                Learn and practice for your interviews
              </p>
            </div>
          </header>

          {/* Chat Area */}
          <article className="flex-1 flex flex-col overflow-hidden">
            <section className="flex-1 relative overflow-hidden">
              {children}
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}
