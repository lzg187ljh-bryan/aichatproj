/**
 * Hooks - useChatStream
 * 流式聊天核心 Hook - 处理消息发送和 SSE 流式响应
 * 
 * 数据流:
 * 1. 用户输入 → sendMessage()
 * 2. 添加消息到 chatStore (user + assistant 占位)
 * 3. fetch('/api/chat') 发送请求
 * 4. 接收 SSE 流式响应 → DoubleBufferQueue 缓冲
 * 5. RAF 批量更新 → chatStore.appendToMessage()
 * 6. React 重新渲染显示
 */

import { useRef, useCallback, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useSessionStore } from '@/store/sessionStore';
import { useAIStatusStore } from '@/store/aiStatusStore';
import type { Message } from '@/core/types/message';

/**
 * 缓冲区 - 存储单个消息的多个字符块
 * messageId: 消息ID
 * chunks: 累积的字符数组
 */
interface ChunkBuffer {
  chunks: string[];
  messageId: string;
}

/**
 * DoubleBufferQueue - 双缓冲队列
 * 作用: 批量更新 UI，避免每个字符都触发 React 渲染
 * 
 * 工作原理:
 * 1. write() 收到字符 → 写入 writeBuffer
 * 2. 触发 requestAnimationFrame
 * 3. RAF 回调中: 交换 writeBuffer 和 readBuffer
 * 4. 遍历 readBuffer，批量调用 callback 更新 UI
 * 5. 如果 writeBuffer 还有数据，继续 RAF
 */
class DoubleBufferQueue {
  // 写入缓冲区 - 接收新字符
  private writeBuffer: ChunkBuffer[] = [];
  // 读取缓冲区 - 供 RAF 消费
  private readBuffer: ChunkBuffer[] = [];
  // RAF ID，用于取消动画帧
  private rafId: number | null = null;
  // 回调函数 - 更新 chatStore
  private callback: ((messageId: string, content: string) => void) | null = null;

  /**
   * 设置回调函数
   * callback 会在 RAF 触发时被调用，参数是 (messageId, accumulatedContent)
   */
  setCallback(callback: (messageId: string, content: string) => void) {
    this.callback = callback;
  }

  /**
   * 检查是否有待处理数据
   */
  hasData(): boolean {
    return this.writeBuffer.length > 0 || this.readBuffer.length > 0;
  }

  /**
   * 写入单个字符块
   * 1. 找到对应消息的缓冲区，不存在则创建
   * 2. 触发 RAF (如果还没触发)
   */
  write(messageId: string, chunk: string) {
    // 查找或创建该消息的缓冲区
    const existing = this.writeBuffer.find(b => b.messageId === messageId);
    if (existing) {
      existing.chunks.push(chunk);
    } else {
      this.writeBuffer.push({ messageId, chunks: [chunk] });
    }
    // 触发 RAF (每帧只触发一次)
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.flush.bind(this));
    }
  }

  /**
   * RAF 回调 - 批量更新 UI
   * 1. 交换 writeBuffer 和 readBuffer
   * 2. 遍历 readBuffer，调用 callback
   * 3. 如果 writeBuffer 还有数据，继续 RAF
   */
  private flush() {
    // 交换缓冲区
    const temp = this.writeBuffer;
    this.writeBuffer = this.readBuffer;
    this.readBuffer = temp;
    
    // 复制待处理数据
    const pendingData = [...this.writeBuffer];
    // 清空 writeBuffer，准备接收新数据
    this.writeBuffer = [];
    
    // 批量调用回调
    if (this.callback && pendingData.length > 0) {
      for (const buffer of pendingData) {
        // 合并所有 chunks 为一个字符串
        this.callback(buffer.messageId, buffer.chunks.join(''));
      }
    }
    
    // 如果还有数据，继续 RAF
    if (this.writeBuffer.length > 0) {
      this.rafId = requestAnimationFrame(this.flush.bind(this));
    } else {
      this.rafId = null;
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.writeBuffer = [];
    this.readBuffer = [];
  }
}

/**
 * sendToBackend - 发送请求到后端 API
 * 
 * 参数:
 * - messages: 消息数组 (只传 user 消息)
 * - conversationId: 会话 ID (UUID 或 null)
 * - newConversationTitle: 新会话标题
 * - onChunk: 每个字符块的回调
 * - onDone: 完成时的回调
 * - onError: 错误时的回调
 * 
 * 返回:
 * - AbortController，用于取消请求
 */
function sendToBackend(
  messages: Message[],                          // 用户消息
  conversationId: string | null,               // 会话 ID (null = 新建)
  newConversationTitle: string | undefined,   // 新会话标题
  onChunk: (chunk: string) => void,            // 字符块回调
  onDone: (conversationId: string | null) => void,  // 完成回调
  onError: (error: Error) => void              // 错误回调
): AbortController {
  // 创建 AbortController，用于取消请求
  const controller = new AbortController();

  // 发送 POST 请求到 /api/chat
  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      conversationId,
      newConversationTitle,
    }),
    signal: controller.signal,  // 绑定 AbortSignal
  })
    .then(async (response) => {
      // 检查响应状态
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error('No response body');

      // 从响应头获取新建的会话 ID
      const newConversationId = response.headers.get('X-Conversation-Id');

      // 获取响应体的读取器
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // 循环读取流数据
      while (true) {
        // 检查是否已取消
        if (controller.signal.aborted) { reader.cancel(); break; }
        
        // 读取下一块数据
        const { done, value } = await reader.read();
        
        if (done) {
          // 处理最后剩余的数据
          if (buffer.trim()) {
            for (const line of buffer.split('\n')) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') { onDone(newConversationId); break; }
                // 解析 JSON，提取 content
                try { const p = JSON.parse(data); if (p.content) onChunk(p.content); } 
                catch { onChunk(data); }  // 非 JSON 直接当作文本
              }
            }
          }
          break;
        }
        
        // 解码二进制数据
        buffer += decoder.decode(value, { stream: true });
        
        // 按行分割
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';  // 保留未完成的一行
        
        // 解析每行
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') { onDone(newConversationId); break; }
            try { const p = JSON.parse(data); if (p.content) onChunk(p.content); } 
            catch { onChunk(data); }
          }
        }
      }
      
      reader.releaseLock();
      onDone(newConversationId);
    })
    .catch((err) => {
      // AbortError 是主动取消，不是错误
      if (err instanceof Error && err.name === 'AbortError') { onDone(null); return; }
      onError(err instanceof Error ? err : new Error(String(err)));
    });

  return controller;
}

/**
 * useChatStream - 流式聊天 Hook
 * 
 * 导出:
 * - sendMessage(content: string): 发送消息
 * - cancelStream(): 取消当前请求
 */
export function useChatStream() {
  // Refs
  const bufferRef = useRef<DoubleBufferQueue | null>(null);  // 双缓冲队列
  const abortControllerRef = useRef<AbortController | null>(null);  // 请求控制器
  const streamRateRef = useRef(0);  // 流速统计 (字符/秒)
  
  // Store hooks
  const { addMessage, setMessageStatus, setLoading, clearMessages } = useChatStore();
  const { currentSessionId, getCurrentSession } = useSessionStore();
  const { setStatus, setStreamRate } = useAIStatusStore();

  /**
   * handleChunk - DoubleBufferQueue 的回调
   * 在 RAF 触发时被调用，更新 chatStore 中的消息内容
   */
  const handleChunk = useCallback((messageId: string, content: string) => {
    // 直接调用 store，避免依赖问题
    useChatStore.getState().appendToMessage(messageId, content);
  }, []);

  /**
   * 初始化/清理 DoubleBufferQueue
   */
  useEffect(() => {
    bufferRef.current = new DoubleBufferQueue();
    bufferRef.current.setCallback(handleChunk);
    return () => bufferRef.current?.destroy();
  }, [handleChunk]);

  /**
   * sendMessage - 发送消息的入口函数
   * 
   * 步骤:
   * 1. 获取当前会话信息
   * 2. 取消之前的请求
   * 3. 添加 user 和 assistant 消息到 store
   * 4. 启动速率统计
   * 5. 调用 sendToBackend
   * 6. 处理响应 (chunk/done/error)
   */
  const sendMessage = useCallback(async (content: string) => {
    // ===== 1. 获取当前会话信息 =====
    const currentSession = getCurrentSession();
    let conversationId = currentSession?.id || null;
    
    // 检查是否是本地新建的会话 (session_ 开头)
    const isNewLocalSession = conversationId?.startsWith('session_');
    const sessionName = currentSession?.name;

    // 如果是本地会话，需要后端创建真正的会话
    let newConversationTitle: string | undefined;
    if (isNewLocalSession && sessionName) {
      newConversationTitle = sessionName;
    }
    if (isNewLocalSession) {
      conversationId = null;  // 不传 ID，让后端创建新会话
    }

    // ===== 2. 取消之前的请求 =====
    if (abortControllerRef.current) abortControllerRef.current.abort();

    // ===== 3. 添加消息到 chatStore =====
    // 用户消息
    const userMessage = addMessage('user', content);
    // AI 消息占位 (空内容，等待流式更新)
    const aiMessage = addMessage('assistant', '');
    setLoading(true);  // 加载中
    setStatus('thinking');  // AI 思考中

    // ===== 4. 速率统计 (每秒更新) =====
    let chunkCount = 0;
    const rateInterval = setInterval(() => {
      streamRateRef.current = chunkCount;
      chunkCount = 0;
      setStreamRate(streamRateRef.current);
    }, 1000);

    // ===== 5. 调用后端 API =====
    sendToBackend(
      [userMessage],                    // 只传用户消息
      conversationId,                    // 会话 ID
      newConversationTitle,              // 新会话标题
      // onChunk: 收到字符块
      (chunk) => {
        chunkCount++;  // 计数
        // 首次收到数据时，状态改为 typing
        if (!bufferRef.current?.hasData()) setStatus('typing');
        // 写入缓冲区，触发 RAF
        bufferRef.current?.write(aiMessage.id, chunk);
      },
      // onDone: 完成
      (newConversationId) => {
        clearInterval(rateInterval);
        setStatus('idle');
        setStreamRate(0);
        setMessageStatus(aiMessage.id, 'done');  // 消息完成
        setLoading(false);

        // 如果创建了新会话，更新本地会话 ID
        // 从 session_xxx 变为数据库的 UUID
        if (isNewLocalSession && newConversationId && currentSession) {
          useSessionStore.setState((state) => ({
            sessions: state.sessions.map(s => 
              s.id === currentSession.id 
                ? { ...s, id: newConversationId } 
                : s
            ),
            currentSessionId: newConversationId,
          }));
        }
      },
      // onError: 错误
      (error) => {
        clearInterval(rateInterval);
        setStatus('idle');
        setStreamRate(0);
        setMessageStatus(aiMessage.id, 'error', error.message);
        setLoading(false);
      }
    );

    return aiMessage.id;
  }, [addMessage, getCurrentSession, setMessageStatus, setLoading, setStatus, setStreamRate]);

  /**
   * cancelStream - 取消当前流式请求
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

  return { sendMessage, cancelStream };
}