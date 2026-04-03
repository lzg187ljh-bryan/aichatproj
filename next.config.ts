import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 多实例部署需要
  output: 'standalone',

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

export default nextConfig;
