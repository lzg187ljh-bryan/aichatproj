/**
 * (chat)/page.tsx - 新对话页面
 * 访问 `/` 时渲染新对话
 */

import { ChatContainer } from '@/components/chat/ChatContainer';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function NewChatPage() {
  return (
    <ErrorBoundary>
      <ChatContainer />
    </ErrorBoundary>
  );
}