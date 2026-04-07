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
  const { sendMessage, regenerate, editAndResend, cancelStream } = useChatStream();
  const { messages, isLoading } = useChatStore();
  const { switchSession, sessions } = useSessionStore();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  
  // 根据 sessionId 加载历史会话
  useEffect(() => {
    if (sessionId) {
      switchSession(sessionId);
      // 加载该会话的消息
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        useChatStore.getState().setMessages(session.messages);
      }
    }
  }, [sessionId, switchSession, sessions]);
  
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

  const handleEdit = useCallback((messageId: string, newContent: string) => {
    editAndResend(messageId, newContent);
  }, [editAndResend]);

  const handleRegenerate = useCallback(() => {
    regenerate();
  }, [regenerate]);

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* 消息列表 */}
        <Messages
          messages={messages}
          isLoading={isLoading}
          onExampleClick={handleExampleClick}
          onArtifactClick={handleArtifactClick}
          onEdit={handleEdit}
          onRegenerate={handleRegenerate}
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