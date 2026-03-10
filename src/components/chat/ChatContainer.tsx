/**
 * Components - ChatContainer
 * 聊天容器主组件
 */

'use client';

import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { AIAuraVisualizer } from '@/components/visual/AIAuraVisualizer';
import { useChatStream } from '@/hooks/useChatStream';
import { useSessionSync } from '@/hooks/useSessionSync';

export function ChatContainer() {
  const { sendMessage, cancelStream } = useChatStream();
  
  // 同步消息到 session store
  useSessionSync();

  return (
    <div className="relative flex flex-col h-full min-h-[500px]">
      {/* AI 光环可视化背景 */}
      <AIAuraVisualizer />
      
      {/* 消息列表 */}
      <MessageList />
      
      {/* 输入区域 */}
      <InputArea onSend={sendMessage} onCancel={cancelStream} />
    </div>
  );
}
