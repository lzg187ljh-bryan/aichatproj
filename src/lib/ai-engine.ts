/**
 * AI Engine - OpenAI SDK 封装
 * 提供统一的 AI 调用接口，支持多模型和工具调用
 * 
 * 使用方式:
 * - 外部 (/api/chat) 控制是否调用 ai-engine
 * - ai-engine 内部通过 DEV_MODE 手动切换 mock/real
 */

import OpenAI from 'openai';

// ==================== 手动切换 (不用环境变量) ====================
// 在这里切换 mock/real，修改后需重启服务
const DEV_MODE: 'mock' | 'real' = 'real';  // ⚠️ 手动切换
// ===============================================================

// OpenAI 客户端 - Coding Plan 专属配置
// Coding Plan 专属端点 (sk-sp- 开头的 API Key 必须使用此端点)
const openai = new OpenAI({
  apiKey: process.env.BAILIAN_API_KEY || '',
  baseURL: 'https://coding.dashscope.aliyuncs.com/v1',
});

// 模型配置 - Coding Plan 支持的模型
// 注意：Coding Plan 只支持特定模型，需要查阅官方文档确认
export type ModelType = 
  | 'glm-5'               // 智谱 GLM-5
  | 'qwen-plus'           // 通义千问 Plus
  | 'qwen-max'            // 通义千问 Max
  | 'qwen-coder-plus'     // 通义千问 Coder Plus
  | 'deepseek-r1'         // DeepSeek R1
  | 'deepseek-v3';        // DeepSeek V3

// 工具定义类型
export interface AI_Tool {
  name: string;
  description: string;
  parameters: object;
}

// 消息类型
interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 预设角色
export interface PresetRole {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export const DEFAULT_ROLES: PresetRole[] = [
  {
    id: 'default',
    name: 'AI 助手',
    description: '通用 AI 助手',
    systemPrompt: '你是一个有用的 AI 助手。',
  },
  {
    id: 'interviewer',
    name: '面试官',
    description: '模拟技术面试官',
    systemPrompt: `你是一位资深技术面试官，擅长考察候选人的：
1. 技术深度和广度
2. 问题分析和解决能力
3. 系统设计能力
4. 编码风格和最佳实践

请根据候选人应聘的岗位提出有针对性的问题，并根据回答给出专业的反馈和建议。`,
  },
  {
    id: 'code-reviewer',
    name: '代码审查员',
    description: '代码审查和优化建议',
    systemPrompt: `你是一位资深的代码审查专家。你的职责是：
1. 检查代码的正确性、可读性和性能
2. 发现潜在的 bug 和安全问题
3. 提出改进建议和最佳实践
4. 帮助开发者提升代码质量

请提供具体、可执行的建议，附带代码示例。`,
  },
  {
    id: 'teacher',
    name: '英语教师',
    description: '英语学习辅助',
    systemPrompt: `你是一位专业的英语教师，擅长：
1. 纠正语法错误
2. 解释词汇用法
3. 改写更自然的表达
4. 用简单英语解释复杂概念

请用友好、耐心且教学性的方式回应。`,
  },
];

/**
 * 生成文本 (非流式)
 */
export async function generateAI_Text(
  messages: AIMessage[],
  options?: {
    model?: ModelType;
    systemPrompt?: string;
    temperature?: number;
  }
): Promise<{ text: string; finishReason: string }> {
  if (DEV_MODE === 'mock') {
    return {
      text: mockResponse(messages[messages.length - 1]?.content || ''),
      finishReason: 'stop',
    };
  }

  const model = options?.model || 'glm-5';

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
      ...messages,
    ] as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: options?.temperature ?? 0.7,
  });

  return {
    text: completion.choices[0]?.message?.content || '',
    finishReason: completion.choices[0]?.finish_reason || 'stop',
  };
}

/**
 * 流式生成文本
 */
export function streamAI_Text(
  messages: AIMessage[],
  options?: {
    model?: ModelType;
    systemPrompt?: string;
    temperature?: number;
  }
) {
  // Mock mode
  if (DEV_MODE === 'mock') {
    return mockStream(messages[messages.length - 1]?.content || '');
  }

  // Real mode - 使用 OpenAI SDK 流式调用
  const model = options?.model || 'glm-5';

  const streamPromise = openai.chat.completions.create({
    model,
    messages: [
      ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
      ...messages,
    ] as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: options?.temperature ?? 0.7,
    stream: true,
  });

  // 转换为 AsyncIterable<string>
  const textStream: AsyncIterable<string> = {
    [Symbol.asyncIterator]: async function* () {
      const stream = await streamPromise;
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    }
  };

  return { textStream };
}

/**
 * 生成结构化对象
 */
export async function generateAI_Object(
  messages: AIMessage[],
  schema: object,
  options?: {
    model?: ModelType;
    systemPrompt?: string;
  }
): Promise<{ object: unknown; finishReason: string }> {
  if (DEV_MODE === 'mock') {
    return {
      object: {},
      finishReason: 'stop',
    };
  }

  const model = options?.model || 'glm-5';

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      ...(options?.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
      ...messages,
    ] as OpenAI.Chat.ChatCompletionMessageParam[],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{}';

  return {
    object: JSON.parse(content),
    finishReason: completion.choices[0]?.finish_reason || 'stop',
  };
}

// ==================== Mock 实现 ====================

function mockResponse(userMessage: string): string {
  const responses = [
    `我收到了你的消息: "${userMessage.slice(0, 30)}..."\n\n这是一个 Mock 模式的响应。在真实模式下，我将调用 AI API 进行回答。\n\n---\n\n*Mock response generated at ${new Date().toLocaleTimeString()}*`,

    `感谢你的输入！这是模拟 AI 的回复。\n\n在生产环境中，这个回复会来自真实的 AI 模型。\n\n---\n\n*Generated at ${new Date().toISOString()}*`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

function mockStream(userMessage: string): { textStream: AsyncIterable<string> } {
  const mockText = mockResponse(userMessage);
  const chunks = mockText.split('');
  let index = 0;

  const asyncIterable: AsyncIterable<string> = {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<string>> {
          return new Promise((resolve) => {
            if (index >= chunks.length) {
              resolve({ done: true, value: undefined as unknown as string });
              return;
            }

            setTimeout(() => {
              const value = chunks[index];
              index++;
              resolve({ done: false, value });
            }, 30);
          });
        },
      };
    },
  };

  return {
    textStream: asyncIterable,
  };
}
