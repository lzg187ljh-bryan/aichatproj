/**
 * Store - Chat Messages State
 * 聊天消息状态管理
 */

import { create } from 'zustand';
import type { Message, MessageRole } from '@/core/types/message';
import { generateMessageId } from '@/core/types/message';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  selectedModel: string;  // 当前选择的百炼模型
  
  // Actions
  setMessages: (messages: Message[]) => void;
  setSelectedModel: (model: string) => void;
  addMessage: (role: MessageRole, content: string) => Message;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  appendToMessage: (id: string, chunk: string) => void;
  setMessageStatus: (id: string, status: Message['status'], error?: string) => void;
  deleteMessage: (id: string) => void;
  deleteMessagesFrom: (id: string) => void; // 删除从指定消息开始的所有后续消息
  getLastUserMessage: () => Message | null;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  selectedModel: 'glm-5',  // 默认使用 Qwen Plus

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

  deleteMessage: (id) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    }));
  },

  deleteMessagesFrom: (id) => {
    set((state) => {
      const index = state.messages.findIndex((msg) => msg.id === id);
      if (index === -1) return state;
      return { messages: state.messages.slice(0, index) };
    });
  },

  getLastUserMessage: () => {
    // 返回 null，在 hooks 中直接处理
    return null;
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setSelectedModel: (model) => {
    set({ selectedModel: model });
  },
}));
