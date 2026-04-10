# AI Chat React - 全栈 AI 聊天应用

> 基于 Next.js 16 + TypeScript 的 AI Agent 应用，包含 Canvas 图形学、Web Worker 性能优化、Docker + Nginx 生产部署

---

## 📌 项目定位

- **定位**: 高级全栈项目
- **方向**: 偏大前端、AI Agent 方向
- **核心原则**:
  > **UI 层完全同步 Vercel AI Chatbot 模板，保留现有逻辑层/数据层及技术亮点**

---

## 🎯 为什么不直接用 Vercel 模板？

| Vercel 模板 | 本项目 | 面试价值 |
|-------------|--------|----------|
| `useChat` hook (高度封装) | 手写 SSE 解析器 | ✅ 展示底层实现 |
| React Context | Zustand + localStorage | ✅ 展示状态管理模式 |
| 无 Web Worker | markdownWorker.ts | ✅ 展示多线程优化 |
| 无 Canvas | AIAuraVisualizer.tsx | ✅ 展示图形学能力 |
| 无双缓冲队列 | useChatStream.ts | ✅ 展示性能优化 |

---

## 🏗️ 分层架构（核心设计）

```
┌─────────────────────────────────────────┐
│           UI Layer (同步 Vercel)         │
│  - Vercel AI Chatbot UI 组件样式         │
│  - shadcn/ui 基础组件                    │
└─────────────────────────────────────────┘
              ↓ Props/Events
┌─────────────────────────────────────────┐
│       Logic Layer (保留)                 │
│  - Zustand Store 数据绑定                │
│  - useChatStream SSE 流式解析            │
│  - 双缓冲队列性能优化                    │
└─────────────────────────────────────────┘
              ↓ Data Flow
┌─────────────────────────────────────────┐
│       Data Layer (保留)                  │
│  - message.ts 消息类型                   │
│  - Supabase 数据持久化                   │
│  - localStorage 会话缓存                 │
└─────────────────────────────────────────┘
```

---

## 🛠️ 技术栈

| 类别 | 技术 | 状态 |
|------|------|------|
| 框架 | Next.js 16, React 19 | ✅ |
| 语言 | TypeScript | ✅ |
| 样式 | Tailwind CSS v4 | ✅ |
| UI组件 | shadcn/ui (16 组件) | ✅ |
| 状态 | Zustand + localStorage | ✅ **核心亮点** |
| AI SDK | Vercel AI SDK | ✅ |
| 流式 | SSE (手写解析) | ✅ **核心亮点** |
| 性能 | 双缓冲队列 + RAF | ✅ **核心亮点** |
| Worker | Web Worker (Markdown解析) | ✅ **核心亮点** |
| 图形 | Canvas 2D API | ✅ **核心亮点** |
| 认证 | Supabase Auth (GitHub OAuth) | ✅ |
| 数据库 | Supabase PostgreSQL | ✅ |
| 部署 | Docker + Nginx | ✅ |
| AI Provider | 阿里云百炼 Coding Plan | ✅ 已集成 |

---

## ✨ 核心亮点（面试重点）

### 1. 性能优化「三板斧」

| 技术 | 解决的问题 | 面试话术 |
|------|------------|----------|
| **Web Worker** | Markdown 解析阻塞 UI | "将耗时操作卸载到 Worker，避免卡顿" |
| **双缓冲队列** | 高频 DOM 更新 | "写缓冲+读缓冲+RAF 批量，100字符→2-3次渲染" |
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

### 3. SSE 流式解析（手写实现）

```typescript
// useChatStream.ts - 核心代码
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      doubleBufferQueue.write(messageId, data);
    }
  }
}
```

### 4. Zustand 状态管理

```typescript
// src/store/chatStore.ts
export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      updateMessage: (id, content) => 
        set((s) => ({
          messages: s.messages.map(m => 
            m.id === id ? { ...m, content } : m
          )
        }))
    }),
    { name: 'chat-messages' }
  )
);
```

---

## 📊 开发进度总览

```
Phase 0 (基础 UI 重构):  ██████████ 100% ✅
Phase 1 (UI 全面同步):   ██████████ 100% ✅ 百炼 API 已跑通
Phase 2 (Agent 核心):     ░░░░░░░░░░   0%
Phase 3 (工程化):         ░░░░░░░░░░   0%
```

---

## 🚀 开发计划

### ✅ Phase 0: 已完成

| 任务 | 状态 |
|------|------|
| Next.js 16 + React 19 项目初始化 | ✅ |
| Docker 多阶段构建 + Nginx 反向代理 | ✅ |
| Supabase Auth GitHub OAuth | ✅ |
| Supabase 数据持久化 + 会话云端同步 | ✅ |
| DeepSeek API + SSE 流式对话 | ✅ |
| Canvas 粒子系统可视化 | ✅ |
| Web Worker Markdown 解析 | ✅ |
| 双缓冲队列性能优化 | ✅ |
| shadcn/ui 安装（16 组件） | ✅ |
| AppSidebar 重构 | ✅ |
| SidebarToggle 创建 | ✅ |
| Sidebar 折叠修复 | ✅ |
| Greeting 欢迎界面 | ✅ |
| MultimodalInput 输入区 | ✅ |
| Messages/Message 组件 | ✅ |
| ArtifactPanel 面板 | ✅ |
| 旧组件清理（7 文件删除） | ✅ |

---

### 🔴 Phase 1: UI 全面同步 Vercel AI Chatbot（当前阶段）

#### Step 1: 路由结构同步 ✅ 完成
- [x] 创建 `(chat)` 路由组
- [x] 移动 `SidebarProvider` 到 `(chat)/layout.tsx`
- [x] 创建 `[id]` 动态路由（历史对话按 ID）
- [x] Bug 修复：路由导航 + switchSession

#### Step 2: 消息组件完善 ✅ 完成
- [x] 同步 Vercel `message.tsx` UI 样式
- [x] 添加消息操作按钮（复制、编辑、重新生成）
- [x] 流式渲染动画（已实现：双缓冲队列 + Web Worker）

#### Step 3: 工具调用 UI ✅ 完成
- [x] 创建 `ToolResult.tsx` 组件
- [x] 完善 `Message.tsx` 的 tool-call 渲染
- [x] 添加工具执行状态动画（pending/running/completed/error）

#### Step 4: Model Selector 联动 + 百炼集成 ✅ 完成
- [x] 连接 ModelSelector 到 `useChatStream`
- [x] 传递 `selectedModel` 到 API endpoint
- [x] **替换 DeepSeek → 阿里云百炼 Coding Plan**
- [x] 使用 OpenAI SDK 直接调用（非 @ai-sdk/openai）
- [x] 配置 Coding Plan 专属端点 `coding.dashscope.aliyuncs.com/v1`
- [x] 支持 6 个模型（glm-5/qwen-plus/qwen-max/qwen-coder-plus/deepseek-r1/deepseek-v3）
- [x] 数据流：ModelSelector → chatStore → API → 百炼

#### Step 5: Artifact Panel 完善 + Sidebar 未登录优化 ✅ 完成
- [x] 完善 Artifact Panel 交互
- [x] Sidebar 未登录状态优化（临时会话提示、历史隐藏）
- [x] 未登录用户会话机制（不持久化到 localStorage）
- [x] 响应式布局优化（Sidebar 默认折叠）
- [x] 重新生成消息重复问题修复
- [x] 数据库清空后本地同步修复
- [x] AI 消息状态同步修复
- [ ] 添加代码复制功能
- [ ] 添加文件类型标签

---

### 🟡 Phase 2: Agent 核心功能

- [ ] 工具调用 API 层完善（Vercel AI SDK Tools）
- [ ] 文件上传（图片/PDF 多模态）
- [ ] 知识库基础（文档上传 + 关键词检索，先不做向量）

---

### 🟢 Phase 3: 数据层重构 + RAG

- [ ] RDS PostgreSQL 替换 Supabase
- [ ] pgvector 向量扩展
- [ ] **RAG 实现（LangChain + pgvector）**
  - 文档向量化（Embedding）
  - 向量检索（Similarity Search）
  - 百炼 LLM + RAG 生成
- [ ] CI/CD 流水线（GitHub Actions）
- [ ] 监控 & 日志

**RAG 方案**: 文档 → Embedding → pgvector → LangChain Retriever → 百炼 LLM

---

## 🎨 UI 组件对照表

### 已同步组件 ✅

| Vercel 组件 | 本项目组件 | 状态 |
|-------------|------------|------|
| `app-sidebar.tsx` | `AppSidebar.tsx` | ✅ 完成 |
| `sidebar-toggle.tsx` | `SidebarToggle.tsx` | ✅ 完成 |
| `chat-header.tsx` | `ChatHeader.tsx` | ✅ 完成 |
| `greeting.tsx` | `Greeting.tsx` | ✅ 完成 |
| `messages.tsx` | `Messages.tsx` | ✅ 完成 |
| `message.tsx` | `Message.tsx` | ✅ 完成 |
| `input.tsx` | `MultimodalInput.tsx` | ✅ 完成 |
| `tool-result.tsx` | `ToolResult.tsx` | ✅ **新建** |

### 需完善组件 🔄

| Vercel 组件 | 本项目组件 | 待办 |
|-------------|------------|------|
| `model-selector.tsx` | `ModelSelector.tsx` | API 联动 |
| `artifact.tsx` | `ArtifactPanel.tsx` | 交互完善 |

### 需新增组件 ❌

| Vercel 组件 | 作用 | 优先级 |
|-------------|------|--------|
| `suggested-actions.tsx` | 快捷提问按钮 | 🟡 中 |

---

## 📂 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── chat/page.tsx      # 聊天页
│   ├── api/chat/route.ts  # SSE API 路由
│   └── settings/          # 设置页
│
├── components/
│   ├── chat/              # 聊天组件 (新架构)
│   │   ├── ChatContainer.tsx
│   │   ├── Messages.tsx
│   │   ├── Message.tsx
│   │   ├── ToolResult.tsx   # ✅ 新建
│   │   ├── Greeting.tsx
│   │   ├── MultimodalInput.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── ArtifactPanel.tsx
│   │   └── MarkdownRenderer.tsx
│   ├── layout/            # 布局组件
│   │   ├── ChatLayout.tsx
│   │   ├── AppSidebar.tsx
│   │   └── ChatHeader.tsx
│   ├── ui/                # shadcn/ui (16 组件)
│   └── visual/            # Canvas 可视化
│       ├── AIAuraVisualizer.tsx
│       └── ParticleSphere.tsx
│
├── core/types/            # 类型定义
│   └── message.ts         # ChatMessage 类型
│
├── hooks/                 # 自定义 Hooks
│   ├── useChatStream.ts   # SSE + 双缓冲 + OpenAI SDK (核心)
│   ├── useSessionSync.ts  # 会话同步
│   └── useAutoScroll.ts   # 自动滚动
│
├── store/                 # Zustand 状态管理
│   ├── chatStore.ts       # 消息状态
│   ├── sessionStore.ts    # 会话管理
│   ├── aiSettingsStore.ts # 角色/模型设置
│   └── aiStatusStore.ts   # AI 状态机
│
├── workers/               # Web Worker
│   └── markdownWorker.ts  # Markdown 后台解析
│
├── lib/
│   ├── ai-engine.ts       # AI 引擎 (OpenAI SDK + 百炼)
│   └── supabase-server.ts # 数据库/认证
│
└── utils/                 # 工具函数
```

---

## 💻 本地运行

### 开发模式
```bash
npm install
npm run dev
# 访问 http://localhost:3000/chat
```

### Docker 部署
```bash
copy .env.docker .env
docker-compose up --build
# 访问 http://localhost
```

---

## 📚 技术文档

| 文档 | 描述 |
|------|------|
| [01-session-message-flow.md](./docs/01-session-message-flow.md) | 会话与消息架构详解 |
| [02-sse-raf-doublebuffer.md](./docs/02-sse-raf-doublebuffer.md) | SSE/RAF/双缓冲队列详解 |
| [03-agent-development.md](./docs/03-agent-development.md) | Agent 模式开发规划 |
| [04-docker-deployment.md](./docs/04-docker-deployment.md) | Docker 部署指南 |

---

## 🚧 当前阻塞点

1. **百炼 API 测试** - baseUrl 已修复为 `coding.dashscope.aliyuncs.com/v1`，待验证
2. **工具调用未跑通** - `streamAI_WithTools` 存在但 API 层未调用
3. **多模态不支持** - ChatMessage 只有 `content: string`

---

*最后更新: 2026-04-08*