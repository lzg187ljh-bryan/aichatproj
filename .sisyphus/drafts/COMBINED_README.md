# AI Chat React - 全栈 AI 聊天应用

> 基于 Next.js 14 + TypeScript 的 AI 聊天应用，包含 Canvas 图形学、Web Worker 性能优化、Zustand 状态管理

---

## 📌 项目定位

- **定位**: 中高级前端工程师面试作品
- **目标**: 展示前端架构能力、图形学技能、工程化水平

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14+ (App Router), React 19 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 状态 | Zustand + localStorage |
| 图形 | Canvas 2D API, WebGL |
| 富文本 | marked + DOMPurify |
| 高亮 | Prism.js (12+ 语言) |
| 构建 | dynamic() 懒加载 |
| 代码质量 | Husky + lint-staged |

---

## 📂 项目架构

```
src/
├── app/                    # Next.js App Router
│   ├── chat/page.tsx      # 聊天页 (RSC + SEO)
│   └── api/chat/route.ts   # SSE API 路由
│
├── components/
│   ├── chat/              # 聊天组件
│   ├── layout/            # 布局 (Server/Client 分离)
│   ├── visual/            # Canvas 可视化
│   └── ui/                # 通用组件
│
├── core/                  # 类型 + 接口
├── services/              # AI 适配器 (Mock/SSE)
├── store/                 # Zustand 状态管理
├── hooks/                 # 自定义 Hooks
├── workers/               # Web Worker
└── utils/                 # 工具函数
```

---

## ✨ 核心亮点（面试重点）

### 1. 性能优化「三板斧」

| 技术 | 解决的问题 | 面试话术 |
|------|------------|----------|
| **Web Worker** | Markdown 解析阻塞 UI | "将耗时操作卸载到 Worker，避免卡顿" |
| **双缓冲队列** | 高频 DOM 更新 | "写缓冲+读缓冲+RAF 批量，将 30ms 操作降频到 16ms" |
| **dynamic()** | 首屏 Bundle 过大 | "marked/prism 仅在 AI 输出时加载" |

### 2. Canvas 图形学

```
AIAuraVisualizer 实现:
├── 粒子系统 (80个粒子)
├── 粒子连线网络 (知识图谱效果)
├── 鼠标交互 (粒子被推开)
├── 状态响应 (idle/thinking/typing)
├── 波纹动画 (多层扩散)
└── 内存回收 (cancelAnimationFrame)
```

### 3. 状态管理设计

```
Zustand Store:
├── chatStore       - 消息列表 CRUD
├── aiStatusStore   - AI 状态机
├── sessionStore    - 会话管理 (localStorage)
└── bookmarkStore   - 收藏功能
```

### 4. RSC 架构

```typescript
// Server Component: HTML 渲染
ChatLayout.tsx → <Suspense><Sidebar /></Suspense>

// Client Component: 交互逻辑
ChatLayoutClient.tsx → 侧边栏展开/收起

// 动态导入
const MarkdownRenderer = dynamic(() => import('./MarkdownRenderer'), {
  ssr: false,
  loading: () => <Skeleton />
})
```

---

## 🔧 关键代码

### 双缓冲队列

```typescript
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
    [this.writeBuffer, this.readBuffer] = [this.readBuffer, this.writeBuffer];
    for (const buffer of this.readBuffer) {
      this.callback(buffer.messageId, buffer.chunks.join(''));
    }
    this.rafId = this.writeBuffer.length > 0 
      ? requestAnimationFrame(this.flush.bind(this)) 
      : null;
  }
}
```

### SSE 流式 API

```typescript
// src/app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of aiResponse) {
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        await sleep(30);
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  });
}
```

---

## 📊 项目覆盖的知识点

### ✅ 已实现

| 层级 | 知识点 |
|------|--------|
| 基础 | TypeScript 类型、React Hooks、组件化 |
| 进阶 | 性能优化、Web Worker、Canvas 图形学 |
| 高级 | RSC、状态机、RAF 动画、性能调优 |
| 工程化 | Husky、lint-staged、Code Splitting |

### ❌ 待补充

| 优先级 | 技术 | 价值 |
|--------|------|------|
| 🔴 高 | **CI/CD + Docker** | DevOps 能力 |
| 🔴 高 | **SSE + Vercel AI SDK** | 真实 AI 对接 |
| 🔴 高 | **WASM** | 前沿加分项 |
| 🟡 中 | **NextAuth.js** | 全栈认证 |
| 🟡 中 | **Prisma + PostgreSQL** | 全栈数据层 |

---

## 🚀 后续开发计划（全栈升级）

### Phase 1: 用户认证
- NextAuth.js 第三方登录
- Session 管理

### Phase 2: 数据持久化
- Prisma + PostgreSQL
- 会话历史云端同步

### Phase 3: AI 对接
- Vercel AI SDK 多模型支持
- SSE 流式对话

### Phase 4: 工程化闭环
- Docker 容器化
- CI/CD 流水线
- Lighthouse 性能报告

---

## 💻 本地运行

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

## 📝 面试自我介绍模板

> "我最近在做一个 AI 对话应用，使用 Next.js 14 + TypeScript 开发。
> 
> **性能优化**：我将 Markdown 解析卸载到 Web Worker，用双缓冲队列 + RAF 批量更新处理 AI 流式输出，将 DOM 操作从每 30ms 降频到每 16ms。
> 
> **图形学**：我实现了一个粒子系统可视化 AI 状态，包含粒子连线网络和鼠标交互效果，深入理解了 requestAnimationFrame 动画循环。
> 
> **状态管理**：使用 Zustand 实现会话管理和收藏功能，状态变更自动触发 Canvas 动画联动。
> 
> **后续计划**：升级为全栈架构，接入 Vercel AI SDK 实现真实 AI 对话，添加 CI/CD 流水线。"

---

*最后更新: 2026-03-19*
