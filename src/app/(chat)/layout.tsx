/**
 * (chat) Route Group Layout
 * 包含 SidebarProvider + AppSidebar + SidebarInset
 * 参考 Vercel AI Chatbot 模板结构
 */

import { Suspense } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarSkeleton } from '@/components/ui/SidebarSkeleton';
import { ChatHeader } from '@/components/layout/ChatHeader';
import { SessionInitializer } from '@/components/chat/SessionInitializer';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      {/* 初始化会话状态 */}
      <SessionInitializer />
      
      {/* Left: Sidebar - 默认折叠，通过 toggle 展开 */}
      <Suspense fallback={<SidebarSkeleton />}>
        <AppSidebar />
      </Suspense>
      
      {/* Center + Right: Main Area */}
      <SidebarInset className="flex flex-col overflow-hidden min-w-0">
        {/* Header - 非 sticky，正常流式布局 */}
        <ChatHeader />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden min-w-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}