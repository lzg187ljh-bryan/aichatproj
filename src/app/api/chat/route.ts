/**
 * API Route - Chat SSE
 * DeepSeek AI / Mock mode + Supabase Auth + Database persistence
 * 
 * 数据流控制:
 * - USE_MOCK=mock: 直接返回预设响应 (旧版)
 * - USE_MOCK=real: 调用 ai-engine.ts (Vercel AI SDK)
 */

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { streamAI_Text, type ModelType } from '@/lib/ai-engine';

// Types for incoming messages
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  conversationId?: string;
  newConversationTitle?: string;
  model?: string;  // 百炼模型 ID
}

// Check if using mock mode (外层控制)
const USE_MOCK = process.env.NEXT_PUBLIC_USE_AI === 'mock';

// Supabase Admin Client (for server-side DB operations)
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 提取错误信息
 */
function extractError(error: unknown): { message: string; status: number } {
  const defaultError = { message: 'AI service unavailable', status: 500 };

  if (!error || typeof error !== 'object') return defaultError;

  const err = error as {
    message?: string;
    statusCode?: number;
    responseBody?: string;
    cause?: { message?: string; statusCode?: number };
  };

  let message = err.message || defaultError.message;
  const status = err.statusCode || err.cause?.statusCode || defaultError.status;

  if (err.responseBody) {
    try {
      const body = JSON.parse(err.responseBody);
      if (body.error?.message) message = body.error.message;
    } catch { /* ignore */ }
  }

  if (status === 401) message = 'Please sign in to use the chat';
  else if (status === 402 || status === 403) message = 'Insufficient balance. Please check your account.';
  else if (status === 429) message = 'Too many requests. Please try again later.';
  else if (status >= 500) message = 'AI service error. Please try again.';

  return { message, status };
}

/**
 * Generate title from first message
 */
function generateTitle(firstMessage: string): string {
  const cleaned = firstMessage.slice(0, 50).trim();
  return cleaned.length < firstMessage.length ? `${cleaned}...` : cleaned;
}

/**
 * Create new conversation in database
 */
async function createConversation(userId: string, title: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Add messages to conversation
 */
async function addMessages(conversationId: string, messages: Array<{ role: string; content: string }>) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('messages')
    .insert(
      messages.map((msg) => ({
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
      }))
    );

  if (error) throw error;
}

/**
 * Add AI response message
 */
async function addAssistantMessage(conversationId: string, content: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content,
      model: USE_MOCK ? 'mock' : 'deepseek-chat',
    });

  if (error) throw error;
}

/**
 * Generate mock AI response
 */
function generateMockResponse(userMessage: string): string {
  const responses = [
    `Thanks for your message: "${userMessage.slice(0, 50)}..."\n\nHere's a thoughtful response that demonstrates the AI is working correctly.\n\n## Key Points\n\n- This is a **mock response** from the server\n- It shows the API is working\n- Data is being saved to the database\n\n### Code Example\n\n\`\`\`typescript\nconst result = await streamText({\n  model: deepseekProvider('deepseek-chat'),\n  messages,\n});\n\`\`\`\n\n---\n\n*Mock response generated at ${new Date().toLocaleTimeString()}*`,
    
    `I understand you're asking about "${userMessage.slice(0, 30)}..."\n\nThis is a simulated response to demonstrate the chat functionality.\n\n### Features Working\n\n1. ✅ Server-side processing\n2. ✅ Database persistence\n3. ✅ Streaming response\n4. ✅ Authentication\n\n---\n\n*Mock response*`,
    
    `Interesting question! Let me provide a helpful response.\n\nBased on your input: "${userMessage.slice(0, 40)}..."\n\n> This demonstrates that both mock and real AI modes route through the same API endpoint.\n\n\`\`\`json\n{\n  "mode": "${USE_MOCK ? 'mock' : 'real'}",\n  "status": "success"\n}\n\`\`\`\n\n---\n\n*Generated at ${new Date().toISOString()}*`,
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function POST(req: Request) {
  // 验证登录
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // 未登录用户：只返回 AI 响应，不存数据库
  const isAnonymous = !user || authError != null;

  try {
    const { messages, conversationId, newConversationTitle, model } = await req.json() as ChatRequestBody;

    let convId = conversationId;

    // 提取最后一条用户消息
    const userMessages = messages.filter(m => m.role === 'user');
    const userMessage = userMessages[userMessages.length - 1]?.content || '';

    // 登录用户：保存到数据库
    if (!isAnonymous) {
      // 如果没有 conversationId，创建新对话
      if (!convId) {
        const title = newConversationTitle || (messages[0]?.content
          ? generateTitle(String(messages[0].content))
          : 'New Chat');
        const conversation = await createConversation(user.id, title);
        convId = conversation.id;
      }

      // 保存用户消息到数据库
      if (userMessages.length > 0 && convId) {
        await addMessages(convId, userMessages.map(m => ({
          role: m.role,
          content: String(m.content),
        })));
      }
    }
    const conversationIdForAI = convId || '';

    // Mock mode or real AI mode
    if (USE_MOCK) {
      const mockResponse = generateMockResponse(userMessage);
      
      // Stream mock response with proper SSE format
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const chunks = mockResponse.split('');
          let index = 0;
          
          const interval = setInterval(() => {
            if (index >= chunks.length) {
              clearInterval(interval);
              
              // Send [DONE] signal
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              
              // 登录用户：保存到数据库
              if (conversationIdForAI && !isAnonymous) {
                addAssistantMessage(conversationIdForAI, mockResponse).catch(console.error);
              }
              controller.close();
              return;
            }
            
            // SSE format: data: {"content": "x"}\n\n
            const chunk = JSON.stringify({ content: chunks[index] });
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
            index++;
          }, 20); // 20ms per character
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Conversation-Id': conversationIdForAI,
        },
      });
    }

    // Real AI mode - 调用 ai-engine.ts (OpenAI SDK + Coding Plan)
    const result = streamAI_Text(
      messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { model: (model || 'glm-5') as ModelType }  // Coding Plan 默认模型
    ) as { textStream: AsyncIterable<string> };

    // 流式响应
    const { textStream } = result;
    const encoder = new TextEncoder();
    let aiContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            // 发送 SSE 格式
            const data = JSON.stringify({ content: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            aiContent += chunk;
          }
          // 发送完成信号
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          // 登录用户：流结束后保存 AI 消息
          if (aiContent.trim() && convId && !isAnonymous) {
            await addAssistantMessage(convId, aiContent.trim());
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Conversation-Id': convId || '',
      },
    });
  } catch (error) {
    const { message, status } = extractError(error);
    return Response.json({ error: 'AI service unavailable', message }, { status });
  }
}

export async function GET() {
  return Response.json({ status: 'ok', provider: 'deepseek', model: 'deepseek-chat' });
}