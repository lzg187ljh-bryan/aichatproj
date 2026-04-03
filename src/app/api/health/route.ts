import { NextResponse } from 'next/server';

/**
 * Health Check API
 * 用于 Docker 健康检查和负载均衡探测
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    }
  );
}
