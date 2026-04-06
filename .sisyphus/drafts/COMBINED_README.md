# AI Chat React - 全栈 AI 聊天应用

> 基于 Next.js 16 + TypeScript 的 AI Agent 应用，包含 Canvas 图形学、Web Worker 性能优化、Docker + Nginx 生产部署

---

## 📌 项目定位

- **定位**: 高级全栈程序员面试作品项目
- **方向**: 偏大前端、AI Agent 方向
- **目标**: 体现招聘中主流技术点，UI 和功能同步 Vercel AI Chatbot 模板

---

## 🛠️ 技术栈

### 已有技术（保留）

| 类别 | 技术 | 状态 |
|------|------|------|
| 框架 | Next.js 16 (App Router), React 19 | ✅ |
| 语言 | TypeScript | ✅ |
| 样式 | Tailwind CSS v4 | ✅ |
| 状态 | Zustand + localStorage | ✅ |
| AI SDK | Vercel AI SDK | ✅ |
| 图形 | Canvas 2D API | ✅ 核心亮点 |
| Worker | Web Worker (Markdown解析) | ✅ 核心亮点 |
| 性能 | 双缓冲队列 + RAF | ✅ 核心亮点 |
| 流式 | SSE (手写解析) | ✅ 核心亮点 |
| 富文本 | marked + DOMPurify | ✅ |
| 高亮 | Prism.js (12+ 语言) | ✅ |
| 构建 | dynamic() 懒加载 | ✅ |
| 代码质量 | Husky + lint-staged | ✅ |
| 部署 | Docker + Nginx | ✅ |
| 认证 | Supabase Auth (GitHub OAuth) | ✅ |
| 数据库 | Supabase PostgreSQL | ✅ 保留 |

### 待新增/调整技术

| 类别 | 技术 | 优先级 |
|------|------|--------|
| UI组件 | shadcn/ui | 🔴 高 |
| AI Provider | 阿里云百炼 (替换DeepSeek) | 🔴 高 |
| 深色模式 | next-themes | 🔴 高 |
| 文件存储 | 阿里云 OSS (可选) | 🟡 中 |
| ORM | Drizzle ORM (可选) | ⚠️ 后续 |

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

### ❌ 待补充（同步 Vercel AI Chatbot）

| 优先级 | 功能 | 说明 |
|--------|------|------|
| 🔴 高 | **shadcn/ui 集成** | UI 规范化 |
| 🔴 高 | **阿里云百炼集成** | 替换 DeepSeek |
| 🔴 高 | **工具调用 UI** | Agent 核心能力 |
| 🔴 高 | **深色模式完善** | 自动检测 + 手动切换 |
| 🔴 高 | **RAG 知识库** | 文档上传 + 向量检索 |
| 🟡 中 | **文件上传** | 图片/PDF 多模态 |
| 🟡 中 | **对话分享** | 生成分享链接 |
| 🟡 中 | **响应式设计** | 移动端适配 |
| 🟡 中 | **CI/CD 流水线** | GitHub Actions |

---

## 🚀 后续开发计划

### Phase 0: 已完成 ✅
- [x] Next.js 16 + React 19 项目初始化
- [x] Docker 多阶段构建 + Nginx 反向代理
- [x] Supabase Auth GitHub OAuth
- [x] Supabase 数据持久化 + 会话云端同步
- [x] DeepSeek API + SSE 流式对话
- [x] Canvas 粒子系统可视化
- [x] Web Worker Markdown 解析
- [x] 双缓冲队列性能优化
- [x] 角色管理系统

### Phase 1: 技术栈调整（第 1-3 天）🔴
- [x] 安装配置 shadcn/ui
- [x] 替换现有手写组件，统一 UI 规范
- [ ] 集成阿里云百炼（替换 DeepSeek）
- [ ] 修改 ai-engine.ts Provider
- [ ] 完善深色模式（next-themes）

### Phase 2: Agent 核心功能（第 4-10 天）🔴
- [ ] 工具调用 UI 完善
- [ ] 工具执行状态动画
- [ ] RAG 知识库（文档上传 + 向量检索）
- [ ] 文件上传（图片/PDF 多模态）

### Phase 3: UI/UX 完善（第 11-15 天）🟡
- [ ] 对话分享功能
- [ ] 响应式设计（移动端适配）
- [ ] Canvas 性能优化

### Phase 4: 工程化完善（第 16-20 天）🟡
- [ ] CI/CD 流水线（GitHub Actions）
- [ ] 监控 & 日志
- [ ] 阿里云部署（ECS/FC）
- [ ] HTTPS 配置

---

## 💻 本地运行

### 开发模式
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问
http://localhost:3000/chat
```

### Docker 部署（生产模式）
```bash
# 1. 复制环境变量模板
copy .env.docker .env

# 2. 填入真实配置（参考 .env.local）

# 3. 构建并启动
docker-compose up --build

# 4. 访问
http://localhost
```

详细说明见 [04-docker-deployment.md]

---

## 📚 技术文档

详细的技术分析文档见 `docs/` 目录:

| 文档 | 描述 |
|------|------|
| [01-session-message-flow.md](./docs/01-session-message-flow.md) | 会话与消息架构详解 |
| [02-sse-raf-doublebuffer.md](./docs/02-sse-raf-doublebuffer.md) | SSE/RAF/双缓冲队列详解 |
| [03-agent-development.md](./docs/03-agent-development.md) | Agent 模式开发规划 |
| [04-docker-deployment.md](./docs/04-docker-deployment.md) |


---

## 📝 待确认事项

1. **百炼具体模型**: 通义千问-Turbo / Plus / Max？（建议 Turbo 成本低）
2. **RAG 向量库**: Supabase pgvector 还是阿里云向量检索服务？
3. **部署方式**: 阿里云 ECS 还是函数计算 FC？

---

*最后更新: 2026-04-05*
