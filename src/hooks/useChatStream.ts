/**
 * Hooks - useChatStream
 * 流式数据处理核心 Hook
 * 包含双缓冲队列 + RAF 批量更新
 */

import { useRef, useCallback, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAIStatusStore } from '@/store/aiStatusStore';
import { aiProvider } from '@/services/AIProviderFactory';
import type { IAIProvider } from '@/core/interfaces/IAIProvider';
import type { Message } from '@/core/types/message';

interface UseChatStreamOptions {
  provider?: IAIProvider;
}

interface ChunkBuffer {
  chunks: string[];
  messageId: string;
}

/**
 * 双缓冲队列管理器
 */
class DoubleBufferQueue {
  private writeBuffer: ChunkBuffer[] = [];
  private readBuffer: ChunkBuffer[] = [];
  private rafId: number | null = null;
  private callback: ((messageId: string, content: string) => void) | null = null;

  setCallback(callback: (messageId: string, content: string) => void) {
    this.callback = callback;
  }

  /**
   * 检查缓冲区是否为空
   */
  hasData(): boolean {
    return this.writeBuffer.length > 0 || this.readBuffer.length > 0;
  }

  /**
   * 写入缓冲区 (在 setInterval 回调中调用)
   */
  write(messageId: string, chunk: string) {
    // 查找是否有该消息的现有缓冲
    const existing = this.writeBuffer.find(b => b.messageId === messageId);
    if (existing) {
      existing.chunks.push(chunk);
    } else {
      this.writeBuffer.push({ messageId, chunks: [chunk] });
    }

    // 如果 RAF 未运行，启动它
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.flush.bind(this));
    }
  }

  /**
   * 刷新缓冲区 (对接到浏览器渲染帧)
   */
  private flush() {
    // 交换读写缓冲区
    const temp = this.writeBuffer;
    this.writeBuffer = this.readBuffer;
    this.readBuffer = temp;

    // 保存待处理数据的副本 (交换后 writeBuffer 变为原 readBuffer，需重新填充)
    const pendingData = [...this.writeBuffer];
    
    // 清空写缓冲，准备下一轮
    this.writeBuffer = [];

    // 执行批量更新
    if (this.callback && pendingData.length > 0) {
      for (const buffer of pendingData) {
        const content = buffer.chunks.join('');
        this.callback(buffer.messageId, content);
      }
    }

    // 检查是否还有待处理数据
    if (this.writeBuffer.length > 0) {
      this.rafId = requestAnimationFrame(this.flush.bind(this));
    } else {
      this.rafId = null;
    }
  }

  /**
   * 销毁
   */
  destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.writeBuffer = [];
    this.readBuffer = [];
  }
}

/**
 * 流式聊天 Hook
 */
export function useChatStream(options: UseChatStreamOptions = {}) {
  const providerRef = useRef<IAIProvider>(options.provider || aiProvider);
  const abortControllerRef = useRef<AbortController | null>(null);
  const bufferRef = useRef<DoubleBufferQueue | null>(null);
  const streamRateRef = useRef<number>(0);
  const isBufferReadyRef = useRef(false);
  
  const { addMessage, appendToMessage, setMessageStatus, setLoading } = useChatStore();
  const { setStatus, setStreamRate } = useAIStatusStore();

  // 初始化双缓冲队列
  useEffect(() => {
    bufferRef.current = new DoubleBufferQueue();
    bufferRef.current.setCallback((messageId, content) => {
      appendToMessage(messageId, content);
    });
    isBufferReadyRef.current = true;

    return () => {
      bufferRef.current?.destroy();
      isBufferReadyRef.current = false;
    };
  }, [appendToMessage]);

  /**
   * 发送消息并接收流式响应
   */
  const sendMessage = useCallback(async (content: string) => {
    console.log('[useChatStream] sendMessage called:', content);
    
    // 取消之前的请求
    if (abortControllerRef.current) {
      console.log('[useChatStream] aborting previous request');
      abortControllerRef.current.abort();
    }

    // 确保 buffer 已初始化
    if (!bufferRef.current || !isBufferReadyRef.current) {
      console.log('[useChatStream] initializing buffer');
      bufferRef.current = new DoubleBufferQueue();
      bufferRef.current.setCallback((messageId, content) => {
        console.log('[useChatStream] callback appending:', messageId, content.slice(0, 50));
        appendToMessage(messageId, content);
      });
      isBufferReadyRef.current = true;
    }

    // 创建新的 AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    console.log('[useChatStream] adding user message');
    // 添加用户消息
    const userMessage = addMessage('user', content);
    setLoading(true);

    console.log('[useChatStream] adding AI message');
    // 添加 AI 响应消息 (初始为空)
    const aiMessage = addMessage('assistant', '');
    setMessageStatus(aiMessage.id, 'streaming');

    // 设置状态为 thinking (等待 TTFT)
    setStatus('thinking');

    // 流式速率计数器
    let chunkCount = 0;
    const rateInterval = setInterval(() => {
      const rate = chunkCount;
      chunkCount = 0;
      streamRateRef.current = rate;
      setStreamRate(rate);
    }, 1000);

    console.log('[useChatStream] calling provider.sendMessageStream');
    // 调用流式接口 (使用已创建的 controller)
    providerRef.current.sendMessageStream(
      [userMessage],
      // onChunk - 流式片段回调
      (chunk: string) => {
        console.log('[useChatStream] received chunk:', chunk);
        chunkCount++;
        
        // 首次收到 chunk，切换到 typing 状态
        if (!bufferRef.current?.hasData()) {
          setStatus('typing');
        }

        // 写入双缓冲队列
        bufferRef.current?.write(aiMessage.id, chunk);
      },
      // onDone - 完成回调
      () => {
        console.log('[useChatStream] stream done');
        clearInterval(rateInterval);
        setStatus('idle');
        setStreamRate(0);
        setMessageStatus(aiMessage.id, 'done');
        setLoading(false);
      },
      // onError - 错误回调
      (error: Error) => {
        console.log('[useChatStream] stream error:', error);
        clearInterval(rateInterval);
        setStatus('idle');
        setStreamRate(0);
        setMessageStatus(aiMessage.id, 'error', error.message);
        setLoading(false);
      }
    );

    return aiMessage.id;
  }, [addMessage, appendToMessage, setMessageStatus, setLoading, setStatus, setStreamRate]);

  /**
   * 取消当前流式请求
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setStreamRate(0);
    setLoading(false);
  }, [setStatus, setStreamRate, setLoading]);

  return {
    sendMessage,
    cancelStream,
  };
}
