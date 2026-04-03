# ============================================================
# Stage 1: Builder - 安装依赖并构建
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# 构建时参数 - NEXT_PUBLIC_* 变量需要在构建时嵌入
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_USE_AI=mock

# 设置为环境变量供构建使用
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_USE_AI=$NEXT_PUBLIC_USE_AI

# 复制依赖文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm ci

# 复制源码
COPY . .

# 构建应用
RUN npm run build

# ============================================================
# Stage 2: Production - 最小化运行镜像
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 设置环境变量
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 设置权限
USER nextjs

# 暴露端口
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# 启动命令
CMD ["node", "server.js"]
