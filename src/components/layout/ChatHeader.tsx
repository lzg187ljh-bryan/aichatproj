/**
 * Components - ChatHeader
 * 聊天顶部栏
 * 简化版本：只保留 Sidebar 切换
 */

'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export function ChatHeader() {
  return (
    <header className="flex items-center gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm">
      <SidebarTrigger className="h-9 w-9 p-2 hover:bg-accent rounded-md" />
      <Separator orientation="vertical" className="h-6" />
      <div>
        <h1 className="text-lg font-semibold">AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          Interview Tutor
        </p>
      </div>
    </header>
  );
}