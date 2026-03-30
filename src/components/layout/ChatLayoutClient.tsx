/**
 * Components - ChatLayoutClient
 * 交互式布局组件 - 客户端水合
 * 处理侧边栏切换等交互逻辑
 */

'use client';

import { useEffect, useState, useRef } from 'react';
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
  const { sessions, currentSessionId, createSession, switchSession } = useSessionStore();
  const { setMessages } = useChatStore();
  const [hydrated, setHydrated] = useState(false);
  
  const loadedRef = useRef(false);

  // Wait for hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Load conversations from database (only once)
  useEffect(() => {
    if (!hydrated || loadedRef.current) return;
    loadedRef.current = true;

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

      // 获取当前本地会话（包含刚创建的本地会话）
      const currentState = useSessionStore.getState();
      const localSessions = currentState.sessions;
      const currentLocalId = currentState.currentSessionId;

      // 区分本地会话和数据库会话
      // 本地会话 ID 以 session_ 开头，数据库会话是 UUID
      const dbSessionIds = new Set(conversations?.map((c) => c.id) || []);
      const localOnlySessions = localSessions.filter((s) => !s.id.startsWith('uuid') && !dbSessionIds.has(s.id));

      if (conversations && conversations.length > 0) {
        // 加载数据库会话
        const dbSessions = await Promise.all(
          conversations.map(async (conv) => {
            const { data: messages } = await supabase
              .from('messages')
              .select('id, role, content, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: true });

            return {
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
          })
        );

        // 合并：数据库会话 + 本地独有的会话
        // 优先使用本地会话的 currentSessionId（如果是本地会话），否则用数据库第一个
        const mergedSessions = [...dbSessions, ...localOnlySessions];
        
        // 确定当前会话 ID
        let finalCurrentId: string | null;
        if (currentLocalId && localOnlySessions.some((s) => s.id === currentLocalId)) {
          // 当前选中的是本地新会话，保留
          finalCurrentId = currentLocalId;
        } else {
          // 否则用数据库第一个会话
          finalCurrentId = dbSessions[0]?.id || localOnlySessions[0]?.id || null;
        }

        useSessionStore.setState({
          sessions: mergedSessions,
          currentSessionId: finalCurrentId,
        });

        // 设置消息
        const currentSession = mergedSessions.find((s) => s.id === finalCurrentId);
        if (currentSession) {
          setMessages(currentSession.messages);
        } else {
          setMessages([]);
        }
      } else if (localOnlySessions.length > 0) {
        // 没有数据库会话，只有本地会话
        useSessionStore.setState({
          sessions: localOnlySessions,
          currentSessionId: currentLocalId || localOnlySessions[0].id,
        });
        const currentSession = localOnlySessions.find((s) => s.id === (currentLocalId || localOnlySessions[0].id));
        setMessages(currentSession?.messages || []);
      }
    };

    loadConversations();
  }, [hydrated, setMessages]);

  // Session selection handler
  const handleSessionSelect = (sessionId: string) => {
    switchSession(sessionId);
  };

  // 当 currentSessionId 变化时，同步消息到 chatStore
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    const session = useSessionStore.getState().sessions.find(s => s.id === currentSessionId);
    setMessages(session?.messages || []);
  }, [currentSessionId, setMessages]);

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