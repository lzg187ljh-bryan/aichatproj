/**
 * Components - Sidebar
 * 会话列表侧边栏
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSessionStore, type Session } from '@/store/sessionStore';
import { ParticleSphere } from '@/components/visual/ParticleSphere';
import { LoginButton } from '@/components/auth/LoginButton';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onSessionSelect?: (sessionId: string) => void;
}

export function Sidebar({ isOpen = true, onToggle, onSessionSelect }: SidebarProps) {
  const {
    sessions,
    currentSessionId,
    createSession,
    deleteSession,
    renameSession,
    switchSession,
  } = useSessionStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newChatName, setNewChatName] = useState('');

  // 创建新会话
  const handleCreateSession = useCallback(() => {
    const name = newChatName.trim() || undefined;
    const session = createSession(name);
    setNewChatName('');
    setIsCreating(false);
    onSessionSelect?.(session.id);
  }, [createSession, newChatName, onSessionSelect]);

  // 开始重命名
  const startRename = useCallback((session: Session) => {
    setEditingId(session.id);
    setEditName(session.name);
  }, []);

  // 提交重命名
  const submitRename = useCallback(() => {
    if (editingId && editName.trim()) {
      renameSession(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  }, [editingId, editName, renameSession]);

  // 删除会话
  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this chat?')) {
      deleteSession(id);
    }
  }, [deleteSession]);

  // 切换会话
  const handleSelect = useCallback((id: string) => {
    switchSession(id);
    onSessionSelect?.(id);
  }, [switchSession, onSessionSelect]);

  // 如果侧边栏关闭，不渲染
  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-72 h-full bg-sidebar border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <ParticleSphere />
          <h2 className="text-lg font-semibold text-foreground">Chats</h2>
        </div>
        
        {/* New Chat Button / Input */}
        {isCreating ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Chat name..."
              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSession();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <button
              onClick={handleCreateSession}
              className="px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-medium
                       hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        )}
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {sessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <div
                  onClick={() => handleSelect(session.id)}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
                             transition-colors ${
                               session.id === currentSessionId
                                 ? 'bg-primary/10 text-primary'
                                 : 'hover:bg-muted text-foreground'
                             }`}
                >
                  {/* Chat Icon */}
                  <svg className="w-5 h-5 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>

                  {/* Name */}
                  {editingId === session.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={submitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded
                                 focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 truncate text-sm">{session.name}</span>
                  )}

                  {/* Actions */}
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(session);
                      }}
                      className="p-1.5 hover:bg-muted rounded"
                      title="Rename"
                    >
                      <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 功能入口 */}
      <div className="px-2 py-2 border-t border-border">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>设置 / 角色</span>
        </Link>
        
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-xs">知识库 (待开发)</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs">工具调用 (待开发)</span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <LoginButton />
        <p className="text-xs text-muted-foreground text-center mt-2">
          {sessions.length} chat{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>
    </aside>
  );
}
