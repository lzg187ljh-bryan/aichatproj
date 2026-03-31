# 会话与消息架构详解

本文档解释项目中会话（Session）和消息（Message）的数据流和架构设计。

## 1. 数据存储分层

项目采用**双层存储**策略：

```
┌─────────────────────────────────────────────────────┐
│                   前端渲染层                         │
│  ┌─────────────────┐    ┌─────────────────────┐   │
│  │   chatStore     │    │   sessionStore      │   │
│  │   (内存)        │    │   (内存+localStorage)│   │
│  └────────┬────────┘    └──────────┬──────────┘   │
└───────────┼─────────────────────────┼──────────────┘
            │                         │
            ▼                         ▼
┌─────────────────────────────────────────────────────┐
│                   数据库层 (Supabase PostgreSQL)     │
│  ┌─────────────────┐    ┌─────────────────────┐   │
│  │  conversations  │    │      messages       │   │
│  │    表           │    │        表           │   │
│  └─────────────────┘    └─────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 1.1 sessionStore（本地持久化）

**位置**: `src/store/sessionStore.ts`

**作用**: 存储所有会话列表和每个会话的消息，用于 localStorage 持久化

**数据结构**:
```typescript
interface Session {
  id: string;           // 会话唯一标识
  name: string;         // 会话名称
  messages: Message[];  // 消息数组
  createdAt: number;    // 创建时间戳
  updatedAt: number;   // 更新时间戳
}
```

**持久化配置**:
```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: 'ai-chat-sessions',  // localStorage 键名
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      sessions: state.sessions,
      currentSessionId: state.currentSessionId,
    }),
  }
)
```

### 1.2 chatStore（内存状态）

**位置**: `src/store/chatStore.ts`

**作用**: 当前会话的消息状态，用于 UI 渲染

**特点**:
- 只存储当前会话的消息
- 不持久化，页面刷新后清空
- 数据来源于 sessionStore 或数据库加载

### 1.3 数据库表结构

**conversations 表**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键，会话唯一标识 |
| user_id | uuid | 关联用户 |
| title | text | 会话标题 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

**messages 表**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| conversation_id | uuid | 关联会话 |
| role | text | 'user' 或 'assistant' |
| content | text | 消息内容 |
| model | text | AI 模型名称 |
| created_at | timestamp | 创建时间 |

## 2. 会话 ID 机制

### 2.1 本地会话 ID

用户创建新会话时，使用本地临时 ID：

```typescript
id: `session_${generateMessageId()}`
// 例如: session_abc123def456
```

特点：
- 以 `session_` 开头
- 仅存在于浏览器内存/localStorage
- 发送消息后，后端会创建真正的数据库会话，并返回 UUID

### 2.2 数据库会话 ID

后端创建会话时，使用数据库生成的 UUID：

```typescript
// 后端创建
const { data, error } = await supabase
  .from('conversations')
  .insert({ user_id: user.id, title })
  .select()
  .single();
// 返回: 550e8400-e29b-41d4-a716-446655440000
```

### 2.3 ID 转换流程

```
用户点击"新建会话"
       │
       ▼
sessionStore.createSession()          [src/store/sessionStore.ts:46]
       │ 创建本地会话，ID = session_xxx
       ▼
Sidebar 显示新会话，用户输入名称    [src/components/layout/Sidebar.tsx:35]
       │
       ▼
用户发送第一条消息
       │
       ▼
useChatStream 检测到 session_ 前缀  [src/hooks/useChatStream.ts:171]
       │ 不传 conversationId，传 newConversationTitle
       ▼
后端 /api/chat 创建数据库会话      [src/app/api/chat/route.ts:171]
       │ 返回 UUID
       ▼
前端更新 sessionStore               [src/hooks/useChatStream.ts:220]
       │ 将 session_xxx 替换为 UUID
       ▼
本地会话 ID 变为数据库 UUID
```

## 3. 消息数据流

### 3.1 发送消息流程

```
用户输入消息，点击发送
       │
       ▼
InputArea 调用 useChatStream.sendMessage()  [src/components/chat/InputArea.tsx]
       │
       ▼
1. 添加用户消息到 chatStore
       │ addMessage('user', content)         [src/store/chatStore.ts:32]
       ▼
2. 添加 AI 消息占位到 chatStore
       │ addMessage('assistant', '')          [src/store/chatStore.ts:32]
       ▼
3. 调用后端 API
       │ fetch('/api/chat', ...)              [src/hooks/useChatStream.ts:82]
       ▼
4. 后端处理
       │ - 保存用户消息到数据库                [src/app/api/chat/route.ts:182]
       │ - 调用 AI 获取响应                   [src/app/api/chat/route.ts:236]
       │ - 流式返回响应                       [src/app/api/chat/route.ts:197]
       ▼
5. 前端接收流式数据
       │ DoubleBufferQueue 缓冲                [src/hooks/useChatStream.ts:20]
       ▼
6. 更新 chatStore 中的 AI 消息
       │ appendToMessage(messageId, chunk)    [src/store/chatStore.ts:54]
       ▼
7. useSessionSync 同步到 sessionStore       [src/hooks/useSessionSync.ts:21]
       │ 只在消息数量增加时同步
```

### 3.2 加载消息流程

```
页面加载 /chat
       │
       ▼
ChatLayoutClient 加载会话              [src/components/layout/ChatLayoutClient.tsx:40]
       │
       ▼
1. 从 sessionStore 获取本地会话
       │ useSessionStore.getState().sessions  [src/store/sessionStore.ts]
       ▼
2. 从数据库加载会话列表
       │ supabase.from('conversations').select(...)  [src/components/layout/ChatLayoutClient.tsx:49]
       ▼
3. 合并会话
       │ 数据库会话 + 本地独有会话（session_ 开头的）  [src/components/layout/ChatLayoutClient.tsx:91]
       ▼
4. 更新 sessionStore
       │ useSessionStore.setState({ sessions: merged, currentSessionId })  [src/components/layout/ChatLayoutClient.tsx:105]
       ▼
5. 根据 currentSessionId 加载消息
       │ sessionStore.sessions.find(s => s.id === currentSessionId)  [src/components/layout/ChatLayoutClient.tsx:142]
       ▼
6. 更新 chatStore
       │ setMessages(currentSession.messages)  [src/store/chatStore.ts:28]
       ▼
MessageList 渲染消息                   [src/components/chat/MessageList.tsx]
```

### 3.3 切换会话流程

```
用户点击侧边栏中的另一个会话
       │
       ▼
Sidebar.handleSelect(sessionId)        [src/components/layout/Sidebar.tsx:67]
       │
       ▼
useSessionStore.switchSession(id)      [src/store/sessionStore.ts:88]
       │ 更新 currentSessionId
       ▼
ChatLayoutClient 的 useEffect 触发    [src/components/layout/ChatLayoutClient.tsx:137]
       │ 监听 currentSessionId 变化
       ▼
从 sessionStore 获取新会话的消息
       │ sessionStore.sessions.find(s => s.id === currentSessionId)  [src/components/layout/ChatLayoutClient.tsx:142]
       ▼
更新 chatStore
       │ setMessages(session.messages)     [src/store/chatStore.ts:28]
       ▼
UI 重新渲染，显示新会话的消息
```

## 4. 关键设计决策

### 4.1 为什么需要两个 Store？

| store | 用途 | 持久化 |
|-------|------|--------|
| chatStore | UI 渲染，只关心当前会话 | 否 |
| sessionStore | 数据持久化，关心所有会话 | localStorage |

**原因**:
- chatStore 更轻量，只包含当前会话消息，渲染效率高
- sessionStore 包含所有会话，用于页面刷新后恢复数据

### 4.2 为什么 useSessionSync 只同步新增消息？

```typescript
// 只有消息数量增加时才同步（用户发送消息）  [src/hooks/useSessionSync.ts:44]
if (chatMessages.length > prevMessagesLengthRef.current) {
  // 同步新增和更新的消息
}
```

**原因**:
- 切换会话时，chatStore 会被完全替换（setMessages）
- 如果同步，会把旧会话的消息错误地添加到新会话
- 只有用户主动发送消息时才需要同步到 sessionStore

### 4.3 为什么区分本地会话和数据库会话？

**场景**:
1. 用户点击"新建会话"，创建了本地会话（session_xxx）
2. 用户还没发送消息，刷新页面
3. 从数据库加载会话时，这个本地会话不应该被丢弃

**解决方案**:
```typescript
// 区分本地会话和数据库会话                      [src/components/layout/ChatLayoutClient.tsx:62]
const dbSessionIds = new Set(conversations?.map((c) => c.id) || []);
const localOnlySessions = localSessions.filter(s => !dbSessionIds.has(s.id));

// 合并                                           [src/components/layout/ChatLayoutClient.tsx:93]
const mergedSessions = [...dbSessions, ...localOnlySessions];
```

## 5. 常见问题排查

### 5.1 消息显示错乱

**症状**: 切换会话后，显示的是另一个会话的消息

**排查方向**:
1. 检查 useSessionSync 是否错误地在切换会话时同步消息
2. 检查 ChatLayoutClient 的 useEffect 是否正确监听 currentSessionId
3. 确认 sessionStore 中的 messages 和 chatStore 中的 messages 是否一致

### 5.2 创建会话后消息保存到错误会话

**症状**: 创建了新会话 "wc2"，但消息保存到了 "wc1"

**排查方向**:
1. 检查 createSession 后 currentSessionId 是否正确设置
2. 检查发送消息时 conversationId 是否正确传递
3. 检查后端 API 是否正确使用 newConversationTitle

### 5.3 刷新页面后会话丢失

**症状**: 刷新页面后，会话列表为空或会话消息丢失

**排查方向**:
1. 检查 localStorage 中是否有 'ai-chat-sessions' 数据
2. 检查 sessionStore 的 partialize 配置是否正确
3. 检查数据库中的 RLS 策略是否允许读取
