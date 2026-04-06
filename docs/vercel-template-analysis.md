# Vercel AI Chatbot 模板 UI 分析报告

## 一、模板核心 UI 模块分析

### 1. 整体布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar (260px)  │  Main Chat Area  │  Artifact Panel (可选)   │
│                   │                  │  (代码/文档预览)          │
├───────────────────┼──────────────────┼──────────────────────────┤
│  Logo             │  Header          │  可关闭的右侧面板          │
│  New chat btn     │  - Private/Public│  - 代码高亮               │
│  Delete all btn   │  - Deploy btn    │  - 文档预览               │
│                   │                  │  - 版本历史               │
│  HISTORY          ├──────────────────┴──────────────────────────┤
│  - Today          │  Chat Content                                     │
│  - Last 7 days    │  - Welcome screen (新对话)                        │
│  - 会话列表        │  - Message list (历史消息)                        │
│                   │  - AI 回复 + Artifact 标记                         │
│  User menu        │                                                   │
│  (Guest)          │  Input Area                                       │
│                   │  - 多模态输入框                                    │
└───────────────────┴───────────────────────────────────────────────────┘
```

### 2. 关键 UI 组件拆解

#### 2.1 Sidebar (左侧边栏)

**结构：**
- **顶部 Logo + Toggle 按钮**
  - Logo 图标 (可点击返回首页)
  - Toggle Sidebar 按钮 (移动端/桌面端)
  
- **操作按钮区**
  - "New chat" 主按钮 (圆角、带图标)
  - "Delete all" 次要按钮
  
- **历史会话列表**
  - 分组显示：TODAY / LAST 7 DAYS
  - 每个会话：标题 + More 菜单按钮
  - 悬停效果：背景色变化
  
- **底部用户区**
  - 头像 + 用户名
  - 下拉箭头 (设置/登出)

**样式特点：**
- 宽度：260px 固定
- 背景：浅灰色 (#f9f9f9)
- 边框：右侧 1px border
- 圆角按钮：border-radius: 8px
- 图标：Lucide icons

#### 2.2 Header (顶部栏)

**结构：**
- **左侧**
  - Toggle Sidebar 按钮 (移动端显示)
  
- **中间**
  - Private/Public 切换按钮 (带锁图标)
  - 下拉菜单选择可见性
  
- **右侧**
  - "Deploy with Vercel" CTA 按钮 (黑色、圆角)

**样式特点：**
- 高度：约 60px
- 背景：白色/透明
- 固定顶部

#### 2.3 Chat Area (聊天区域)

**A. Welcome Screen (新对话状态)**
```
┌─────────────────────────────────────────┐
│                                         │
│         What can I help with?           │
│    Ask a question, write code, or       │
│           explore ideas.                │
│                                         │
│  ┌────────────────┐  ┌────────────────┐ │
│  │ 示例提示 1      │  │ 示例提示 2      │ │
│  └────────────────┘  └────────────────┘ │
│  ┌────────────────┐  ┌────────────────┐ │
│  │ 示例提示 3      │  │ 示例提示 4      │ │
│  └────────────────┘  └────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

- 大标题 + 副标题
- 4 个示例提示按钮 (圆角卡片样式)
- 居中对齐

**B. Message List (对话状态)**

**用户消息：**
- 靠右对齐
- 浅灰色背景气泡
- 圆角：border-radius: 16px (左上/左下/右下), 4px (右上)
- 操作按钮：Edit、Copy (悬停显示)

**AI 消息：**
- 靠左对齐
- 白色背景
- 包含：头像 + 名称 + 内容
- 代码块：带语法高亮 + 复制按钮
- Artifact 标记：可点击展开右侧面板

**C. Input Area (输入区)**
```
┌──────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Ask anything...                                       │  │
│  │                                                        │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│  📎 Choose File    🌙 Kimi K2 0905    [发送按钮]              │
└──────────────────────────────────────────────────────────────┘
```

- 多行文本框 (自动增高)
- 底部工具栏：
  - 左侧：文件上传按钮
  - 中间：模型选择器 (带 Logo)
  - 右侧：发送按钮 (圆形、主色)

#### 2.4 Artifact Panel (右侧面板)

**触发方式：**
- 点击 AI 消息中的代码块
- 点击消息中的 "Open in editor" 按钮

**结构：**
- 可拖拽调整宽度
- 可关闭 (X 按钮)
- 标签页：Code / Preview / History
- 代码编辑器 (带行号、语法高亮)
- 版本历史 (时间线)

### 3. 交互细节

| 交互 | 实现 |
|------|------|
| **模型选择器** | 点击展开 Dropdown，支持搜索，分组显示 (Available/Alibaba/Anthropic/...) |
| **文件上传** | 点击 "Choose File" → 选择文件 → 显示预览/文件名 |
| **发送消息** | Enter 发送，Shift+Enter 换行 |
| **代码块** | 悬停显示 Copy 按钮，点击展开 Artifact Panel |
| **会话操作** | 悬停显示 More 菜单 (Rename/Delete/Share) |
| **自动滚动** | 新消息自动滚动到底部，用户手动滚动时暂停 |

### 4. 响应式设计

**桌面端 (>1024px)：**
- 三栏布局 (Sidebar + Chat + Artifact)
- Sidebar 固定显示

**平板端 (768px-1024px)：**
- 两栏布局 (Sidebar + Chat)
- Artifact 变为抽屉或弹窗

**移动端 (<768px)：**
- 单栏布局
- Sidebar 变为 Sheet (从左侧滑出)
- 底部固定输入框

---

## 二、你的项目 vs Vercel 模板对比

### 功能模块对比表

| 功能模块 | Vercel 模板 | 你的项目 | 差距 |
|----------|-------------|----------|------|
| **布局结构** | 三栏 (Sidebar+Chat+Artifact) | 单栏+Sidebar | 🔴 大 |
| **侧边栏** | 完整功能+分组历史 | 简单会话列表 | 🟡 中 |
| **顶部栏** | Private/Public+Deploy btn | 简单 Header | 🟡 中 |
| **欢迎界面** | Greeting + 示例提示 | 无 | 🟡 中 |
| **消息气泡** | 圆角+操作按钮+Artifact | 简单 Markdown | 🟡 中 |
| **输入区** | 多模态+模型选择器 | 纯文本 | 🔴 大 |
| **右侧面板** | Artifact (代码预览) | 无 | 🔴 大 |
| **模型切换** | Dropdown 选择器 | 无 (固定角色) | 🔴 大 |
| **深色模式** | next-themes 完整 | 无 | 🟡 中 |
| **响应式** | 完整适配 | 基础 | 🟡 中 |

### 你的项目优势 ✅

| 亮点 | 说明 |
|------|------|
| **Canvas 粒子系统** | Vercel 模板没有可视化效果 |
| **Web Worker** | Markdown 解析优化 |
| **双缓冲队列** | 性能优化 |
| **SSE 手写实现** | 更底层的控制 |

---

## 三、前端修改方案

### Phase 1: 布局重构 (核心)

#### 目标：实现三栏布局

```
□ 1. 修改路由结构
   - 新建 src/app/(chat)/ 路由组
   - /(chat)/page.tsx → 新对话 (显示 Greeting)
   - /(chat)/[id]/page.tsx → 历史对话
   - /(chat)/layout.tsx → 三栏布局

□ 2. 重构 ChatLayout
   - SidebarProvider (shadcn/ui)
   - 左侧：AppSidebar (260px)
   - 中间：ChatArea (flex-1)
   - 右侧：ArtifactPanel (可折叠, 400px)

□ 3. 新建 ArtifactPanel
   - 可拖拽调整宽度
   - 代码预览 (Prism 高亮)
   - 关闭按钮
```

### Phase 2: 核心组件替换

```
□ 1. Greeting 组件 (欢迎界面)
   - 大标题 + 副标题
   - 4 个示例提示按钮
   - 居中对齐

□ 2. MultimodalInput (多模态输入)
   - 多行文本框 (auto-resize)
   - 文件上传按钮
   - 模型选择器 Dropdown
   - 发送按钮

□ 3. Message 组件 (单条消息)
   - 用户消息：圆角气泡 + 操作按钮
   - AI 消息：头像 + 名称 + 内容
   - 代码块：Copy 按钮 + Artifact 触发

□ 4. Messages 组件 (消息列表)
   - 自动滚动
   - 日期分隔线
   - 空状态处理

□ 5. ModelSelector (模型选择器)
   - Dropdown 组件
   - 搜索功能
   - 分组显示
   - 模型 Logo

□ 6. ChatHeader (聊天头部)
   - Private/Public 切换
   - 会话标题 (可编辑)
   - Deploy 按钮 (可选)
```

### Phase 3: Sidebar 增强

```
□ 1. 会话分组
   - TODAY / YESTERDAY / LAST 7 DAYS
   - 时间线分组显示

□ 2. 会话操作
   - 悬停显示 More 菜单
   - Rename / Delete / Share

□ 3. 用户菜单
   - 头像 + 下拉
   - 设置 / 登出
```

### Phase 4: 样式同步

```
□ 1. 颜色系统
   - 背景色：#f9f9f9 (Sidebar), #ffffff (Chat)
   - 主色：根据品牌调整
   - 边框色：#e5e5e5

□ 2. 圆角系统
   - 按钮：8px
   - 卡片：12px
   - 消息气泡：16px

□ 3. 字体系统
   - 标题：Inter 或系统字体
   - 代码：JetBrains Mono / Fira Code

□ 4. 深色模式
   - next-themes 集成
   - 暗色配色方案
```

### Phase 5: 响应式适配

```
□ 1. 移动端 Sidebar
   - Sheet 组件 (从左侧滑出)
   - 遮罩层

□ 2. 移动端输入
   - 底部固定
   - 全宽显示

□ 3. Artifact Panel
   - 移动端变为全屏或抽屉
```

---

## 四、文件变更清单

### 新增文件

```
src/
├── app/
│   └── (chat)/
│       ├── layout.tsx              # 三栏布局
│       ├── page.tsx                # 新对话页 (Greeting)
│       └── [id]/
│           └── page.tsx            # 历史对话页
├── components/
│   ├── chat/
│   │   ├── greeting.tsx            # 欢迎界面
│   │   ├── multimodal-input.tsx    # 多模态输入
│   │   ├── messages.tsx            # 消息列表
│   │   ├── message.tsx             # 单条消息
│   │   ├── chat-header.tsx         # 聊天头部
│   │   └── artifact.tsx            # 右侧面板
│   └── model-selector.tsx          # 模型选择器
```

### 修改文件

```
src/
├── app/
│   ├── layout.tsx                  # 添加 ThemeProvider
│   └── globals.css                 # 更新样式变量
├── components/
│   ├── layout/
│   │   ├── ChatLayout.tsx          # 重构为三栏
│   │   └── AppSidebar.tsx          # 增强功能
│   └── chat/
│       ├── ChatContainer.tsx       # 整合到新结构
│       ├── MessageItem.tsx         # 替换为 message.tsx
│       └── InputArea.tsx           # 替换为 multimodal-input.tsx
```

### 可删除文件

```
src/components/chat/MessageList.tsx  # 被 messages.tsx 替代
src/components/chat/MessageItem.tsx  # 被 message.tsx 替代
src/components/chat/InputArea.tsx      # 被 multimodal-input.tsx 替代
```

---

## 五、优先级建议

### 🔴 高优先级 (MVP)

1. **布局重构** → 三栏结构
2. **Greeting 组件** → 新对话欢迎界面
3. **MultimodalInput** → 输入区改造
4. **Message 组件** → 消息气泡样式

### 🟡 中优先级

5. **ModelSelector** → 模型切换功能
6. **Sidebar 增强** → 分组历史+操作菜单
7. **深色模式** → next-themes

### 🟢 低优先级 (可选)

8. **Artifact Panel** → 代码预览面板
9. **响应式完善** → 移动端适配
10. **动画效果** → 过渡动画

---

## 六、技术实现要点

### 1. 布局实现 (CSS Grid/Flexbox)

```tsx
// (chat)/layout.tsx
<div className="flex h-screen">
  <Sidebar className="w-64 shrink-0" />
  <main className="flex-1 flex flex-col">
    <ChatHeader />
    <div className="flex-1 overflow-hidden flex">
      <ChatArea className="flex-1" />
      <ArtifactPanel className="w-96 border-l" />
    </div>
  </main>
</div>
```

### 2. 模型选择器 (Dropdown)

```tsx
// 使用 shadcn/ui DropdownMenu
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="ghost">
      <ModelIcon model={currentModel} />
      {currentModel.name}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-80">
    <DropdownMenuLabel>Available</DropdownMenuLabel>
    {models.map(model => (
      <DropdownMenuItem key={model.id}>
        <ModelIcon model={model} />
        {model.name}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

### 3. Artifact 面板

```tsx
// 使用 Resizable 组件
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={70}>
    <ChatArea />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={30} minSize={20}>
    <ArtifactPanel />
  </ResizablePanel>
</ResizablePanelGroup>
```

---

*分析完成时间：2026-04-06*
