import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  // 使用 webpack 而非 Turbopack (PWA 需要)
  turbopack: {},
  
  // 生产环境优化
  productionBrowserSourceMaps: false,
  
  // 压缩输出
  compress: true,
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // 实验性功能
  experimental: {
    // 优化包导入 - tree-shaking
    optimizePackageImports: [
      'prismjs',
      'marked',
      'dompurify',
    ],
  },
};

// PWA 配置 - 基础配置
const configWithPWA = withPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);

export default configWithPWA;
