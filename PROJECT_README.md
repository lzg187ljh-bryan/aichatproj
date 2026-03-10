# AI Chat React - 产业级全栈 AI 对话应用

> 基于 Next.js 14+ App Router + TypeScript + Zustand + Canvas API 的产业级 AI 聊天应用

## 项目概述

本项目是一个具有产业级标准的 Web 端 AI 聊天应用，包含完整的架构分层、SEO 优化、性能调优，以及 Canvas 图形学技术。

**技术栈：**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Zustand (状态管理)
- marked + DOMPurify (安全富文本)
- 原生 HTML5 Canvas
- Web Worker

---

## 目录结构

```
ai-chat-react/
├── src/
│   ├── core/                           # 核心接口与类型定义
│   │   ├── types/
│   │   │   └── message.ts              # Message 实体类型
│   │   └── interfaces/
│   │       └── IAIProvider.ts         # AI Provider 适配器接口
│   │
│   ├── services/                       # 服务层
│   │   ├── AIProviderFactory.ts       # Provider 工厂
│   │   └── mock/
│   │       └── MockAIAdapter.ts       # Mock 流式服务引擎
│   │
│   ├── store/                          # Zustand 状态管理
│   │   ├── chatStore.ts               # 聊天消息状态
│   │   └── aiStatusStore.ts           # AI 状态机 (idle/thinking/typing)
│   │
│   ├── components/                     # React 组件
│   │   ├── layout/
│   │   │   └── ChatLayout.tsx         # 语义化布局 (<main><article><section>)
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx      # 聊天容器
│   │   │   ├── MessageList.tsx       # 消息列表
│   │   │   ├── MessageItem.tsx       # 单条消息渲染 (集成 Worker)
│   │   │   └── InputArea.tsx         # 自适应高度输入框
│   │   └── visual/
│   │       └── AIAuraVisualizer.tsx  # Canvas AI 光环可视化
│   │
│   ├── workers/                        # Web Worker 线程
│   │   └── markdownWorker.ts          # Markdown 解析/高亮/清洗
│   │
│   ├── hooks/                          # 自定义 Hooks
│   │   ├── useChatStream.ts           # 流式数据 + 双缓冲队列 + RAF 批量更新
│   │   └── useAutoScroll.ts          # 防冲突自动滚动
│   │
│   ├── utils/                          # 工具函数
│   │   └── markdown.ts                # 正则预处理 (补全反引号)
│   │
│   ├── app/                            # Next.js 14+ App Router
│   │   ├── layout.tsx                 # Root Layout
│   │   ├── page.tsx                  # 首页 (重定向到 /chat)
│   │   └── chat/
│   │       └── page.tsx              # 聊天页面 + generateMetadata
│   │
│   └── styles/
│       └── globals.css                 # 全局样式 + Markdown 样式
│
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 核心接口定义

### Message 实体类型

```typescript
// src/core/types/message.ts

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'pending' | 'streaming' | 'done' | 'error';

export interface Message {
  id: string;           // 唯一标识符
  role: MessageRole;   // 消息角色
  content: string;     // 消息内容
  timestamp: number;   // 发送时间戳
  status: MessageStatus; // 消息状态
  error?: string;      // 错误信息
}
```

### IAIProvider 接口

```typescript
// src/core/interfaces/IAIProvider.ts

import type { Message } from '../types/message';

export interface IAIProvider {
  sendMessageStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): AbortController;
}

export interface AIProviderOptions {
  baseURL?: string;
  apiKey?: string;
  model?: string;
  timeout?: number;
}
```

---

## Phase 1: 架构设计与 SEO 基建

### 实现内容

- ✅ 强类型 `Message` 实体定义
- ✅ `IAIProvider` 适配器接口
- ✅ Next.js `generateMetadata` 动态 SEO Meta 标签
- ✅ 语义化 HTML (`<main>`, `<article>`, `<section>`)

### SEO 配置

```typescript
// src/app/chat/page.tsx

export const metadata: Metadata = {
  title: 'AI Chat | Next.js Intelligent Assistant',
  description: 'Experience the future of AI conversation with our advanced chat interface...',
  keywords: ['AI Chat', 'Next.js', 'TypeScript', 'Chatbot', 'Artificial Intelligence'],
  openGraph: {
    title: 'AI Chat - Next.js Intelligent Assistant',
    description: 'Experience the future of AI conversation...',
    type: 'website',
  },
};
```

---

## Phase 2: Canvas 图形学与 AI 状态可视化

### AIAuraVisualizer 组件

使用原生 `<canvas>` API + `requestAnimationFrame` 实现粒子系统动画：

- **idle 状态**: 粒子缓慢漂浮
- **thinking 状态**: 绘制平缓波纹 (紫色光圈)
- **typing 状态**: 根据流速动态改变粒子运动速率

### 关键特性

- ✅ Retina 高分屏支持 (devicePixelRatio)
- ✅ 组件卸载时内存回收 (cancelAnimationFrame)
- ✅ 状态订阅 (idle/thinking/typing)

```typescript
// src/components/visual/AIAuraVisualizer.tsx

export function AIAuraVisualizer() {
  const status = useAIStatusStore((state) => state.status);
  const streamRate = useAIStatusStore((state) => state.streamRate);

  // 根据状态调整动画
  if (status === 'thinking') {
    speedMultiplier = 0.3;
    // 绘制波纹...
  } else if (status === 'typing') {
    speedMultiplier = 1 + streamRate * 0.1;
  }
}
```

---

## Phase 3: Mock 流式服务引擎

### MockAIAdapter 实现

模拟真实 AI 的 TTFT 首字延迟 + 流式吐字 + 网络中断：

| 参数 | 值 | 说明 |
|------|-----|------|
| TTFT_DELAY | 600ms | 首字延迟 |
| CHUNK_INTERVAL | 30ms | 流式间隔 |
| CHUNK_SIZE | 2-5 字符 | 单次吐字数 |

### 核心机制

```typescript
// src/services/mock/MockAIAdapter.ts

export class MockAIAdapter implements IAIProvider {
  sendMessageStream(messages, onChunk, onDone, onError) {
    const controller = new AbortController();
    const { signal } = controller;

    // 1. 模拟 TTFT 首字延迟
    setTimeout(() => {
      if (signal.aborted) return;

      // 2. 模拟流式吐字
      streamInterval = setInterval(() => {
        if (signal.aborted) {
          clearInterval(streamInterval);
          return;
        }
        // 随机截取 2-5 个字符
        const chunk = corpus.slice(currentIndex, currentIndex + chunkSize);
        onChunk(chunk);
      }, CHUNK_INTERVAL);
    }, TTFT_DELAY);

    // 3. 监听 abort 信号
    signal.addEventListener('abort', () => {
      clearInterval(streamInterval);
      onDone();
    });

    return controller;
  }
}
```

---

## Phase 4: 时间切片与渲染层调优

### 双缓冲队列 (Double Buffer Queue)

解决高频流式数据注入导致的页面卡顿问题：

```typescript
// src/hooks/useChatStream.ts

class DoubleBufferQueue {
  private writeBuffer: ChunkBuffer[] = [];
  private readBuffer: ChunkBuffer[] = [];

  // 写入缓冲区 (在 setInterval 回调中调用)
  write(messageId: string, chunk: string) {
    // 拦截高频 Chunk，写入缓冲区
    this.writeBuffer.push({ messageId, chunks: [chunk] });
    
    // 启动 RAF 对接渲染帧
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.flush.bind(this));
    }
  }

  // 刷新缓冲区 (对接到浏览器渲染帧)
  private flush() {
    // 交换读写缓冲区
    [this.writeBuffer, this.readBuffer] = [this.readBuffer, this.writeBuffer];
    
    // 批量状态更新
    for (const buffer of this.readBuffer) {
      const content = buffer.chunks.join('');
      this.callback(buffer.messageId, content);
    }
  }
}
```

### 自适应高度输入框

- ✅ 最小高度 44px，最大高度 200px
- ✅ Enter 发送，Shift+Enter 换行
- ✅ ESC 取消流式响应

---

## Phase 5: AST 解析与 Web Worker 线程卸载

### markdownWorker

将耗时的计算全部卸载到 Web Worker：

1. **marked** 解析 Markdown → HTML
2. **正则语法高亮** 代码块
3. **DOMPurify.sanitize** 安全清洗

```typescript
// src/workers/markdownWorker.ts

self.onmessage = function(e: MessageEvent<ParseRequest>) {
  const { id, markdown } = e.data;
  
  try {
    // 1. 预处理 Markdown (补全不成对反引号)
    const preprocessed = preprocessMarkdown(markdown);
    
    // 2. 解析为 HTML
    const parsed = marked.parse(preprocessed);
    
    // 3. 安全清洗
    const sanitized = DOMPurify.sanitize(parsed);
    
    self.postMessage({ id, html: sanitized });
  } catch (error) {
    self.postMessage({ id, html: '', error: error.message });
  }
};
```

### MessageItem 组件集成

```typescript
// src/components/chat/MessageItem.tsx

useEffect(() => {
  workerRef.current = new Worker(
    new URL('@/workers/markdownWorker.ts', import.meta.url),
    { type: 'module' }
  );

  workerRef.current.onmessage = (e) => {
    setHtml(e.data.html);
  };

  // 发送 Markdown 给 Worker
  workerRef.current.postMessage({ id: message.id, markdown: message.content });
}, [message.content]);
```

---

## 状态管理

### AI 状态机

```typescript
// src/store/aiStatusStore.ts

export type AIStatus = 'idle' | 'thinking' | 'typing';

interface AIStatusState {
  status: AIStatus;
  streamRate: number;  // 流式速率 (chunks per second)
}
```

### 聊天消息状态

```typescript
// src/store/chatStore.ts

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  addMessage: (role, content) => Message;
  appendToMessage: (id, chunk) => void;
  setMessageStatus: (id, status, error?) => void;
}
```

---

## 运行项目

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

访问 http://localhost:3000/chat

---

## 项目亮点

| 亮点 | 实现方案 |
|------|----------|
| **关注点分离** | core → services → store → components → workers |
| **SEO 友好** | generateMetadata + 语义化 HTML |
| **图形学能力** | Canvas 粒子系统 + 波纹动画 |
| **真实模拟** | TTFT + 流式吐字 + AbortController |
| **性能优化** | 双缓冲 + RAF 批量 + Web Worker |
| **状态联动** | AI 状态与 Canvas 动画实时同步 |

---

*Generated with Sisyphus AI Agent*
