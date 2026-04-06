/**
 * Components - ChatLayout (Server Component)
 * 三栏布局：Sidebar + Chat + ArtifactPanel
 * 参考 Vercel AI Chatbot 模板
 */

import { Suspense } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { SidebarSkeleton } from '@/components/ui/SidebarSkeleton';
import { ChatSkeleton } from '@/components/ui/ChatSkeleton';
import { ChatHeader } from './ChatHeader';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
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
          <Suspense fallback={<ChatSkeleton />}>
            {children}
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}