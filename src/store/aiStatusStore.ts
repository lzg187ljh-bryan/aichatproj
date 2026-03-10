/**
 * Store - AI Status State
 * AI 状态机管理 (idle / thinking / typing)
 */

import { create } from 'zustand';

export type AIStatus = 'idle' | 'thinking' | 'typing';

interface AIStatusState {
  status: AIStatus;
  setStatus: (status: AIStatus) => void;
  streamRate: number;  // 流式速率 (chunks per second)
  setStreamRate: (rate: number) => void;
}

export const useAIStatusStore = create<AIStatusState>((set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
  streamRate: 0,
  setStreamRate: (streamRate) => set({ streamRate }),
}));
