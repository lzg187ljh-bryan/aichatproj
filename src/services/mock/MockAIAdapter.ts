/**
 * Services - Mock AI Adapter
 * 模拟真实 AI 的 TTFT 首字延迟 + 流式吐字 + 网络中断
 */

import type { Message } from '@/core/types/message';
import type { IAIProvider } from '@/core/interfaces/IAIProvider';

/**
 * Mock 流式 AI 适配器
 * 模拟真实 AI 的 TTFT 首字延迟 + 流式吐字 + 网络中断
 */
export class MockAIAdapter implements IAIProvider {
  // 复杂 Markdown 语料库 (多级标题、段落、表格、代码块)
  private readonly corpus: string = `# AI 对话系统架构设计

## 概述

本文档描述了一个**产业级**的 AI 对话系统架构，采用现代化的前端技术栈实现高性能、高可用的智能对话应用。

## 核心技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| Next.js 14 | 框架 | 14.2+ |
| TypeScript | 类型安全 | 5.4+ |
| Zustand | 状态管理 | 4.5+ |
| Canvas API | 可视化 | 2.0 |
| Web Worker | 后台计算 | - |

## 架构分层

系统采用**关注点分离**原则，分为以下层次：

1. **Core Layer** - 核心类型定义与接口契约
2. **Services Layer** - 业务服务与外部适配器
3. **Store Layer** - 状态管理与数据流
4. **Components Layer** - UI 组件与可视化
5. **Workers Layer** - 后台计算线程

## 代码示例

\`\`\`typescript
interface IAIProvider {
  sendMessageStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): AbortController;
}
\`\`\`

## 性能优化策略

### 1. 双缓冲队列
拦截高频 Chunk，对齐 RAF 渲染帧进行批量更新，避免阻塞主线程。

### 2. 虚拟列表
仅渲染可视区域内的消息，支持海量历史记录流畅滚动。

### 3. Web Worker
将耗时的 Markdown 解析、语法高亮、HTML 清洗全部卸载到后台线程。

## 核心特性

- **流式响应** - 模拟真实 AI 的逐字输出体验
- **可中断** - 支持 AbortController 取消正在进行的请求
- **状态联动** - AI 状态 (idle/thinking/typing) 与 UI 动画实时同步
- **Retina 支持** - 自动处理高分屏 Canvas 模糊问题

> 这是一个模拟的真实流式响应演示。
> 系统能够处理各种复杂的 Markdown 内容，包括表格、代码块、列表等。
> 无论是技术文档还是日常对话，都能完美呈现。

---

*本系统展示了现代 Web 应用的最佳实践*`;

  // 配置参数
  private readonly TTFT_DELAY = 600;      // 首字延迟 (ms)
  private readonly CHUNK_INTERVAL = 30;  // 流式间隔 (ms)
  private readonly CHUNK_SIZE_MIN = 2;   // 最小单次吐字数
  private readonly CHUNK_SIZE_MAX = 5;   // 最大单次吐字数

  sendMessageStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): AbortController {
    const controller = new AbortController();
    const { signal } = controller;
    
    let currentIndex = 0;
    let streamInterval: ReturnType<typeof setInterval> | null = null;

    // 监听 abort 信号 - 立即终止
    const handleAbort = () => {
      if (streamInterval) {
        clearInterval(streamInterval);
        streamInterval = null;
      }
      // 触发 onDone 表示终止
      onDone();
    };

    signal.addEventListener('abort', handleAbort);

    // 模拟 TTFT 首字延迟
    console.log('[MockAIAdapter] Starting TTFT delay:', this.TTFT_DELAY);
    setTimeout(() => {
      // 如果已中止，直接返回
      if (signal.aborted) {
        console.log('[MockAIAdapter] Aborted before starting stream');
        handleAbort();
        return;
      }

      console.log('[MockAIAdapter] Starting stream, interval:', this.CHUNK_INTERVAL);
      // 开始流式吐字
      streamInterval = setInterval(() => {
        // 如果已中止，清除定时器并返回
        if (signal.aborted) {
          if (streamInterval) {
            clearInterval(streamInterval);
            streamInterval = null;
          }
          return;
        }

        // 计算剩余字符
        const remaining = this.corpus.length - currentIndex;
        if (remaining <= 0) {
          if (streamInterval) {
            clearInterval(streamInterval);
            streamInterval = null;
          }
          onDone();
          return;
        }

        // 随机截取 2-5 个字符
        const chunkSize = Math.min(
          Math.floor(Math.random() * (this.CHUNK_SIZE_MAX - this.CHUNK_SIZE_MIN + 1)) + this.CHUNK_SIZE_MIN,
          remaining
        );
        
        const chunk = this.corpus.slice(currentIndex, currentIndex + chunkSize);
        currentIndex += chunkSize;

        onChunk(chunk);
      }, this.CHUNK_INTERVAL);

    }, this.TTFT_DELAY);

    return controller;
  }
}
