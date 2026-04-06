/**
 * (chat)/chat/[id]/page.tsx - 历史对话页面
 * 访问 `/chat/[id]` 时渲染历史对话
 */

import { ChatContainer } from '@/components/chat/ChatContainer';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useSessionStore } from '@/store/sessionStore';

export const dynamic = 'force-dynamic';

interface ChatIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatIdPage({ params }: ChatIdPageProps) {
  const { id } = await params;
  
  return (
    <ErrorBoundary>
      <ChatContainer sessionId={id} />
    </ErrorBoundary>
  );
}