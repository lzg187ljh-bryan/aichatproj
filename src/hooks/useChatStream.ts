/**
 * Hooks - useChatStream
 * 流式聊天功能 - 直接使用 fetch 调用后端 API
 */

import { useRef, useCallback, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAIStatusStore } from '@/store/aiStatusStore';
import type { Message } from '@/core/types/message';

interface ChunkBuffer {
  chunks: string[];
  messageId: string;
}

/**
 * 双缓冲队列 - 批量更新 UI
 */
class DoubleBufferQueue {
  private writeBuffer: ChunkBuffer[] = [];
  private readBuffer: ChunkBuffer[] = [];
  private rafId: number | null = null;
  private callback: ((messageId: string, content: string) => void) | null = null;

  setCallback(callback: (messageId: string, content: string) => void) {
    this.callback = callback;
  }

  hasData(): boolean {
    return this.writeBuffer.length > 0 || this.readBuffer.length > 0;
  }

  write(messageId: string, chunk: string) {
    const existing = this.writeBuffer.find(b => b.messageId === messageId);
    if (existing) existing.chunks.push(chunk);
    else this.writeBuffer.push({ messageId, chunks: [chunk] });
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.flush.bind(this));
    }
  }

  private flush() {
    const temp = this.writeBuffer;
    this.writeBuffer = this.readBuffer;
    this.readBuffer = temp;
    const pendingData = [...this.writeBuffer];
    this.writeBuffer = [];
    if (this.callback && pendingData.length > 0) {
      for (const buffer of pendingData) {
        this.callback(buffer.messageId, buffer.chunks.join(''));
      }
    }
    if (this.writeBuffer.length > 0) {
      this.rafId = requestAnimationFrame(this.flush.bind(this));
    } else {
      this.rafId = null;
    }
  }

  destroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.writeBuffer = [];
    this.readBuffer = [];
  }
}

/**
 * 直接调用后端 API 的函数
 */
function sendToBackend(
  messages: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): AbortController {
  const controller = new AbortController();

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })) }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (controller.signal.aborted) { reader.cancel(); break; }
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            for (const line of buffer.split('\n')) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') { onDone(); break; }
                try { const p = JSON.parse(data); if (p.content) onChunk(p.content); } 
                catch { onChunk(data); }
              }
            }
          }
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') { onDone(); break; }
            try { const p = JSON.parse(data); if (p.content) onChunk(p.content); } 
            catch { onChunk(data); }
          }
        }
      }
      reader.releaseLock();
      onDone();
    })
    .catch((err) => {
      if (err instanceof Error && err.name === 'AbortError') { onDone(); return; }
      onError(err instanceof Error ? err : new Error(String(err)));
    });

  return controller;
}

/**
 * 流式聊天 Hook
 */
export function useChatStream() {
  const bufferRef = useRef<DoubleBufferQueue | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamRateRef = useRef(0);
  
  const { addMessage, appendToMessage, setMessageStatus, setLoading } = useChatStore();
  const { setStatus, setStreamRate } = useAIStatusStore();

  useEffect(() => {
    bufferRef.current = new DoubleBufferQueue();
    bufferRef.current.setCallback((messageId, content) => appendToMessage(messageId, content));
    return () => bufferRef.current?.destroy();
  }, [appendToMessage]);

  const sendMessage = useCallback(async (content: string) => {
    // 取消之前的
    if (abortControllerRef.current) abortControllerRef.current.abort();

    // 添加消息
    const userMessage = addMessage('user', content);
    const aiMessage = addMessage('assistant', '');
    setLoading(true);
    setStatus('thinking');

    // 速率统计
    let chunkCount = 0;
    const rateInterval = setInterval(() => {
      streamRateRef.current = chunkCount;
      chunkCount = 0;
      setStreamRate(streamRateRef.current);
    }, 1000);

    // 调用后端
    const controller = sendToBackend(
      [userMessage],
      (chunk) => {
        chunkCount++;
        if (!bufferRef.current?.hasData()) setStatus('typing');
        bufferRef.current?.write(aiMessage.id, chunk);
      },
      () => {
        clearInterval(rateInterval);
        setStatus('idle');
        setStreamRate(0);
        setMessageStatus(aiMessage.id, 'done');
        setLoading(false);
      },
      (error) => {
        clearInterval(rateInterval);
        setStatus('idle');
        setStreamRate(0);
        setMessageStatus(aiMessage.id, 'error', error.message);
        setLoading(false);
      }
    );

    return aiMessage.id;
  }, [addMessage, appendToMessage, setMessageStatus, setLoading, setStatus, setStreamRate]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setStreamRate(0);
    setLoading(false);
  }, [setStatus, setStreamRate, setLoading]);

  return { sendMessage, cancelStream };
}