/**
 * Components - ChatLayout (Server Component)
 * 语义化布局组件 - 服务端渲染外壳
 * 仅包含静态结构和 Suspense 边界
 */

import { Suspense } from 'react';
import { ChatLayoutClient } from './ChatLayoutClient';
import { SidebarSkeleton } from '@/components/ui/SidebarSkeleton';
import { ChatSkeleton } from '@/components/ui/ChatSkeleton';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <main className="min-h-screen bg-chat-bg">
      <div className="max-w-full mx-auto h-screen flex">
        {/* Sidebar with Suspense */}
        <div className="w-72 flex-shrink-0">
          <Suspense fallback={<SidebarSkeleton />}>
            <ChatLayoutClient sidebarType="sidebar" />
          </Suspense>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header - Static Server Rendered */}
          <header className="border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
            {/* Toggle Sidebar Button (Client island) */}
            <ChatLayoutClient sidebarType="toggle" />
            
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                AI Interview Tutor
              </h1>
              <p className="text-sm text-muted-foreground">
                Learn and practice for your interviews
              </p>
            </div>
          </header>

          {/* Chat Area with Suspense */}
          <article className="flex-1 flex flex-col overflow-hidden">
            <section className="flex-1 relative overflow-hidden">
              <Suspense fallback={<ChatSkeleton />}>
                {children}
              </Suspense>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}
