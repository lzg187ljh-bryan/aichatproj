/**
 * Components - AppSidebar
 * 使用 shadcn/ui 的应用侧边栏
 * 包含会话管理、功能入口、登录状态
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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

export function AppSidebar() {
  const router = useRouter();
  const {
    sessions,
    currentSessionId,
    createSession,
    deleteSession,
    renameSession,
    switchSession,
  } = useSessionStore();
  const { setMessages } = useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const loadedRef = useRef(false);

  // Wait for hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Load conversations from database (only once)
  useEffect(() => {
    if (!hydrated || loadedRef.current) return;
    loadedRef.current = true;

    const loadConversations = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
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
              messages: (messages || []).map((m: any) => ({
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

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
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
                  <span className="text-xs text-muted-foreground">Interview Tutor</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* New Chat Button */}
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
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full m-2"
            variant="default"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      {/* Chat List */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm px-2">
                  No chats yet. Start a new conversation!
                </div>
              ) : (
                sessions.map((session) => (
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
                      <SidebarMenuButton
                        isActive={session.id === currentSessionId}
                        onClick={() => handleSelect(session.id)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="truncate">{session.name}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="ml-auto opacity-0 group-hover:opacity-100 hover:bg-accent rounded p-1">
                              <ChevronDown className="h-3 w-3" />
                            </button>
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
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* Feature Links */}
      <SidebarGroup>
        <SidebarGroupLabel>Features</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  <span>Settings / Roles</span>
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
          <SidebarMenuItem className="text-xs text-muted-foreground text-center">
            {sessions.length} chat{sessions.length !== 1 ? 's' : ''}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}