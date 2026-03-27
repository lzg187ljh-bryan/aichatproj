/**
 * Components - ChatLayoutClient
 * 交互式布局组件 - 客户端水合
 * 处理侧边栏切换等交互逻辑
 */

'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { useSessionStore } from '@/store/sessionStore';
import { useChatStore } from '@/store/chatStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { createBrowserClient } from '@supabase/ssr';

type ClientType = 'sidebar' | 'toggle';

interface ChatLayoutClientProps {
  sidebarType: ClientType;
}

export function ChatLayoutClient({ sidebarType }: ChatLayoutClientProps) {
  const { isOpen, toggle } = useSidebarStore();
  const { sessions, currentSessionId, getCurrentSession, createSession, switchSession } = useSessionStore();
  const { setMessages } = useChatStore();
  const [hydrated, setHydrated] = useState(false);

  // Wait for hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Load conversations from database when hydrated
  useEffect(() => {
    if (!hydrated) return;

    const loadConversations = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (conversations && conversations.length > 0) {
        // Import generateMessageId
        const { generateMessageId } = await import('@/core/types/message');
        
        // Convert DB conversations to session format
        for (const conv of conversations) {
          const existingSession = useSessionStore.getState().sessions.find(s => s.id === conv.id);
          if (!existingSession) {
            // Get messages for this conversation
            const { data: messages } = await supabase
              .from('messages')
              .select('id, role, content, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: true });

            const session = {
              id: conv.id,
              name: conv.title,
              messages: (messages || []).map((m: any) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: new Date(m.created_at).getTime(),
                status: 'done' as const,
              })),
              createdAt: new Date(conv.created_at).getTime(),
              updatedAt: new Date(conv.updated_at).getTime(),
            };

            // Add to store
            useSessionStore.setState((state) => ({
              sessions: [session, ...state.sessions],
            }));
          }
        }

        // Switch to most recent conversation
        const mostRecent = conversations[0].id;
        if (!currentSessionId) {
          switchSession(mostRecent);
        }
      }
    };

    loadConversations();
  }, [hydrated]);

  // Initialize session only after hydration
  useEffect(() => {
    if (!hydrated) return;

    if (sessions.length === 0) {
      createSession('Welcome Chat');
    }
  }, [hydrated, sessions.length]);

  // Load messages when session changes
  useEffect(() => {
    if (!hydrated) return;

    const currentSession = getCurrentSession();
    if (currentSession) {
      setMessages(currentSession.messages);
    }
  }, [hydrated, currentSessionId, getCurrentSession, setMessages]);

  const handleSessionSelect = (sessionId: string) => {
    switchSession(sessionId);
  };

  if (sidebarType === 'sidebar') {
    return <Sidebar isOpen={isOpen} onToggle={toggle} onSessionSelect={handleSessionSelect} />;
  }

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