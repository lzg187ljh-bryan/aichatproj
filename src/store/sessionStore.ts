/**
 * Store - Session Management
 * 会话管理 + localStorage 持久化
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
  
  // Actions
  createSession: (name?: string) => Session;
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  switchSession: (id: string) => void;
  getCurrentSession: () => Session | null;
  addMessageToCurrentSession: (message: Message) => void;
  updateMessageInCurrentSession: (messageId: string, updates: Partial<Message>) => void;
  clearCurrentSession: () => void;
}

// 生成默认会话名
function generateSessionName(): string {
  const now = new Date();
  return `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,

      createSession: (name?: string) => {
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
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== id);
          let newCurrentId = state.currentSessionId;
          
          // 如果删除的是当前会话，切换到第一个
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
    }),
    {
      name: 'ai-chat-sessions',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);
