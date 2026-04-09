/**
 * Store - Session Management
 * 会话管理 + localStorage 持久化（仅登录用户）
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Message } from '@/core/types/message';
import { generateMessageId } from '@/core/types/message';

export interface Session {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  isAuthenticated: boolean;
  
  // Actions
  createSession: (name?: string) => Session;
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  switchSession: (id: string) => void;
  getCurrentSession: () => Session | null;
  addMessageToCurrentSession: (message: Message) => void;
  updateMessageInCurrentSession: (messageId: string, updates: Partial<Message>) => void;
  clearCurrentSession: () => void;
  setIsAuthenticated: (value: boolean) => void;
  clearAllSessions: () => void;
}

// 生成默认会话名
function generateSessionName(): string {
  const now = new Date();
  return `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// 生成临时会话 ID（非持久化）
function generateTempSessionId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 创建临时会话
function createTempSession(): Session {
  return {
    id: generateTempSessionId(),
    name: 'Temporary Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      isAuthenticated: false,

      createSession: (name?: string) => {
        const { isAuthenticated } = get();
        
        // 未登录用户：不允许创建新会话
        if (!isAuthenticated) {
          // 返回当前临时会话，不创建新的
          const currentSession = get().getCurrentSession();
          if (currentSession) {
            return currentSession;
          }
          // 如果没有临时会话，创建一个
          const tempSession = createTempSession();
          set({
            sessions: [tempSession],
            currentSessionId: tempSession.id,
          });
          return tempSession;
        }

        // 登录用户：正常创建会话
        const newSession: Session = {
          id: `session_${generateMessageId()}`,
          name: name || generateSessionName(),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id,
        }));

        return newSession;
      },

      deleteSession: (id: string) => {
        const { isAuthenticated } = get();
        
        // 未登录用户：删除会话相当于清空当前临时会话
        if (!isAuthenticated) {
          const tempSession = createTempSession();
          set({
            sessions: [tempSession],
            currentSessionId: tempSession.id,
          });
          return;
        }

        // 登录用户：正常删除
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== id);
          let newCurrentId = state.currentSessionId;
          
          if (id === state.currentSessionId) {
            newCurrentId = newSessions.length > 0 ? newSessions[0].id : null;
          }

          return {
            sessions: newSessions,
            currentSessionId: newCurrentId,
          };
        });
      },

      renameSession: (id: string, name: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, name, updatedAt: Date.now() } : s
          ),
        }));
      },

      switchSession: (id: string) => {
        set({ currentSessionId: id });
      },

      getCurrentSession: () => {
        const state = get();
        return state.sessions.find((s) => s.id === state.currentSessionId) || null;
      },

      addMessageToCurrentSession: (message: Message) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === state.currentSessionId
              ? {
                  ...s,
                  messages: [...s.messages, message],
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      updateMessageInCurrentSession: (messageId: string, updates: Partial<Message>) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === state.currentSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      clearCurrentSession: () => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === state.currentSessionId
              ? { ...s, messages: [], updatedAt: Date.now() }
              : s
          ),
        }));
      },

      setIsAuthenticated: (value: boolean) => {
        set({ isAuthenticated: value });
      },

      clearAllSessions: () => {
        set({ sessions: [], currentSessionId: null });
      },
    }),
    {
      name: 'ai-chat-sessions',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // 未登录用户：不持久化任何数据
        if (!state.isAuthenticated) {
          return {
            sessions: [],
            currentSessionId: null,
            isAuthenticated: false,
          };
        }
        // 登录用户：正常持久化
        return {
          sessions: state.sessions,
          currentSessionId: state.currentSessionId,
          isAuthenticated: state.isAuthenticated,
        };
      },
    }
  )
);
