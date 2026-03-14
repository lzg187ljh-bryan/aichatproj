# Next.js 产业级全栈 AI 对话应用开发计划

**版本**: 3.0 (Phase 1-6 + SSE + WebGL + PWA)  
**项目**: AI Interview Tutor  
**技术栈**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Zustand, Canvas 2D, WebGL, Web Worker, Prism.js, SSE, PWA

---

## 项目概述

本项目是一个具有产业级标准的 Web 端 AI 聊天应用，从零搭建包含完整架构分层、SEO 优化、极致性能优化、Canvas/WebGL 图形学技术。

**核心目标：**
1. 面试学习工具 — 帮助系统化学习前端/全栈开发面试知识点
2. 作品集展示 — 展示产业级前端架构能力、图形学技能、工程化水平

---

## Phase 1: 架构设计与 SEO 基建

**目标**: 建立健壮的接口契约与搜索引擎友好的基底

### 任务 1: 强类型定义
- ✅ 定义 `Message` 实体 (id, role, content, timestamp, status)
- ✅ 定义 `IAIProvider` 适配器接口
- ✅ 接口需包含 `sendMessageStream(messages, onChunk, onDone, onError): AbortController`

### 任务 2: Next.js SEO 配置
- ✅ 利用 `generateMetadata` API 设计动态 SEO Meta 标签
- ✅ 页面使用语义化 HTML (`<main>`, `<article>`, `<section>`)
- ✅ 配置 manifest.json 支持 PWA

---

## Phase 2: Canvas 图形学与 AI 状态可视化

**目标**: 展现图形学编程能力，打破传统表单式 UI

### 任务 1: AIAuraVisualizer 组件 (Canvas 2D)
- ✅ 开发 AI 光环可视化组件
- ✅ 使用原生 `<canvas>` API + `requestAnimationFrame`
- ✅ 状态联动: idle / thinking / typing 三态动画

### 任务 2: 粒子系统与交互
- ✅ 粒子连接线网络 (知识图谱效果)
- ✅ 鼠标交互效果 (粒子被推开)
- ✅ 多层波纹动画 (thinking 状态)
- ✅ Retina 高分屏适配 (devicePixelRatio)
- ✅ 组件卸载时内存回收 (cancelAnimationFrame)

### 任务 3: WebGL 知识图谱 (新增)
- ✅ 开发 KnowledgeGraphVisualizer 组件
- ✅ 原生 WebGL 实现 (顶点/片段着色器)
- ✅ GPU 加速粒子渲染
- ✅ 与 Canvas 2D AIAuraVisualizer 共存

---

## Phase 3: Mock 流式服务引擎 + SSE

**目标**: 打造逼真的本地流式生成器 + 支持真实 AI API 对接

### 任务 1: MockAIAdapter 类
- ✅ 实现 `IAIProvider` 接口
- ✅ 内置复杂 Markdown 语料 (多级标题，长段落、表格、代码块)

### 任务 2: 核心机制
- ✅ 模拟 TTFT (首字延迟): 调用后延迟 600ms，触发状态切换
- ✅ 模拟流式吐字: 每 30ms 截取 2-5 个字符，通过 onChunk 回调推送
- ✅ 模拟网络中断: 完美集成 AbortController，abort 时立即清除定时器

### 任务 3: SSE 流式适配器 (新增)
- ✅ SSEAIAdapter: 使用 fetch + ReadableStream 实现流式读取
- ✅ SimpleSSEAdapter: 使用 EventSource 简化实现
- ✅ `/api/chat` API Route: 演示 SSE 服务器端实现

---

## Phase 4: 时间切片与渲染层调优

**目标**: 解决高频流式数据注入导致的页面卡顿和 CLS 问题

### 任务 1: 双缓冲队列
- ✅ 实现 Double Buffer Queue 类
- ✅ 利用 `requestAnimationFrame` 将多次 chunk 拦截并批量更新
- ✅ 严禁在底层回调中直接高频触发 setState

### 任务 2: 虚拟列表
- ✅ 渲染长聊天记录的虚拟列表概念

### 任务 3: 容器平滑过渡
- ✅ 外层容器设定最小高度与平滑过渡
- ✅ 应对 AI 吐字时的容器撑开抖动

---

## Phase 5: Web Worker 线程卸载

**目标**: 突破 JS 单线程瓶颈，确保巨量 Markdown 解析不引起 UI 掉帧

### 任务 1: markdownWorker
- ✅ 将 marked AST 解析剥离到 Web Worker
- ✅ 代码块正则语法高亮
- ✅ DOMPurify.sanitize 安全清洗 (主线程执行)
- ✅ 修复 useEffect 依赖，防止 Worker 频繁重建导致流式数据丢失

### 任务 2: 动态导入
- ✅ 主线程 UI 组件只负责拼接 Markdown 字符串
- ✅ 使用 `postMessage` 与 Worker 通信
- ✅ 处理组件卸载时的 Worker 销毁 (terminate)

### 任务 3: 代码块增强
- ✅ 正则预处理器 (补全不成对反引号)
- ✅ 支持动态高度的输入框 (Textarea)
- ✅ 一键复制代码按钮
- ✅ Prism.js 语法高亮 (12+ 语言)

---

## Phase 6: 生产级工程化与性能优化

**目标**: 极限压缩首屏 JS Bundle，建立代码质量防线

### 任务 1: RSC 架构细化
- ✅ 严格界定 Server Components 与 Client Components
- ✅ Layout、全局 Header、侧边栏框架必须作为 Server Components (默认)
- ✅ 只有真正需要交互的区域 (ChatInput、MessageList) 使用 `'use client'`

### 任务 2: Suspense 流式渲染
- ✅ 使用 `<Suspense fallback={<Skeleton />}>` 包裹异步组件
- ✅ 静态框架先瞬间展现，内容随后流式填入

### 任务 3: Code Splitting
- ✅ 绝对禁止在文件顶部静态 import 富文本库
- ✅ 使用 `dynamic()` 懒加载: `const MarkdownRenderer = dynamic(() => import('@/components/...'))`
- ✅ 确保只有 AI 输出内容时才下载 marked、prism、dompurify

### 任务 4: 字体优化
- ✅ 使用 `next/font/google` 预加载主题字体
- ✅ 防止 FOUT/FOIT (字体闪烁与布局偏移)

### 任务 5: DevOps 质量防线
- ✅ 配置 Husky + lint-staged
- ✅ 每次 git commit 触发 pre-commit 阶段
- ✅ 强制执行 ESLint 检查 + Prettier 格式化

### 任务 6: PWA 渐进式增强 (新增)
- ✅ 配置 @ducanh2912/next-pwa
- ✅ Service Worker 自动注册
- ✅ manifest.json 配置 (名称、图标、主题色)
- ✅ 离线缓存 App Shell

---

## 项目目录结构

```
src/
├── app/                         # Next.js App Router
│   ├── chat/page.tsx           # 聊天页面 (RSC + ErrorBoundary)
│   ├── api/chat/route.ts       # SSE API 路由
│   ├── layout.tsx              # Root Layout (Server)
│   └── globals.css
│
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageItem.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   └── InputArea.tsx
│   ├── layout/
│   │   ├── ChatLayout.tsx      # Server Component
│   │   ├── ChatLayoutClient.tsx
│   │   └── Sidebar.tsx
│   ├── visual/
│   │   ├── AIAuraVisualizer.tsx    # Canvas 2D
│   │   └── KnowledgeGraphVisualizer.tsx # WebGL
│   └── ui/
│       ├── ErrorBoundary.tsx
│       ├── ChatSkeleton.tsx
│       └── SidebarSkeleton.tsx
│
├── core/
│   ├── interfaces/IAIProvider.ts
│   └── types/message.ts
│
├── services/
│   ├── AIProviderFactory.ts
│   ├── mock/MockAIAdapter.ts
│   └── sse/SSEAIAdapter.ts
│
├── store/
│   ├── chatStore.ts
│   ├── aiStatusStore.ts
│   ├── sessionStore.ts
│   └── bookmarkStore.ts
│
├── hooks/
│   ├── useChatStream.ts
│   ├── useAutoScroll.ts
│   └── useSessionSync.ts
│
├── workers/
│   └── markdownWorker.ts
│
└── utils/
    └── markdown.ts
```

---

## 关键接口契约

### IAIProvider

```typescript
interface IAIProvider {
  sendMessageStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): AbortController;
}
```

### Message

```typescript
type MessageRole = 'user' | 'assistant' | 'system';
type MessageStatus = 'pending' | 'streaming' | 'done' | 'error';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status: MessageStatus;
  error?: string;
}
```

---

## SSE 实现示例

### 客户端适配器

```typescript
// src/services/sse/SSEAIAdapter.ts
export class SSEAIAdapter implements IAIProvider {
  sendMessageStream(messages, onChunk, onDone, onError) {
    const controller = new AbortController();
    
    fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    })
      .then(response => {
        const reader = response.body.getReader();
        // 使用 ReadableStream 读取流数据
        // 解析 SSE 格式: data: { "content": "..." }\n\n
      });
    
    return controller;
  }
}
```

### 服务端 API Route

```typescript
// src/app/api/chat/route.ts
export async function POST(request) {
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of aiResponse) {
        const data = JSON.stringify({ content: chunk });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        await sleep(30);
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

---

## WebGL 实现概述

### 顶点着色器

```glsl
attribute vec2 a_position;
attribute float a_size;
attribute vec3 a_color;
attribute float a_alpha;

uniform vec2 u_resolution;
uniform float u_time;

void main() {
  vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  gl_PointSize = a_size * (1.0 + 0.2 * sin(u_time * 2.0));
}
```

### 片段着色器

```glsl
precision mediump float;
varying vec3 v_color;
varying float v_alpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  float alpha = v_alpha * (1.0 - smoothstep(0.3, 0.5, dist));
  gl_FragColor = vec4(v_color, alpha);
}
```

---

## 性能目标

| 指标 | 目标值 |
|------|--------|
| First Load JS | < 150KB |
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| FPS | 60fps |

---

## 项目亮点总结

| 亮点 | 实现方案 |
|------|----------|
| **关注点分离** | core → services → store → components → workers |
| **SEO 友好** | generateMetadata + 语义化 HTML |
| **Canvas 2D** | 粒子系统 + 连接线网络 + 波纹动画 + 鼠标交互 |
| **WebGL** | 知识图谱可视化 + GPU 加速粒子渲染 |
| **SSE 流式** | Server-Sent Events 对接真实 AI API |
| **性能优化** | 双缓冲 + RAF 批量 + Web Worker |
| **RSC 架构** | Server/Client 组件分离 + Suspense 流式渲染 |
| **代码分割** | dynamic() 懒加载 marked/prism/dompurify |
| **状态联动** | AI 状态与 Canvas 动画实时同步 |
| **会话管理** | localStorage 持久化 + CRUD 操作 |
| **代码高亮** | Prism.js 12+ 语言 + 一键复制 |
| **错误处理** | Error Boundary + 友好提示 |
| **字体优化** | next/font/google 预加载 |
| **PWA** | 离线缓存 + 可安装 + Service Worker |
| **DevOps** | Husky + lint-staged Git Hooks |

---

*Generated for AI Agent - 2026-03-15*
