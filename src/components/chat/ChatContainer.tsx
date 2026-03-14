/**
 * Components - ChatContainer
 * 聊天容器主组件
 */

'use client';

import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { AIAuraVisualizer } from '@/components/visual/AIAuraVisualizer';
import { KnowledgeGraphVisualizer } from '@/components/visual/KnowledgeGraphVisualizer';
import { useChatStream } from '@/hooks/useChatStream';
import { useSessionSync } from '@/hooks/useSessionSync';

export function ChatContainer() {
  const { sendMessage, cancelStream } = useChatStream();
  
  // 同步消息到 session store
  useSessionSync();

  return (
    <div className="relative flex flex-col h-full min-h-[500px]">
      {/* Canvas 2D AI 光环可视化 */}
      <AIAuraVisualizer />
      
      {/* WebGL 知识图谱可视化 */}
      <KnowledgeGraphVisualizer />
      
      {/* 消息列表 */}
      <MessageList />
      
      {/* 输入区域 */}
      <InputArea onSend={sendMessage} onCancel={cancelStream} />
    </div>
  );
}
