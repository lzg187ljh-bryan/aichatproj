/**
 * Services - SSE AI Adapter
 * 使用 Server-Sent Events 实现真实流式响应
 * 可替代 MockAIAdapter 对接真实 AI API
 */

import type { Message } from '@/core/types/message';
import type { IAIProvider } from '@/core/interfaces/IAIProvider';

/**
 * SSE 流式 AI 适配器
 * 使用 EventSource 接收服务器推送的流式数据
 */
export class SSEAIAdapter implements IAIProvider {
  private baseURL: string;
  private apiKey?: string;

  constructor(baseURL: string = '/api/chat', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  sendMessageStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): AbortController {
    const controller = new AbortController();
    const { signal } = controller;

    // 构建请求体
    const requestBody = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    };

    // 使用 fetch + ReadableStream 实现自定义流式读取
    fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify(requestBody),
      signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            if (signal.aborted) {
              reader.cancel();
              break;
            }

            const { done, value } = await reader.read();

            if (done) {
              // 处理缓冲区中剩余的数据
              if (buffer.trim()) {
                const lines = buffer.split('\n');
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                      break;
                    }
                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.content) {
                        onChunk(parsed.content);
                      }
                    } catch {
                      // 如果不是 JSON，直接作为文本返回
                      onChunk(data);
                    }
                  }
                }
              }
              break;
            }

            // 解码并处理数据
            buffer += decoder.decode(value, { stream: true });

            // 按行分割处理
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留不完整的行

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  onDone();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    onChunk(parsed.content);
                  }
                } catch {
                  // 非 JSON 格式，直接返回
                  onChunk(data);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        onDone();
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          // 用户主动取消
          onDone();
        } else {
          console.error('[SSEAIAdapter] Error:', err);
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return controller;
  }
}

/**
 * 简化的 EventSource 版本
 * 适用于服务器直接推送 SSE 格式的场景
 */
export class SimpleSSEAdapter implements IAIProvider {
  private baseURL: string;

  constructor(baseURL: string = '/api/chat') {
    this.baseURL = baseURL;
  }

  sendMessageStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): AbortController {
    const controller = new AbortController();
    const { signal } = controller;

    // 构建 URL 和请求参数
    const url = new URL(this.baseURL, window.location.origin);
    url.searchParams.set('messages', JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))));

    const eventSource = new EventSource(url.toString());

    eventSource.onmessage = (event) => {
      const data = event.data;

      if (data === '[DONE]') {
        eventSource.close();
        onDone();
        return;
      }

      // 解析 JSON 或直接返回文本
      try {
        const parsed = JSON.parse(data);
        onChunk(parsed.content || data);
      } catch {
        onChunk(data);
      }
    };

    eventSource.onerror = (err) => {
      eventSource.close();

      if (signal.aborted) {
        onDone();
      } else {
        onError(new Error('SSE connection error'));
      }
    };

    // 监听 abort 信号
    signal.addEventListener('abort', () => {
      eventSource.close();
      onDone();
    });

    return controller;
  }
}
