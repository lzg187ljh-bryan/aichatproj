/**
 * Components - AppSidebar
 * 使用 shadcn/ui 的应用侧边栏
 * 包含会话管理、功能入口、登录状态
 */

'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Plus,
  Settings,
  Trash2,
  Edit2,
  Database,
  Zap,
  ChevronDown,
  Trash,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSessionStore, type Session } from '@/store/sessionStore';
import { useChatStore } from '@/store/chatStore';
import { LoginButton } from '@/components/auth/LoginButton';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { Lock, Clock } from 'lucide-react';


export function AppSidebar() {
  const router = useRouter();
  const {
    sessions,
    currentSessionId,
    createSession,
    deleteSession,
    renameSession,
    switchSession,
    setIsAuthenticated,
    clearAllSessions,
  } = useSessionStore();
  const { setMessages } = useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const loadedRef = useRef(false);

  // Wait for hydration
  useEffect(() => {
    // 使用 requestAnimationFrame 避免同步 setState
    requestAnimationFrame(() => {
      setHydrated(true);
    });
  }, []);

  // 监听登录状态并同步到 session store
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsAuthenticated(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuth = !!session?.user;
      setUser(session?.user ?? null);
      setIsAuthenticated(isAuth);
      
      // 登录状态变化时：未登录则清空本地会话
      if (!isAuth) {
        clearAllSessions();
        // 创建新的临时会话
        createSession();
      }
    });

    return () => subscription.unsubscribe();
  }, [setIsAuthenticated, clearAllSessions, createSession]);

  // Load conversations from database (only once)
  useEffect(() => {
    if (!hydrated || loadedRef.current) return;
    loadedRef.current = true;

    const loadConversations = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      
      setUser(currentUser);

      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });

      const currentState = useSessionStore.getState();
      const localSessions = currentState.sessions;
      const currentLocalId = currentState.currentSessionId;

      const dbSessionIds = new Set(conversations?.map((c) => c.id) || []);
      const localOnlySessions = localSessions.filter(
        (s) => !s.id.startsWith('uuid') && !dbSessionIds.has(s.id)
      );

      if (conversations && conversations.length > 0) {
        const dbSessions = await Promise.all(
          conversations.map(async (conv) => {
            const { data: messages } = await supabase
              .from('messages')
              .select('id, role, content, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: true });

            return {
              id: conv.id,
              name: conv.title,
              messages: (messages || []).map((m: { id: string; role: string; content: string; created_at: string }) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: new Date(m.created_at).getTime(),
                status: 'done' as const,
              })),
              createdAt: new Date(conv.created_at).getTime(),
              updatedAt: new Date(conv.updated_at).getTime(),
            };
          })
        );

        const mergedSessions = [...dbSessions, ...localOnlySessions];
        
        let finalCurrentId: string | null;
        if (currentLocalId && localOnlySessions.some((s) => s.id === currentLocalId)) {
          finalCurrentId = currentLocalId;
        } else {
          finalCurrentId = dbSessions[0]?.id || localOnlySessions[0]?.id || null;
        }

        useSessionStore.setState({
          sessions: mergedSessions,
          currentSessionId: finalCurrentId,
        });

        const currentSession = mergedSessions.find((s) => s.id === finalCurrentId);
        setMessages(currentSession?.messages || []);
      } else if (localOnlySessions.length > 0) {
        useSessionStore.setState({
          sessions: localOnlySessions,
          currentSessionId: currentLocalId || localOnlySessions[0].id,
        });
        const currentSession = localOnlySessions.find(
          (s) => s.id === (currentLocalId || localOnlySessions[0].id)
        );
        setMessages(currentSession?.messages || []);
      }
    };

    loadConversations();
  }, [hydrated, setMessages]);

  // Sync messages when session changes
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    const session = useSessionStore.getState().sessions.find((s) => s.id === currentSessionId);
    setMessages(session?.messages || []);
  }, [currentSessionId, setMessages]);

  // Handlers
  const handleCreateSession = useCallback(() => {
    const name = newChatName.trim() || undefined;
    createSession(name);
    setNewChatName('');
    setIsCreating(false);
    // 导航到新对话页面
    router.push('/');
  }, [createSession, newChatName, router]);

  const startRename = useCallback((session: Session) => {
    setEditingId(session.id);
    setEditName(session.name);
  }, []);

  const submitRename = useCallback(() => {
    if (editingId && editName.trim()) {
      renameSession(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  }, [editingId, editName, renameSession]);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Delete this chat?')) {
      deleteSession(id);
    }
  }, [deleteSession]);

  const handleSelect = useCallback((id: string) => {
    switchSession(id);
    router.push(`/chat/${id}`);
  }, [switchSession, router]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    return {
      today: sessions.filter(s => s.updatedAt >= today.getTime()),
      yesterday: sessions.filter(s => {
        const date = new Date(s.updatedAt);
        return date >= yesterday && date < today;
      }),
      last7Days: sessions.filter(s => {
        const date = new Date(s.updatedAt);
        return date >= last7Days && date < yesterday;
      }),
      older: sessions.filter(s => {
        const date = new Date(s.updatedAt);
        return date < last7Days;
      }),
    };
  }, [sessions]);

  // Render a single session item
  const renderSessionItem = (session: Session) => (
    <SidebarMenuItem key={session.id}>
      {editingId === session.id ? (
        <div className="flex gap-2 w-full">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') setEditingId(null);
            }}
            className="h-7"
            autoFocus
          />
        </div>
      ) : (
        <div className="flex items-center w-full group">
          <SidebarMenuButton
            isActive={session.id === currentSessionId}
            onClick={() => handleSelect(session.id)}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="truncate">{session.name}</span>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 ml-auto opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => startRename(session)}>
                <Edit2 className="mr-2 h-3 w-3" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDelete(session.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader>
        {/* Toggle + Logo */}
        <div className="flex items-center gap-1 px-1">
          <SidebarTrigger />
          <SidebarMenu className="flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">AI Chat</span>
                    <span className="text-xs text-muted-foreground">AI Assistant</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        {/* Action Buttons */}
        {isCreating ? (
          <div className="flex gap-2 p-2">
            <Input
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Chat name..."
              className="h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSession();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <Button size="sm" onClick={handleCreateSession}>
              Add
            </Button>
          </div>
        ) : (
          <SidebarMenu>
            {/* 未登录时隐藏 New Chat 按钮 */}
            {user && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsCreating(true)}
                  tooltip="New Chat"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {/* 登录后才显示 "Delete all" */}
            {user && sessions.length > 0 && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    if (confirm('Delete all chats? This cannot be undone.')) {
                      sessions.forEach(s => deleteSession(s.id));
                    }
                  }}
                  tooltip="Delete all"
                >
                  <Trash className="h-4 w-4" />
                  <span>Delete all</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      {/* Chat List with Groups */}
      <SidebarContent>
        {!user ? (
          // 未登录状态：显示临时会话提示
          <div className="px-4 py-6">
            <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Temporary Session
              </p>
              <p className="text-xs text-muted-foreground/80">
                Your chats are stored in memory only and will be lost when you refresh or close the page.
              </p>
              <div className="mt-3 pt-3 border-t border-dashed border-muted-foreground/20">
                <p className="text-xs text-muted-foreground mb-2">
                  🔒 Sign in to save your chat history permanently
                </p>
              </div>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm px-2">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          <>
            {/* Today */}
            {groupedSessions.today.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Today</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupedSessions.today.map((session) => renderSessionItem(session))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            {/* Yesterday */}
            {groupedSessions.yesterday.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Yesterday</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupedSessions.yesterday.map((session) => renderSessionItem(session))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            {/* Last 7 Days */}
            {groupedSessions.last7Days.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Last 7 Days</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupedSessions.last7Days.map((session) => renderSessionItem(session))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            {/* Older */}
            {groupedSessions.older.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Older</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupedSessions.older.map((session) => renderSessionItem(session))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarSeparator />

      {/* Feature Links */}
      <SidebarGroup>
        <SidebarGroupLabel>Features</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild disabled={!user}>
                <Link href={user ? "/settings" : "#"}>
                  <Settings className="h-4 w-4" />
                  <span>Settings / Roles</span>
                  {!user && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <Database className="h-4 w-4" />
                <span>Knowledge Base</span>
                <Badge variant="outline" className="ml-auto">Soon</Badge>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <Zap className="h-4 w-4" />
                <span>Tool Calls</span>
                <Badge variant="outline" className="ml-auto">Soon</Badge>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <LoginButton />
          </SidebarMenuItem>
          {!user && (
            <SidebarMenuItem className="px-2 py-1">
              <p className="text-xs text-muted-foreground text-center">
                🔒 Sign in to sync your chats
              </p>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem className="text-xs text-muted-foreground text-center">
            {sessions.length} chat{sessions.length !== 1 ? 's' : ''}
            {!user && sessions.length > 0 && ' (local)'}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}