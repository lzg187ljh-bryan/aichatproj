/**
 * Components - Settings Content
 * 设置页面内容 - 角色管理
 */

'use client';

import { useState } from 'react';
import { useAISettingsStore, type PresetRole } from '@/store/aiSettingsStore';
import { DEFAULT_ROLES } from '@/lib/ai-engine';
import Link from 'next/link';

export function SettingsContent() {
  const {
    currentRoleId,
    customRoles,
    setCurrentRole,
    addCustomRole,
    updateCustomRole,
    deleteCustomRole,
  } = useAISettingsStore();

  const [editingRole, setEditingRole] = useState<PresetRole | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePrompt, setNewRolePrompt] = useState('');

  // 合并所有角色 (预设 + 自定义)
  const allRoles = [...DEFAULT_ROLES, ...customRoles];
  const currentRole = allRoles.find((r) => r.id === currentRoleId) || DEFAULT_ROLES[0];

  const handleCreateRole = () => {
    if (!newRoleName.trim() || !newRolePrompt.trim()) return;

    const newRole: PresetRole = {
      id: `custom_${Date.now()}`,
      name: newRoleName.trim(),
      description: '自定义角色',
      systemPrompt: newRolePrompt.trim(),
    };

    addCustomRole(newRole);
    setNewRoleName('');
    setNewRolePrompt('');
    setIsCreating(false);
  };

  const handleSaveRole = () => {
    if (!editingRole) return;

    updateCustomRole(editingRole.id, {
      name: editingRole.name,
      systemPrompt: editingRole.systemPrompt,
    });
    setEditingRole(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">设置</h1>
          <p className="text-muted-foreground mt-1">管理 AI 助手角色和配置</p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
        >
          返回聊天
        </Link>
      </div>

      {/* 当前角色 */}
      <section className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">当前角色</h2>
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{currentRole.name}</h3>
            <p className="text-sm text-muted-foreground">{currentRole.description}</p>
          </div>
          <span className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full">
            活跃中
          </span>
        </div>
      </section>

      {/* 角色列表 */}
      <section className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">角色管理</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            + 新建角色
          </button>
        </div>

        {/* 新建角色表单 */}
        {isCreating && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                角色名称
              </label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="例如：产品经理"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                系统提示词
              </label>
              <textarea
                value={newRolePrompt}
                onChange={(e) => setNewRolePrompt(e.target.value)}
                placeholder="定义这个角色的行为和能力..."
                rows={4}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateRole}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                创建
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewRoleName('');
                  setNewRolePrompt('');
                }}
                className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 角色列表 */}
        <div className="space-y-2">
          {allRoles.map((role) => (
            <div
              key={role.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer
                ${currentRoleId === role.id
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-muted/30 border-border hover:bg-muted/50'
                }`}
              onClick={() => setCurrentRole(role.id)}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-lg">
                  {role.id === 'interviewer' ? '👨‍💼' :
                   role.id === 'code-reviewer' ? '👨‍💻' :
                   role.id === 'teacher' ? '👩‍🏫' : '🤖'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{role.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {role.systemPrompt.slice(0, 60)}...
                </p>
              </div>
              <div className="flex items-center gap-2">
                {role.id.startsWith('custom_') && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRole(role);
                      }}
                      className="p-2 text-muted-foreground hover:text-foreground"
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('确定删除这个角色吗？')) {
                          deleteCustomRole(role.id);
                        }
                      }}
                      className="p-2 text-muted-foreground hover:text-red-500"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </>
                )}
                {currentRoleId === role.id && (
                  <span className="px-2 py-1 text-xs bg-primary text-white rounded">
                    选中
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 编辑角色弹窗 */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">编辑角色</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  角色名称
                </label>
                <input
                  type="text"
                  value={editingRole.name}
                  onChange={(e) =>
                    setEditingRole({ ...editingRole, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  系统提示词
                </label>
                <textarea
                  value={editingRole.systemPrompt}
                  onChange={(e) =>
                    setEditingRole({ ...editingRole, systemPrompt: e.target.value })
                  }
                  rows={6}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingRole(null)}
                className="px-4 py-2 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80"
              >
                取消
              </button>
              <button
                onClick={handleSaveRole}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 信息说明 */}
      <section className="bg-muted/30 rounded-xl p-4 border border-border">
        <h3 className="text-sm font-medium text-foreground mb-2">💡 说明</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 预设角色不可编辑和删除</li>
          <li>• 自定义角色可以编辑和删除</li>
          <li>• 切换角色后，当前聊天的系统提示词不会立即生效</li>
        </ul>
      </section>
    </div>
  );
}