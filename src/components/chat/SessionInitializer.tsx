/**
 * SessionInitializer
 * 初始化会话状态：
 * - 未登录用户：创建临时会话（不持久化）
 * - 登录用户：从数据库加载会话
 */

'use client';

import { useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useSessionStore } from '@/store/sessionStore';

export function SessionInitializer() {
  const initialized = useRef(false);
  const { 
    createSession, 
    setIsAuthenticated,
    clearAllSessions 
  } = useSessionStore();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initSession = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      const isAuth = !!user;
      
      setIsAuthenticated(isAuth);

      if (!isAuth) {
        // 未登录用户：清空任何持久化的数据，创建临时会话
        clearAllSessions();
        
        // 如果没有会话，创建一个临时会话
        const currentState = useSessionStore.getState();
        if (currentState.sessions.length === 0) {
          createSession();
        }
      }
      // 登录用户的会话加载在 AppSidebar 中处理
    };

    initSession();
  }, [createSession, setIsAuthenticated, clearAllSessions]);

  // 这个组件不渲染任何内容
  return null;
}
