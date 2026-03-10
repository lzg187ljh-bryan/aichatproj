/**
 * Store - Chat Messages State
 * 聊天消息状态管理
 */

import { create } from 'zustand';
import type { Message, MessageRole } from '@/core/types/message';
import { generateMessageId } from '@/core/types/message';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  
  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (role: MessageRole, content: string) => Message;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  appendToMessage: (id: string, chunk: string) => void;
  setMessageStatus: (id: string, status: Message['status'], error?: string) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,

  setMessages: (messages) => {
    set({ messages });
  },

  addMessage: (role, content) => {
    const newMessage: Message = {
      id: generateMessageId(),
      role,
      content,
      timestamp: Date.now(),
      status: role === 'user' ? 'done' : 'pending',
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
    return newMessage;
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  },

  appendToMessage: (id, chunk) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + chunk } : msg
      ),
    }));
  },

  setMessageStatus: (id, status, error) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, status, error } : msg
      ),
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));
