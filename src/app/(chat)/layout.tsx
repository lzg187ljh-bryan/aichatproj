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

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* Left: Sidebar */}
      <Suspense fallback={<SidebarSkeleton />}>
        <AppSidebar />
      </Suspense>
      
      {/* Center + Right: Main Area */}
      <SidebarInset className="flex flex-col">
        {/* Header */}
        <ChatHeader />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}