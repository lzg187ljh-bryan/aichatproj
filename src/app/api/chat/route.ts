/**
 * API Route - Chat SSE
 * 示例：如何使用 Next.js API Route 实现 SSE 流式响应
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - 处理聊天请求并返回 SSE 流
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const messages = body.messages || [];

        // 这里可以替换为真实的 AI API 调用
        // 例如：OpenAI, Anthropic, Azure OpenAI 等
        const aiResponse = await simulateAIResponse(messages);

        // SSE 格式：data: <content>\n\n
        for (const chunk of aiResponse) {
          // 检查连接是否断开
          if (controller.desiredSize === null) {
            break;
          }

          const data = JSON.stringify({ content: chunk });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));

          // 模拟流式延迟
          await sleep(30);
        }

        // 发送结束信号
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('[Chat API] Error:', error);
        const errorData = JSON.stringify({ error: String(error) });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲
    },
  });
}

/**
 * GET - 健康检查
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'SSE Chat API is running',
    timestamp: Date.now(),
  });
}

/**
 * 模拟 AI 响应 - 实际项目中替换为真实 API 调用
 */
async function simulateAIResponse(messages: { role: string; content: string }[]): Promise<string[]> {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const corpus = `# AI Response

Thanks for your message: "${lastMessage}"

## Key Points

This is a demonstration of SSE (Server-Sent Events) streaming.

### How SSE Works

1. Server pushes data using \`text/event-stream\`
2. Client receives via EventSource or fetch
3. Data is formatted as \`data: <content>\n\n\`

### Use Cases

- Real-time notifications
- AI streaming responses
- Live dashboards
- Social media feeds

> SSE is lighter than WebSocket for one-way communication

\`\`\`typescript
// Server side
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' }
});
\`\`\`

---

*This response is streamed in real-time using SSE!*`;

  const chunks: string[] = [];
  let currentIndex = 0;
  const chunkSize = 3;

  while (currentIndex < corpus.length) {
    const chunk = corpus.slice(currentIndex, currentIndex + chunkSize);
    chunks.push(chunk);
    currentIndex += chunkSize;
  }

  return chunks;
}

/**
 * 睡眠函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
