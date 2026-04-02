/**
 * Store - AI Settings
 * AI 相关设置管理 (角色选择等)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_ROLES } from '@/lib/ai-engine';
import type { PresetRole } from '@/lib/ai-engine';

export type { PresetRole };

interface AI_SettingsState {
  // 当前选中的角色
  currentRoleId: string;
  
  // 自定义角色列表
  customRoles: PresetRole[];
  
  // Actions
  setCurrentRole: (roleId: string) => void;
  addCustomRole: (role: PresetRole) => void;
  updateCustomRole: (roleId: string, updates: Partial<PresetRole>) => void;
  deleteCustomRole: (roleId: string) => void;
  getCurrentRole: () => PresetRole;
}

export const useAISettingsStore = create<AI_SettingsState>()(
  persist(
    (set, get) => ({
      currentRoleId: 'default',
      customRoles: [],

      setCurrentRole: (roleId: string) => {
        set({ currentRoleId: roleId });
      },

      addCustomRole: (role: PresetRole) => {
        set((state) => ({
          customRoles: [...state.customRoles, role],
        }));
      },

      updateCustomRole: (roleId: string, updates: Partial<PresetRole>) => {
        set((state) => ({
          customRoles: state.customRoles.map((r) =>
            r.id === roleId ? { ...r, ...updates } : r
          ),
        }));
      },

      deleteCustomRole: (roleId: string) => {
        set((state) => ({
          customRoles: state.customRoles.filter((r) => r.id !== roleId),
          // 如果删除的是当前角色，切换回默认
          currentRoleId: state.currentRoleId === roleId ? 'default' : state.currentRoleId,
        }));
      },

      getCurrentRole: () => {
        const state = get();
        // 先查找自定义角色
        const custom = state.customRoles.find((r) => r.id === state.currentRoleId);
        if (custom) return custom;
        // 再查找预设角色
        const preset = DEFAULT_ROLES.find((r) => r.id === state.currentRoleId);
        return preset || DEFAULT_ROLES[0];
      },
    }),
    {
      name: 'ai-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);