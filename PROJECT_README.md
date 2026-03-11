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
- Prism.js (语法高亮)

---

## 目录结构

```
ai-chat-react/
├── src/
│   ├── core/                           # 核心接口与类型定义
│   │   ├── types/
│   │   │   └── message.ts              # Message 实体类型
│   │   └── interfaces/
│   │       └── IAIProvider.ts          # AI Provider 适配器接口
│   │
│   ├── services/                       # 服务层
│   │   ├── AIProviderFactory.ts        # Provider 工厂
│   │   └── mock/
│   │       └── MockAIAdapter.ts        # Mock 流式服务引擎
│   │
│   ├── store/                          # Zustand 状态管理
│   │   ├── chatStore.ts               # 聊天消息状态
│   │   ├── aiStatusStore.ts           # AI 状态机 (idle/thinking/typing)
│   │   ├── sessionStore.ts            # 会话管理 (localStorage 持久化)
│   │   └── bookmarkStore.ts           # 收藏夹 (localStorage 持久化)
│   │
│   ├── components/                     # React 组件
│   │   ├── layout/
│   │   │   ├── ChatLayout.tsx         # 语义化布局 + 侧边栏集成
│   │   │   └── Sidebar.tsx            # 会话列表侧边栏
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx      # 聊天容器
│   │   │   ├── MessageList.tsx       # 消息列表
│   │   │   ├── MessageItem.tsx       # 单条消息渲染 (Worker + Prism 高亮 + 收藏)
│   │   │   └── InputArea.tsx         # 自适应高度输入框
│   │   ├── visual/
│   │   │   └── AIAuraVisualizer.tsx  # Canvas AI 光环可视化 (增强版)
│   │   └── ui/
│   │       └── ErrorBoundary.tsx      # React 错误边界
│   │
│   ├── workers/                        # Web Worker 线程
│   │   └── markdownWorker.ts          # Markdown 解析 + 代码块增强
│   │
│   ├── hooks/                          # 自定义 Hooks
│   │   ├── useChatStream.ts           # 流式数据 + 双缓冲队列 + RAF 批量更新
│   │   ├── useAutoScroll.ts          # 防冲突自动滚动
│   │   └── useSessionSync.ts         # 会话消息同步
│   │
│   ├── utils/                          # 工具函数
│   │   └── markdown.ts                # 正则预处理 (补全反引号)
│   │
│   ├── app/                            # Next.js 14+ App Router
│   │   ├── layout.tsx                 # Root Layout
│   │   ├── page.tsx                   # 首页 (重定向到 /chat)
│   │   ├── chat/
│   │   │   └── page.tsx               # 聊天页面 + generateMetadata + ErrorBoundary
│   │   └── globals.css                # 全局样式 + Markdown + Prism 主题
│   │
│   └── store/                         # (已在上方列出)
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

### AIAuraVisualizer 组件 (增强版)

使用原生 `<canvas>` API + `requestAnimationFrame` 实现粒子系统动画：

- **idle 状态**: 粒子缓慢漂浮 + 连接线网络
- **thinking 状态**: 绘制多层波纹 (紫色光圈)
- **typing 状态**: 根据流速动态改变粒子运动速率 + 增强发光

### 关键特性

- ✅ Retina 高分屏支持 (devicePixelRatio)
- ✅ 组件卸载时内存回收 (cancelAnimationFrame)
- ✅ 状态订阅 (idle/thinking/typing)
- ✅ 粒子连接线网络 (知识图谱效果)
- ✅ 鼠标交互效果 (粒子被鼠标推开)
- ✅ 多层波纹动画 + 动态发光

```typescript
// src/components/visual/AIAuraVisualizer.tsx

export function AIAuraVisualizer() {
  const status = useAIStatusStore((state) => state.status);
  const streamRate = useAIStatusStore((state) => state.streamRate);

  // 粒子连接线
  const drawConnections = (ctx, particles, maxDistance) => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDistance) {
          // 绘制连线...
        }
      }
    }
  };

  // 鼠标交互
  const handleMouseMove = (e) => {
    // 粒子被鼠标推开的效果
  };
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

  write(messageId: string, chunk: string) {
    this.writeBuffer.push({ messageId, chunks: [chunk] });
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

    for (const buffer of pendingData) {
      const content = buffer.chunks.join('');
      this.callback(buffer.messageId, content);
    }

    if (this.writeBuffer.length > 0) {
      this.rafId = requestAnimationFrame(this.flush.bind(this));
    } else {
      this.rafId = null;
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

### markdownWorker (增强版)

将耗时的计算全部卸载到 Web Worker：

1. **marked** 解析 Markdown → HTML
2. **代码块增强** - 添加语言标签 + 复制按钮
3. **DOMPurify.sanitize** 安全清洗 (主线程)

```typescript
// src/workers/markdownWorker.ts

renderer.code = function({ text, lang }) {
  const language = lang || 'plaintext';
  return `<div class="code-block-wrapper" data-language="${language}">
    <div class="code-header">
      <span class="code-language">${language}</span>
      <button class="copy-button" data-code="${encodeURIComponent(text)}">Copy</button>
    </div>
    <pre class="code-pre"><code class="language-${language}">${escaped}</code></pre>
  </div>`;
};
```

---

## 补充功能

### 1. 代码块增强

- ✅ Prism.js 语法高亮 (支持 12+ 语言: JavaScript, TypeScript, JSX, TSX, Python, Go, Rust, SQL, JSON, Bash, CSS, Markdown)
- ✅ 一键复制代码按钮
- ✅ 语言标签显示
- ✅ 自定义暗色主题

### 2. 会话管理

```typescript
// src/store/sessionStore.ts

interface Session {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// localStorage 持久化
export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      createSession: (name?) => { ... },
      deleteSession: (id) => { ... },
      renameSession: (id, name) => { ... },
      switchSession: (id) => { ... },
    }),
    { name: 'ai-chat-sessions' }
  )
);
```

功能：
- ✅ localStorage 持久化存储
- ✅ 侧边栏会话列表
- ✅ 新建/删除/重命名会话
- ✅ 切换会话上下文

### 3. 收藏夹功能

```typescript
// src/store/bookmarkStore.ts

interface Bookmark {
  id: string;
  messageId: string;
  sessionId: string;
  content: string;
  role: Message['role'];
  note?: string;
  tags: string[];
  createdAt: number;
}
```

功能：
- ✅ 收藏重要问答
- ✅ 星标图标 UI
- ✅ localStorage 持久化

### 4. 错误边界

```typescript
// src/components/ui/ErrorBoundary.tsx

export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <button onClick={this.handleRetry}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

功能：
- ✅ React Error Boundary 组件
- ✅ 友好错误提示
- ✅ 一键重试功能

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
  setMessages: (messages: Message[]) => void;
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
| **图形学能力** | Canvas 粒子系统 + 连接线网络 + 波纹动画 + 鼠标交互 |
| **真实模拟** | TTFT + 流式吐字 + AbortController |
| **性能优化** | 双缓冲 + RAF 批量 + Web Worker |
| **状态联动** | AI 状态与 Canvas 动画实时同步 |
| **会话管理** | localStorage 持久化 + CRUD 操作 |
| **代码高亮** | Prism.js 12+ 语言 + 一键复制 |
| **错误处理** | Error Boundary + 友好提示 |

---

*Generated with Sisyphus AI Agent*
