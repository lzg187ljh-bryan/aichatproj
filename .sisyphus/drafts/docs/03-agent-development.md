# AI 功能开发进度与规划

本文档记录 AI 前端开发相关的功能进度和技术决策。

---

## 📋 已完成功能

### 1. 基础聊天系统 (已完成 ✅)
- Next.js + TypeScript + Zustand
- Supabase 数据库 (会话 + 消息)
- SSE 流式响应 (手写实现)
- GitHub OAuth 登录
- 会话切换修复

### 2. 消息类型扩展 (已完成 ✅)
- Message 类型扩展: text, thinking, tool-call, source, code
- 工具调用信息: ToolCall
- 引用来源: Source (RAG)
- 文件: `src/core/types/message.ts`

### 3. Vercel AI SDK 集成 (已完成 ✅)
- 安装: `ai` + `@ai-sdk/deepseek`
- 文件: `src/lib/ai-engine.ts`
- 功能:
  - `streamAI_Text()` - 流式生成
  - `generateAI_Object()` - 结构化输出
  - `streamAI_WithTools()` - 工具调用
- **手动切换**: `DEV_MODE` 变量控制 mock/real (内层)

### 4. 设置页面 (已完成 ✅)
- 路径: `/settings`
- 功能:
  - 查看/切换当前角色
  - 创建自定义角色
  - 编辑/删除自定义角色
  - localStorage 持久化

### 5. 集成到数据流 (已完成 ✅)
- `/api/chat/route.ts` real 模式调用 `streamAI_Text()`
- 两层切换: 外层(`NEXT_PUBLIC_USE_AI`) + 内层(`DEV_MODE`)
- SSE 格式返回流式响应

### 6. UI 改造 (已完成 ✅)
- MessageItem 支持多种消息类型渲染 (text, thinking, tool-call, source, code)
- 侧边栏增加功能入口 (设置/知识库/工具调用)
- 删除独立 /agent 页面，Agent 能力整合到主聊天页

---

## 🔄 当前数据流 (重点在后端)

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  InputArea.tsx (用户输入)                                       │
│         ↓                                                       │
│  useChatStream.sendMessage()                                    │
│         ↓                                                       │
│  fetch('/api/chat', { body: JSON })                            │
│         │                                                       │
│         │ POST 请求                                            │
│         ▼                                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      后端 (/api/chat/route.ts)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 解析请求体: messages, conversationId, newConversationTitle │
│         ↓                                                      │
│  2. 检查 NEXT_PUBLIC_USE_AI 环境变量 (外层)                    │
│         ↓                                                      │
│  ┌──────────────────┴──────────────────┐                      │
│  ↓                                     ↓                        │
│  mock 模式                          real 模式                 │
│  ├─ generateMockResponse()            └─ streamAI_Text()       │
│  │       ↓                                    │               │
│  │  SSE 格式返回                             ↓               │
│  │                               ai-engine.ts                  │
│  │                                    │                       │
│  │                           DEV_MODE 切换 (内层)               │
│  │                          ├─ mock → mockStream()            │
│  │                          └─ real → streamText() (DeepSeek)│
│  │                                    │                       │
│  └───────────────────────────────────┘                       │
│                    ↓                                           │
│  3. 保存消息到数据库 (Supabase)                                 │
│         ↓                                                      │
│  4. SSE 流式响应返回                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 两层切换机制

| 层级 | 变量 | 位置 | 说明 |
|------|------|------|------|
| 外层 | `NEXT_PUBLIC_USE_AI` | `/api/chat/route.ts` | 控制是否调用 ai-engine |
| 内层 | `DEV_MODE` | `ai-engine.ts` | 手动切换 mock/real |

**切换组合**:

| 外层 USE_MOCK | 内层 DEV_MODE | 结果 |
|---------------|---------------|------|
| mock | - | 旧版 mock (不走 ai-engine) |
| real | mock | ai-engine mock |
| real | real | ai-engine real (DeepSeek) |

### 关键文件

| 文件 | 位置 | 职责 |
|------|------|------|
| `useChatStream.ts` | 前端/hooks | 发送请求、解析 SSE、双缓冲队列 |
| `/api/chat/route.ts` | 后端/api | 外层控制 (mock/real), 调用 ai-engine |
| `ai-engine.ts` | 前端/lib | **内层切换**, Vercel AI SDK 封装 |
| `chatStore.ts` | 前端/store | 消息状态管理 |

```
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         前端                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SSE 响应                                                       │
│         ↓                                                      │
│  sendToBackend() 解析 SSE                                      │
│         ↓                                                      │
│  DoubleBufferQueue.write() → 触发 RAF                          │
│         ↓                                                      │
│  RAF 回调 → 批量更新 UI                                        │
│         ↓                                                      │
│  chatStore.appendToMessage()                                   │
│         ↓                                                      │
│  MessageItem 渲染                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⏳ 待完成功能

### 1. RAG 知识库 (待开发)
- 文档上传 (PDF/TXT/MD)
- 向量存储 (pgvector)
- 语义检索
- 答案生成 + 引用显示 (sources)

### 2. 工具调用 (待开发)
- 搜索工具
- 代码执行
- API 调用

---

## 📋 开发路线图

### Phase 1: UI 全面同步（当前 80%）
- [x] Sidebar 完全修复（折叠动画、分组、Toggle）
- [x] Header 布局修复
- [ ] 百炼替换 DeepSeek（解决 401 错误）
- [ ] ModelSelector API 联动
- [ ] ArtifactPanel 完善

### Phase 2: Agent 核心
- [ ] 工具调用跑通（Vercel AI SDK Tools）
- [ ] 文件上传（多模态）
- [ ] 知识库基础（文档上传 + 关键词检索）

### Phase 3: 数据层重构 + RAG
- [ ] RDS PostgreSQL 替换 Supabase
- [ ] pgvector 向量扩展
- [ ] **RAG 实现（LangChain + pgvector）**
  - 文档向量化（Embedding）
  - 向量检索（Similarity Search）
  - 百炼 LLM + RAG 生成

### RAG 技术方案
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   文档上传      │────▶│   Embedding 模型   │────▶│   RDS pgvector  │
│  (PDF/Word/TXT) │     │   文本向量化      │     │   向量存储      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│   用户提问      │────▶│  LangChain        │◀─────────────┘
│                 │     │  VectorStoreRetriever
└─────────────────┘     └──────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  百炼 LLM + RAG  │
                        │  (带上下文生成)   │
                        └──────────────────┘
```

---

*最后更新: 2026-04-07*