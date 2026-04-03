# Docker 部署指南

> 基于 Docker + Nginx 的自建部署方案，无需 Vercel

---

## 架构概述

```
┌─────────────────────────────────────────────────────────────┐
│                        用户请求                              │
│                         :80                                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │     Nginx      │
                    │  反向代理+缓存  │
                    │   安全响应头    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Next.js      │
                    │  多阶段构建镜像  │
                    │   (端口 3000)   │
                    └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Supabase      │
                    │   (外部服务)     │
                    └─────────────────┘
```

---

## 快速开始

### 前置要求

- Docker Desktop (Windows/Mac/Linux)
- 4GB+ 可用内存

### 1. 准备环境变量

```bash
# 复制模板
copy .env.docker .env

# 编辑 .env，填入真实值
```

### 2. 构建并运行

```bash
# 构建镜像 + 启动容器
docker-compose up --build

# 后台运行
docker-compose up -d

# 查看日志
docker-compose logs -f nextjs

# 停止
docker-compose down
```

### 3. 验证

| 服务 | 地址 |
|------|------|
| 主页 | http://localhost |
| 健康检查 | http://localhost/health |

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `Dockerfile` | Next.js 多阶段构建（builder + runner） |
| `Dockerfile.nginx` | Nginx 容器配置 |
| `docker-compose.yml` | 服务编排（Next.js + Nginx） |
| `nginx/nginx.conf` | 反向代理、缓存、SSL 配置 |
| `.env.docker` | 环境变量模板 |

---

## 关键配置

### Next.js 多阶段构建

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
# 安装依赖 → 构建应用

# Stage 2: Runner（最终镜像）
FROM node:20-alpine AS runner
# 只复制构建产物，镜像 < 200MB
```

### Nginx 反向代理

```nginx
upstream nextjs {
    server nextjs:3000;
}

location / {
    proxy_pass http://nextjs;
    # 头信息转发、WebSocket 支持
}
```

### 安全响应头

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

## HTTPS/SSL 配置

> 当前配置未启用 SSL（仅 HTTP）。生产环境需要配置。

### 步骤 1: 获取 SSL 证书

使用 Let's Encrypt（免费）：

```bash
# 安装 certbot
apt-get install certbot python3-certbot-nginx

# 获取证书（需要域名）
certbot --nginx -d yourdomain.com
```

### 步骤 2: 更新 Nginx 配置

取消注释 `nginx/nginx.conf` 中的 SSL 部分：

```nginx
listen 443 ssl http2;
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

### 步骤 3: HTTP 自动跳转 HTTPS

```nginx
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

---

## 负载均衡（预留）

> 当前为单实例，代码已预留。生产环境可启用。

### 启用方式

1. 修改 `docker-compose.yml`：

```yaml
# 取消注释并修改
# scale: 3
```

2. 更新 `nginx/nginx.conf`：

```nginx
upstream nextjs {
    least_conn;
    server nextjs:3000;
    server nextjs:3001;  # 第二实例
    server nextjs:3002;  # 第三实例
}
```

3. 添加 Redis Session 共享（见下文）

---

## Redis Session 共享（预留）

> 多实例需要 Redis 存储 session。当前单实例不需要。

### 步骤 1: 添加 Redis 服务

```yaml
# docker-compose.yml 中取消注释
redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### 步骤 2: 配置 NextAuth 使用 Redis

```typescript
// 需要实现 NextAuth Redis Adapter
// 详见: https://next-auth.js.org/adapters/redis
```

---

## 环境变量参考

| 变量 | 说明 | 示例 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 key | `eyJxxx...` |
| `NEXT_PUBLIC_USE_AI` | AI 提供商 | `mock` / `sse` |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | `sk-xxx` |
| `NEXTAUTH_SECRET` | NextAuth 密钥 | 随机字符串 |
| `GITHUB_ID` | GitHub OAuth App ID | `Ov23xxx` |
| `GITHUB_SECRET` | GitHub OAuth App Secret | `xxx` |

---

## 面试话术

> "我使用 Docker 多阶段构建将 Next.js 镜像优化到 200MB 以内，Nginx 配置反向代理和静态资源缓存，添加了安全响应头（CSP、HSTS）。生产环境可配置 SSL 证书实现 HTTPS 访问，多实例部署时预留了负载均衡和 Redis Session 共享能力。"

---

## 常见问题

### 构建失败

```bash
# 清理 Docker 缓存
docker builder prune -a

# 重新构建
docker-compose build --no-cache
```

### 端口占用

```bash
# 查看端口占用
netstat -ano | findstr :80

# 停止占用进程或修改 docker-compose.yml 中的端口
```

### 查看容器日志

```bash
docker-compose logs -f
docker-compose logs -f nextjs
docker-compose logs -f nginx
```

---

*最后更新: 2026-03-28*
