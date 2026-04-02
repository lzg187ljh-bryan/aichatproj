/**
 * Agent Store - Agent 模式状态管理
 */

import { create } from 'zustand';
import type { Message } from '@/core/types/message';

// Agent 状态
export type AgentStatus = 'idle' | 'planning' | 'executing' | 'thinking' | 'completed' | 'error';

// Agent 步骤
export interface AgentStep {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  action: string;
  result?: string;
  timestamp: number;
}

// Agent 实例
export interface AgentInstance {
  id: string;
  type: string;
  name: string;
  description: string;
  status: AgentStatus;
  steps: AgentStep[];
  currentStepIndex: number;
  messages: Message[];
  createdAt: number;
}

// Agent 类型定义
export const AGENT_TYPES = [
  {
    id: 'research',
    name: '调研助手',
    description: '搜索和分析信息，生成调研报告',
    icon: '🔍',
  },
  {
    id: 'code',
    name: '代码助手',
    description: '分析代码、找出问题、提供优化建议',
    icon: '👨‍💻',
  },
  {
    id: 'writer',
    name: '写作助手',
    description: '辅助写作、校对、润色文本',
    icon: '✍️',
  },
] as const;

interface AgentState {
  // 当前 Agent 实例
  currentAgent: AgentInstance | null;
  
  // 历史记录
  agentHistory: AgentInstance[];
  
  // Actions
  createAgent: (type: string) => void;
  updateAgentStatus: (status: AgentStatus) => void;
  addStep: (action: string) => void;
  updateStep: (stepId: string, updates: Partial<AgentStep>) => void;
  addMessage: (message: Message) => void;
  appendToLastMessage: (content: string) => void;
  clearAgent: () => void;
  finishAgent: (finalMessage: string) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  currentAgent: null,
  agentHistory: [],

  createAgent: (type: string) => {
    const agentType = AGENT_TYPES.find((t) => t.id === type) || AGENT_TYPES[0];
    const newAgent: AgentInstance = {
      id: `agent_${Date.now()}`,
      type: agentType.id,
      name: agentType.name,
      description: agentType.description,
      status: 'idle',
      steps: [],
      currentStepIndex: -1,
      messages: [],
      createdAt: Date.now(),
    };
    set({ currentAgent: newAgent });
  },

  updateAgentStatus: (status: AgentStatus) => {
    set((state) => ({
      currentAgent: state.currentAgent
        ? { ...state.currentAgent, status }
        : null,
    }));
  },

  addStep: (action: string) => {
    const step: AgentStep = {
      id: `step_${Date.now()}`,
      status: 'running',
      action,
      timestamp: Date.now(),
    };
    set((state) => ({
      currentAgent: state.currentAgent
        ? {
            ...state.currentAgent,
            steps: [...state.currentAgent.steps, step],
            currentStepIndex: state.currentAgent.steps.length,
          }
        : null,
    }));
  },

  updateStep: (stepId: string, updates: Partial<AgentStep>) => {
    set((state) => ({
      currentAgent: state.currentAgent
        ? {
            ...state.currentAgent,
            steps: state.currentAgent.steps.map((s) =>
              s.id === stepId ? { ...s, ...updates } : s
            ),
          }
        : null,
    }));
  },

  addMessage: (message: Message) => {
    set((state) => ({
      currentAgent: state.currentAgent
        ? {
            ...state.currentAgent,
            messages: [...state.currentAgent.messages, message],
          }
        : null,
    }));
  },

  appendToLastMessage: (content: string) => {
    set((state) => {
      if (!state.currentAgent || state.currentAgent.messages.length === 0) {
        return state;
      }
      const messages = [...state.currentAgent.messages];
      const lastMsg = messages[messages.length - 1];
      messages[messages.length - 1] = {
        ...lastMsg,
        content: lastMsg.content + content,
      };
      return {
        currentAgent: {
          ...state.currentAgent,
          messages,
        },
      };
    });
  },

  clearAgent: () => {
    const state = get();
    if (state.currentAgent) {
      set((s) => ({
        agentHistory: [s.currentAgent!, ...s.agentHistory].slice(0, 10),
        currentAgent: null,
      }));
    }
  },

  finishAgent: (finalMessage: string) => {
    set((state) => {
      if (!state.currentAgent) return state;
      
      // 添加完成消息
      const finalMsg: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: finalMessage,
        timestamp: Date.now(),
        status: 'done',
      };
      
      const completedAgent = {
        ...state.currentAgent,
        status: 'completed' as AgentStatus,
        messages: [...state.currentAgent.messages, finalMsg],
      };
      
      return {
        currentAgent: completedAgent,
        agentHistory: [completedAgent, ...state.agentHistory].slice(0, 10),
      };
    });
  },
}));