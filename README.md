# AI Interview Tutor - 智能面试学习助手

> 产业级 Next.js 全栈 AI 对话应用 | 面试知识点学习工具 | 作品集展示项目

## 项目定位

**核心目标：**
1. 📚 **面试学习工具** - 帮助系统化学习前端/全栈开发面试知识点
2. 🎯 **作品集项目** - 展示产业级前端架构能力、图形学技能、工程化水平

**目标人群：**
- 准备前端/全栈面试的开发者
- 需要高质量 portfolio 项目的工程师
- 想学习现代 Web 开发最佳实践的学习者

---

## 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Next.js | 14+ | App Router, SSR/SSG |
| 语言 | TypeScript | 5.4+ | 强类型安全 |
| 样式 | Tailwind CSS | 4.x | 原子化 CSS |
| 状态 | Zustand | 5.x | 轻量级状态管理 |
| 富文本 | marked + DOMPurify | 17.x / 3.x | 安全 Markdown 渲染 |
| 图形 | 原生 Canvas API | - | AI 状态可视化 |
| 并行 | Web Worker | - | Markdown 解析卸载 |

---

## 已实现功能

### Phase 1: 架构设计与 SEO 基建
- ✅ 强类型 `Message` 实体与 `IAIProvider` 接口契约
- ✅ Next.js `generateMetadata` 动态 SEO Meta 标签
- ✅ 语义化 HTML 结构 (`<main>`, `<article>`, `<section>`)

### Phase 2: Canvas 图形学可视化
- ✅ `AIAuraVisualizer` 组件 - AI 状态光环
- ✅ `requestAnimationFrame` 动画循环
- ✅ Retina 高分屏适配
- ✅ 状态联动: idle / thinking / typing 三态动画

### Phase 3: Mock 流式服务引擎
- ✅ `MockAIAdapter` 实现 - TTFT 首字延迟 600ms
- ✅ 流式吐字 - 30ms 间隔，随机 2-5 字符
- ✅ `AbortController` 完美集成 - 可中断流式响应
- ✅ 复杂 Markdown 语料库 (标题/表格/代码块)

### Phase 4: 时间切片与渲染调优
- ✅ 双缓冲队列 (Double Buffer Queue)
- ✅ `requestAnimationFrame` 批量状态更新
- ✅ 虚拟列表概念 (MessageList)
- ✅ 容器平滑过渡

### Phase 5: Web Worker 线程卸载
- ✅ `markdownWorker.ts` - marked 解析卸载
- ✅ 正则预处理器 - 补全不成对反引号
- ✅ DOMPurify 主线程清洗
- ✅ Worker 生命周期管理 (terminate)

---

## 待实现功能 (Roadmap)

### 🎯 高优先级 (面试前必须完成)

#### F1: 代码块增强
```typescript
// 需求
- 一键复制代码按钮
- Prism.js 语法高亮 (支持 20+ 语言)
- 行号显示
- 语言标签
```
**展示价值:** 体现对开发者体验的关注

#### F2: 会话管理
```typescript
// 需求
- localStorage 持久化存储
- 会话列表 (左侧 sidebar)
- 新建/删除/重命名会话
- 切换会话上下文
```
**展示价值:** 完整 CRUD 能力 + 状态持久化

#### F3: 知识点标签系统
```typescript
// 需求
- 消息打标签: JavaScript / React / Node / CSS / Algorithm
- 按标签筛选会话
- 热门标签统计
```
**展示价值:** 数据结构设计能力 + 筛选

#### F4: 收藏逻辑夹功能
```typescript
// 需求
- 收藏重要问答
- 收藏列表页面
- 导出为 Markdown/PDF
```
**展示价值:** 核心学习功能

---

### 📈 中优先级 (提升作品质量)

#### F5: 暗色主题切换
```typescript
// 需求
- System / Light / Dark 三模式
- localStorage 记住偏好
- 平滑过渡动画
```
**展示价值:** CSS 变量 + Theme Context

#### F6: 搜索功能
```typescript
// 需求
- 全局搜索对话内容
- 高亮匹配结果
- 搜索历史
```
**展示价值:** 搜索算法 + 性能优化

#### F7: 错误边界 (Error Boundary)
```typescript
// 需求
- 组件级错误捕获
- 友好错误提示
- 一键重试
```
**展示价值:** 健壮性设计

#### F8: 骨架屏加载
```typescript
// 需求
- 消息列表骨架屏
- AI 响应骨架屏
- 平滑淡入动画
```
**展示价值:** UX 细节关注

---

### 🚀 低优先级 (加分项)

#### F9: 高级 Canvas 可视化
```typescript
// 想法 (选其一)
- 知识图谱网络图 (节点 + 连线)
- 粒子汇流效果 (接收知识流)
- 3D 地球 (Three.js 星球)
```
**展示价值:** 图形学/3D 能力

#### F10: PWA 支持
```typescript
// 需求
- Service Worker 离线缓存
- Web App Manifest
- 桌面/手机安装提示
```
**展示价值:** 完整 Web App 能力

#### F11: 性能监控面板
```typescript
// 需求
- FPS 实时显示
- FPS 折线图
- 内存使用
```
**展示价值:** 性能优化能力

#### F12: i18n 国际化
```typescript
// 需求
- 中/英双语
- next-intl 或 react-i18next
- 语言切换器
```
**展示价值:** 国际化经验

---

## 项目目录结构

```
src/
├── app/                      # Next.js App Router
│   ├── chat/
│   │   └── page.tsx         # 聊天页面 (动态 SEO)
│   ├── bookmarks/
│   │   └── page.tsx         # 收藏页面
│   ├── settings/
│   │   └── page.tsx         # 设置页面
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 首页
│
├── components/               # UI 组件层
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageItem.tsx  # 代码高亮 + 复制
│   │   └── InputArea.tsx
│   ├── layout/
│   │   ├── ChatLayout.tsx   # 侧边栏 + 主区域
│   │   └── Sidebar.tsx      # 会话列表
│   ├── visual/
│   │   └── AIAuraVisualizer.tsx
│   └── ui/                  # 通用 UI 组件
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Skeleton.tsx
│       └── ThemeToggle.tsx
│
├── core/                     # 核心层
│   ├── interfaces/
│   │   └── IAIProvider.ts
│   └── types/
│       └── message.ts
│
├── services/                 # 服务层
│   ├── mock/
│   │   └── MockAIAdapter.ts
│   └── storage/
│       └── localStorage.ts  # 持久化
│
├── store/                    # 状态管理层
│   ├── chatStore.ts
│   ├── aiStatusStore.ts
│   ├── sessionStore.ts      # 会话管理
│   ├── bookmarkStore.ts     # 收藏
│   └── themeStore.ts        # 主题
│
├── hooks/                    # 自定义 Hooks
│   ├── useChatStream.ts     # 流式 + 双缓冲
│   ├── useAutoScroll.ts
│   ├── useLocalStorage.ts
│   └── useTheme.ts
│
├── workers/                  # Web Worker
│   └── markdownWorker.ts
│
└── utils/                    # 工具函数
    ├── markdown.ts
    ├── syntaxHighlight.ts   # Prism 封装
    └── export.ts            # 导出功能
```

---

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint
```

---

## 性能指标目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| LCP | < 2.5s | Largest Contentful Paint |
| FID | < 100ms | First Input Delay |
| CLS | < 0.1 | Cumulative Layout Shift |
| FPS | 60fps | 动画流畅度 |

---

## 学习资源

### 核心技术
- [Next.js 14 App Router](https://nextjs.org/docs)
- [Zustand 状态管理](https://docs.pmnd.rs/zustand)
- [Canvas MDN 教程](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [Web Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

### 图形学参考
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Particles.js](https://github.com/VincentGarreau/particles.js)
- [Three.js 官方](https://threejs.org/)

### 面试知识点 (AI 对话可学习)
- JavaScript 原理 (原型链/闭包/Event Loop)
- React 核心 (Fiber/Concurrent/Hooks)
- TypeScript 类型系统
- 前端性能优化
- 网络与安全
- 算法与数据结构

---

## 部署

```bash
# Vercel (推荐)
vercel deploy

# 或构建后部署到任意静态托管
npm run build
npm run start
```

---

## 贡献指南

欢迎提交 Issue 和 PR！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'Add xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 提交 Pull Request

---

## License

MIT License
