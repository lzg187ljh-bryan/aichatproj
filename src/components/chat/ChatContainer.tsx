/**
 * Components - ChatContainer
 * 聊天容器主组件
 * 重构：支持三栏布局 + Artifact 面板
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Messages } from './Messages';
import { MultimodalInput } from './MultimodalInput';
import { ArtifactPanel } from './ArtifactPanel';
import { AIAuraVisualizer } from '@/components/visual/AIAuraVisualizer';
import { useChatStream } from '@/hooks/useChatStream';
import { useSessionSync } from '@/hooks/useSessionSync';
import { useChatStore } from '@/store/chatStore';
import { useSessionStore } from '@/store/sessionStore';

interface Artifact {
  id: string;
  type: 'code' | 'document';
  title: string;
  content: string;
  language?: string;
  createdAt: number;
}

interface ChatContainerProps {
  sessionId?: string; // 历史会话 ID
}

export function ChatContainer({ sessionId }: ChatContainerProps) {
  const { sendMessage, cancelStream } = useChatStream();
  const { messages, isLoading, loadMessages } = useChatStore();
  const { setCurrentSession } = useSessionStore();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  
  // 根据 sessionId 加载历史会话
  useEffect(() => {
    if (sessionId) {
      setCurrentSession(sessionId);
      // TODO: 从 Supabase 加载历史消息
      // loadMessages(sessionId);
    }
  }, [sessionId, setCurrentSession]);
  
  // 同步消息到 session store
  useSessionSync();

  const handleSend = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage]
  );

  const handleExampleClick = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
    },
    [sendMessage]
  );

  const handleArtifactClick = useCallback(
    (newArtifact: { id: string; type: 'code' | 'document'; title: string; content: string; language?: string }) => {
      setArtifact({
        ...newArtifact,
        createdAt: Date.now(),
      });
    },
    []
  );

  const handleArtifactClose = useCallback(() => {
    setArtifact(null);
  }, []);

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Canvas 2D AI 光环可视化 - 保留亮点 */}
        <AIAuraVisualizer />
        
        {/* 消息列表 */}
        <Messages
          messages={messages}
          isLoading={isLoading}
          onExampleClick={handleExampleClick}
          onArtifactClick={handleArtifactClick}
        />
        
        {/* 输入区域 */}
        <MultimodalInput
          onSend={handleSend}
          onCancel={cancelStream}
          isLoading={isLoading}
        />
      </div>

      {/* Artifact Panel - 右侧面板 */}
      {artifact && (
        <ArtifactPanel
          artifact={artifact}
          onClose={handleArtifactClose}
        />
      )}
    </div>
  );
}