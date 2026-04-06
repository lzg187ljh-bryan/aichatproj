/**
 * Components - ChatHeader
 * 聊天顶部栏
 * 参考 Vercel AI Chatbot 模板
 */

'use client';

import { SidebarToggle } from '@/components/chat/SidebarToggle';

export function ChatHeader() {
  return (
    <header className="flex items-center gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <SidebarToggle />
      <div>
        <h1 className="text-lg font-semibold">AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          Interview Tutor
        </p>
      </div>
    </header>
  );
}