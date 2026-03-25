/**
 * API Route - Chat SSE
 * 使用 DeepSeek AI + Supabase Auth + 数据库持久化
 */

import { streamText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// Types for incoming messages
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  conversationId?: string;
  newConversationTitle?: string;
}

// DeepSeek Provider
const deepseekProvider = createOpenAICompatible({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
  name: 'deepseek',
});

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
      model: 'deepseek-chat',
    });

  if (error) throw error;
}

export async function POST(req: Request) {
  // 验证登录
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized', message: 'Please sign in to use the chat' }, { status: 401 });
  }

  try {
    const { messages, conversationId, newConversationTitle } = await req.json() as ChatRequestBody;

    let convId = conversationId;

    // 如果没有 conversationId，创建新对话
    if (!convId) {
      const title = newConversationTitle || (messages[0]?.content
        ? generateTitle(String(messages[0].content))
        : 'New Chat');
      const conversation = await createConversation(user.id, title);
      convId = conversation.id;
    }

    // 保存用户消息到数据库
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0 && convId) {
      await addMessages(convId, userMessages.map(m => ({
        role: m.role,
        content: String(m.content),
      })));
    }

    // 调用 AI
    const result = await streamText({
      model: deepseekProvider('deepseek-chat'),
      messages,
    });

    // 流式响应
    const streamResponse = result.toTextStreamResponse();

    // 保存 AI 响应到数据库
    const reader = streamResponse.body?.getReader();
    const decoder = new TextDecoder();
    let aiContent = '';
    const conversationIdForAI = convId || '';

    if (reader) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              aiContent += decoder.decode(value, { stream: true });
              controller.enqueue(value);
            }
            controller.close();
            reader.releaseLock();

            // 流结束后保存 AI 消息
            if (aiContent.trim() && conversationIdForAI) {
              await addAssistantMessage(conversationIdForAI, aiContent.trim());
            }
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...Object.fromEntries(streamResponse.headers.entries()),
          'X-Conversation-Id': conversationIdForAI,
        },
      });
    }

    return new Response(streamResponse.body, {
      headers: {
        ...Object.fromEntries(streamResponse.headers.entries()),
        'X-Conversation-Id': conversationIdForAI,
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