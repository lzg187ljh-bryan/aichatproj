/**
 * Services - SSE AI Adapter
 * 使用 fetch + ReadableStream 实现流式请求
 */

import type { Message } from '@/core/types/message';

/**
 * SSE 流式 AI 适配器
 */
export class SSEAIAdapter {
  constructor(private baseURL: string = '/api/chat') {}

  sendMessageStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): AbortController {
    const controller = new AbortController();
    const { signal } = controller;

    fetch(this.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })) }),
      signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            if (signal.aborted) { reader.cancel(); break; }
            const { done, value } = await reader.read();
            if (done) {
              if (buffer.trim()) {
                for (const line of buffer.split('\n')) {
                  if (line.startsWith('data: ')) this.processLine(line.slice(6), onChunk, onDone);
                }
              }
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) this.processLine(line.slice(6), onChunk, onDone);
            }
          }
        } finally {
          reader.releaseLock();
        }
        onDone();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') onError(err instanceof Error ? err : new Error(String(err)));
        else onDone();
      });

    return controller;
  }

  private processLine(data: string, onChunk: (chunk: string) => void, onDone: () => void) {
    if (data === '[DONE]') { onDone(); return; }
    try {
      const parsed = JSON.parse(data);
      if (parsed.content) onChunk(parsed.content);
    } catch {
      onChunk(data);
    }
  }
}

// 默认实例
export const aiProvider = new SSEAIAdapter('/api/chat');