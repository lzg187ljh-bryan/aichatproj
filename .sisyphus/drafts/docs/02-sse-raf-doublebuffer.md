# SSE、RAF 与双缓冲队列详解

本文档解释项目中实现流式响应的核心技术：Server-Sent Events (SSE)、requestAnimationFrame (RAF) 和双缓冲队列。

## 1. 为什么需要流式响应？

### 1.1 传统请求 vs 流式响应

**传统请求**:
```
客户端 ──────────► 服务器 ──────────► AI 处理 (3秒)
客户端 ◄───────────────────────────── 返回完整响应

用户体验: 等待 3 秒，然后一次性显示所有内容
```

**流式响应**:
```
客户端 ──────────► 服务器 ──────────► AI 处理
客户端 ◄────── 第1块 (100ms)
客户端 ◄────── 第2块 (200ms)
客户端 ◄────── 第3块 (300ms)
...
客户端 ◄────── [DONE]

用户体验: 快速开始，逐步显示，像打字机一样流畅
```

### 1.2 项目中的流式场景

用户发送消息 → 后端调用 AI → AI 返回流式响应 → 前端逐步显示

## 2. Server-Sent Events (SSE)

### 2.1 什么是 SSE？

SSE 是一种服务器向客户端推送数据的技术，基于 HTTP 协议，单向通信（服务器→客户端）。

### 2.2 SSE 格式

```
data: {"content": "你"}

data: {"content": "好"}

data: {"content": "！"}

data: [DONE]
```

**格式规则**:
- 每条数据以 `data: ` 开头
- 可以是 JSON 格式或纯文本
- 以空行 `\n\n` 结束
- `[DONE]` 表示流结束

### 2.3 项目中的 SSE 实现（后端）

**位置**: `src/app/api/chat/route.ts`

```typescript
// Mock 模式的流式响应
const stream = new ReadableStream({
  start(controller) {
    const chunks = mockResponse.split('');  // 分解字符串为字符数组
    let index = 0;
    
    const interval = setInterval(() => {
      if (index >= chunks.length) {
        // 发送完成信号
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        
        // 保存到数据库
        if (conversationIdForAI) {
          addAssistantMessage(conversationIdForAI, mockResponse).catch(console.error);
        }
        
        controller.close();
        clearInterval(interval);
        return;
      }
      
      // 发送每块数据
      const chunk = JSON.stringify({ content: chunks[index] });
      controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      index++;
    }, 20);  // 每 20ms 发送一个字符
  },
});

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',  // 关键：SSE 媒体类型
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Conversation-Id': conversationIdForAI,
  },
});
```

**关键点**:
1. `Content-Type: text/event-stream` - 告诉浏览器这是 SSE
2. `Cache-Control: no-cache` - 禁止缓存
3. `Connection: keep-alive` - 保持连接
4. `ReadableStream` - Node.js/浏览器原生流 API

### 2.4 SSE 响应头

```typescript
headers: {
  'Content-Type': 'text/event-stream',  // 必需
  'Cache-Control': 'no-cache',           // 必需
  'Connection': 'keep-alive',            // 保持长连接
  'X-Conversation-Id': conversationIdForAI,  // 自定义头，返回会话 ID
}
```

## 3. 前端接收流式数据

### 3.1 fetch + ReadableStream

**位置**: `src/hooks/useChatStream.ts`

```typescript
function sendToBackend(...) {
  const controller = new AbortController();

  fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, conversationId, newConversationTitle }),
    signal: controller.signal,
  })
  .then(async (response) => {
    // 从响应头获取会话 ID
    const newConversationId = response.headers.get('X-Conversation-Id');
    
    // 获取响应体的读取器
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // 处理最后的数据
        if (buffer.trim()) { ... }
        break;
      }
      
      // 解码二进制数据
      buffer += decoder.decode(value, { stream: true });
      
      // 解析 SSE 格式
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';  // 保留未完成的一行
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            onDone(newConversationId);
            break;
          }
          
          try {
            const p = JSON.parse(data);
            if (p.content) onChunk(p.content);
          } catch {
            onChunk(data);
          }
        }
      }
    }
    
    reader.releaseLock();
    onDone(newConversationId);
  });
}
```

### 3.2 数据解析流程

```
原始二进制数据
     │
     ▼
TextDecoder 解码
     │
     ▼
"data: {\"content\": \"你\"}\n\ndata: {\"content\": \"好\"}\n\n"
     │
     ▼
按行分割
     │
     ▼
["data: {\"content\": \"你\"}", "data: {\"content\": \"好\"}", ""]
     │
     ▼
解析 JSON
     │
     ▼
onChunk("你"), onChunk("好")
```

## 4. requestAnimationFrame (RAF)

### 4.1 什么是 RAF？

`requestAnimationFrame` 是浏览器提供的 API，用于在下次重绘前执行回调。

**特点**:
- 自动匹配显示器刷新率（通常 60fps）
- 页面不可见时自动暂停，节省资源
- 保证回调在重绘前执行，避免闪烁

### 4.2 为什么用 RAF 更新 UI？

```typescript
// 直接在收到数据时更新（问题）
onChunk(chunk) {
  useChatStore.getState().appendToMessage(messageId, chunk);
  // 问题：AI 可能每秒返回几十个字符，频繁触发 React 渲染
  // 导致性能问题
}
```

```typescript
// 使用 RAF 批量更新（推荐）
onChunk(chunk) {
  bufferRef.current.write(messageId, chunk);
  // 只是写入缓冲区，不直接更新 UI
}

// DoubleBufferQueue 内部
write(messageId, chunk) {
  // ... 写入缓冲区 ...
  
  // 触发 RAF（如果还没触发）
  if (this.rafId === null) {
    this.rafId = requestAnimationFrame(this.flush.bind(this));
  }
}

private flush() {
  // 在 RAF 回调中批量更新 UI
  // 最多每帧更新一次
  for (const buffer of pendingData) {
    this.callback(buffer.messageId, buffer.chunks.join(''));
  }
}
```

### 4.3 RAF vs setTimeout/setInterval

| 特性 | RAF | setTimeout | setInterval |
|------|-----|-----------|-------------|
| 刷新率匹配 | ✅ 自动 | ❌ 固定 | ❌ 固定 |
| 页面不可见时 | ⏸️ 暂停 | ▶️ 继续 | ▶️ 继续 |
| 性能 | ✅ 高 | ❌ 中 | ❌ 低 |
| UI 流畅度 | ✅ 最流畅 | ❌ 可能卡顿 | ❌ 可能卡顿 |

## 5. 双缓冲队列 (Double Buffer Queue)

### 5.1 为什么需要双缓冲？

**单缓冲的问题**:
```
收到 chunk1 → 渲染 → 收到 chunk2 → 渲染 → 收到 chunk3 → 渲染
         │                    │                    │
      16ms                 16ms                 16ms
      渲染1次               渲染2次               渲染3次
```

问题：频繁渲染，CPU 占用高

**双缓冲的解决方案**:
```
写入阶段:
  收到 chunk1 → writeBuffer: [chunk1]
  收到 chunk2 → writeBuffer: [chunk1, chunk2]
  收到 chunk3 → writeBuffer: [chunk1, chunk2, chunk3]
  
渲染阶段 (RAF 触发):
  readBuffer ← writeBuffer (交换)
  writeBuffer: []
  
  批量渲染: [chunk1chunk2chunk3]
         │
      1次渲染
```

### 5.2 双缓冲实现

**位置**: `src/hooks/useChatStream.ts`

```typescript
class DoubleBufferQueue {
  // 写入缓冲区 - 接收新数据
  private writeBuffer: ChunkBuffer[] = [];
  
  // 读取缓冲区 - 供 RAF 消费
  private readBuffer: ChunkBuffer[] = [];
  
  // RAF ID，用于取消动画帧
  private rafId: number | null = null;
  
  // 回调函数
  private callback: ((messageId: string, content: string) => void) | null = null;

  // 设置回调
  setCallback(callback) {
    this.callback = callback;
  }

  // 写入数据
  write(messageId: string, chunk: string) {
    // 查找或创建该消息的缓冲区
    const existing = this.writeBuffer.find(b => b.messageId === messageId);
    if (existing) {
      existing.chunks.push(chunk);
    } else {
      this.writeBuffer.push({ messageId, chunks: [chunk] });
    }
    
    // 触发 RAF（如果还没触发）
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.flush.bind(this));
    }
  }

  // 刷新 - 在 RAF 中调用
  private flush() {
    // 交换缓冲区
    const temp = this.writeBuffer;
    this.writeBuffer = this.readBuffer;
    this.readBuffer = temp;
    
    const pendingData = [...this.readBuffer];
    this.readBuffer = [];
    
    // 批量执行回调
    if (this.callback && pendingData.length > 0) {
      for (const buffer of pendingData) {
        // 合并所有 chunks
        this.callback(buffer.messageId, buffer.chunks.join(''));
      }
    }
    
    // 如果写入缓冲区还有数据，继续 RAF
    if (this.writeBuffer.length > 0) {
      this.rafId = requestAnimationFrame(this.flush.bind(this));
    } else {
      this.rafId = null;
    }
  }

  // 清理
  destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
    this.writeBuffer = [];
    this.readBuffer = [];
  }
}
```

### 5.3 双缓冲流程图

```
                    ┌─────────────────┐
                    │  收到 AI 响应   │
                    │    "你好"       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   write()       │
                    │                 │
                    │ writeBuffer:    │
                    │ [{id: "msg1",   │
                    │   chunks:       │
                    │   ["你","好"]}] │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ rafId === null? │
                    └────────┬────────┘
                    Yes     │     No
                     │      │      │
                     ▼      │      ▼
              ┌────────────┐  ┌────────────┐
              │ 启动 RAF   │  │ 等待现有   │
              │            │  │  RAF 完成   │
              └─────┬──────┘  └────────────┘
                    │
                    ▼ (下一帧)
              ┌────────────┐
              │   flush()  │
              │            │
              │ 交换缓冲区 │
              │ wB → rB    │
              └─────┬──────┘
                    │
                    ▼
              ┌────────────┐
              │ 读取 rB    │
              │ 批量回调   │
              │            │
              │ callback(  │
              │   "msg1",  │
              │   "你好")  │
              └─────┬──────┘
                    │
                    ▼
              ┌────────────┐
              │ React 渲染 │
              │ AI 消息    │
              │ 内容: "你   │
              │ 好"        │
              └────────────┘
```

## 6. 完整数据流

```
用户发送消息
    │
    ▼
┌─────────────────────────────────────────┐
│          useChatStream.sendMessage()    │
│                                         │
│  1. addMessage('user', content)        │
│  2. addMessage('assistant', '')        │
│  3. fetch('/api/chat', ...)             │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│          后端 /api/chat                 │
│                                         │
│  1. 验证用户                            │
│  2. 保存用户消息到数据库                 │
│  3. 调用 AI (流式响应)                   │
│     - Mock: 模拟延迟 + SSE              │
│     - Real: DeepSeek API + streamText   │
└────────────────────┬────────────────────┘
                     │ SSE 流式返回
                     ▼
┌─────────────────────────────────────────┐
│       sendToBackend (前端)              │
│                                         │
│  1. response.body.getReader()           │
│  2. 循环读取二进制数据                   │
│  3. TextDecoder 解码                    │
│  4. 解析 SSE 格式                       │
│  5. onChunk(chunk)                      │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│      DoubleBufferQueue                  │
│                                         │
│  1. write(messageId, chunk)             │
│  2. 写入 writeBuffer                    │
│  3. 触发 RAF (如果需要)                 │
│  4. RAF 回调: 交换缓冲区                │
│  5. 批量调用 callback                   │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│         chatStore.appendToMessage()     │
│                                         │
│  set((state) => ({                      │
│    messages: state.messages.map(...)   │
│  }))                                    │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│           React 重新渲染               │
│                                         │
│  MessageList 显示更新的消息内容          │
└─────────────────────────────────────────┘
```

## 7. 性能优化要点

### 7.1 为什么要这些优化？

- AI 可能每秒返回几十个字符
- 每个字符都触发 React 渲染会导致性能问题
- 双缓冲 + RAF 减少渲染次数

### 7.2 优化效果

| 场景 | 优化前 | 优化后 |
|------|--------|--------|
| 100 字符响应 | 100 次渲染 | ~2-3 次渲染 |
| CPU 占用 | 高 | 低 |
| 用户感知 | 可能卡顿 | 流畅 |

### 7.3 其他优化手段

1. **Debounce**: 限制更新频率
2. **Throttle**: 固定时间间隔更新
3. **Virtual List**: 长列表虚拟滚动
4. **Web Worker**: 复杂计算移至后台线程
