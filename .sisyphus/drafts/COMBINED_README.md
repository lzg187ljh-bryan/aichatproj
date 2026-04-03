# AI Chat React - 全栈 AI 聊天应用

> 基于 Next.js 16 + TypeScript 的 AI 聊天应用，包含 Canvas 图形学、Web Worker 性能优化、Docker + Nginx 生产部署

---

## 📌 项目定位

- **定位**: 中高级前端工程师面试作品
- **目标**: 展示前端架构能力、图形学技能、工程化水平

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router), React 19 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 状态 | Zustand + localStorage |
| 图形 | Canvas 2D API |
| 富文本 | marked + DOMPurify |
| 高亮 | Prism.js (12+ 语言) |
| 构建 | dynamic() 懒加载 |
| 代码质量 | Husky + lint-staged |
| 部署 | Docker + Nginx |
| 认证 | Supabase Auth (GitHub OAuth) |
| 数据库 | Supabase (PostgreSQL BaaS) |
| AI | DeepSeek API + SSE 流式 |

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
| 🔴 高 | **CI/CD 流水线** | 工程化闭环 |
| 🟡 中 | **负载均衡** | 水平扩展（预留） |
| 🟡 中 | **Redis Session** | 多实例共享（预留） |
| 🟡 中 | **WASM** | 前沿加分项 |

---

## 🚀 后续开发计划（已部分完成）

### Phase 1: 容器化基础 ✅ 已完成
- [x] Next.js 多阶段构建 Dockerfile
- [x] Nginx 反向代理配置
- [x] Docker Compose 编排
- [x] Healthcheck 健康检查
- [x] 环境变量配置

### Phase 2: 认证 + 数据持久化 ✅ 已完成
- [x] Supabase Auth GitHub OAuth
- [x] Supabase 数据持久化
- [x] 会话历史云端同步

### Phase 3: AI 对接 ✅ 已完成
- [x] DeepSeek API 集成
- [x] SSE 流式对话

### Phase 4: 进阶部署（预留）
- [ ] SSL/HTTPS 配置（Let's Encrypt）
- [ ] 多实例负载均衡
- [ ] Redis Session 共享
- [ ] CI/CD 流水线

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

*最后更新: 2026-04-03*
