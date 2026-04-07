/**
 * AI Engine - Vercel AI SDK 封装
 * 提供统一的 AI 调用接口，支持多模型和工具调用
 * 
 * 使用方式:
 * - 外部 (/api/chat) 控制是否调用 ai-engine
 * - ai-engine 内部通过 DEV_MODE 手动切换 mock/real
 */

import { 
  generateText, 
  streamText, 
  generateObject,
  tool,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// ==================== 手动切换 (不用环境变量) ====================
// 在这里切换 mock/real，修改后需重启服务
const DEV_MODE: 'mock' | 'real' = 'real';  // ⚠️ 手动切换
// ===============================================================

// 百炼 OpenAI 兼容 Provider
const bailian = createOpenAI({
  apiKey: process.env.BAILIAN_API_KEY || '',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

// 模型配置 - 百炼模型
export type ModelType = 
  | 'qwen-plus'           // Qwen 3.5 Plus
  | 'qwen-max'            // Qwen 3 Max
  | 'qwen-coder-plus'     // Qwen 3 Coder Plus
  | 'qwen-coder-next'     // Qwen 3 Coder Next
  | 'kimi-k2.5'           // Kimi K2.5
  | 'glm-5'               // GLM 5
  | 'glm-4.7'             // GLM 4.7
  | 'minimax-m2.5';       // MiniMax M2.5

const MODELS = {
  'qwen-plus': bailian('qwen-plus'),
  'qwen-max': bailian('qwen-max-2026-01-23'),
  'qwen-coder-plus': bailian('qwen-coder-plus'),
  'qwen-coder-next': bailian('qwen-coder-next'),
  'kimi-k2.5': bailian('kimi-k2.5'),
  'glm-5': bailian('glm-5'),
  'glm-4.7': bailian('glm-4.7'),
  'minimax-m2.5': bailian('minimax-m2.5'),
};

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
  if (DEV_MODE) {
    return {
      text: mockResponse(messages[messages.length - 1]?.content || ''),
      finishReason: 'stop',
    };
  }

  const model = MODELS[options?.model || 'qwen-plus'];
  
  const result = await generateText({
    model,
    messages: messages as any,
    system: options?.systemPrompt,
    temperature: options?.temperature ?? 0.7,
  });

  return {
    text: result.text,
    finishReason: result.finishReason as string,
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
  // 判断是否 mock
  if (DEV_MODE === 'mock') {
    return mockStream(messages[messages.length - 1]?.content || '');
  }

  // real 模式 - 使用百炼模型
  const model = MODELS[options?.model || 'qwen-plus'];

  // 调用 Vercel AI SDK
  const result = streamText({
    model,
    messages: messages as any,
    system: options?.systemPrompt,
    temperature: options?.temperature ?? 0.7,
  });

  // 返回包含 textStream 的对象
  return {
    textStream: result.textStream,
  };
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
  if (DEV_MODE) {
    return {
      object: {},
      finishReason: 'stop',
    };
  }

  const model = MODELS[options?.model || 'qwen-plus'];

  const result = await generateObject({
    model,
    schema: schema as any,
    messages: messages as any,
    system: options?.systemPrompt,
  });

  return {
    object: result.object,
    finishReason: result.finishReason as string,
  };
}

// ==================== Mock 实现 ====================

function mockResponse(userMessage: string): string {
  const responses = [
    `我收到了你的消息: "${userMessage.slice(0, 30)}..."\n\n这是一个 Mock 模式的响应。在真实模式下，我将调用 DeepSeek API 进行回答。\n\n---\n\n*Mock response generated at ${new Date().toLocaleTimeString()}*`,
    
    `感谢你的输入！这是模拟 AI 的回复。\n\n在生产环境中，这个回复会来自真实的 AI 模型。\n\n---\n\n*Generated at ${new Date().toISOString()}*`,
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function mockStream(userMessage: string): { textStream: AsyncIterable<string> } {
  const mockText = mockResponse(userMessage);
  const chunks = mockText.split('');
  let index = 0;
  
  // 使用闭包保存状态
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

// ==================== 工具调用支持 ====================

/**
 * 创建带有工具的流式生成
 */
export function streamAI_WithTools(
  messages: AIMessage[],
  tools: Record<string, ReturnType<typeof tool>>,
  options?: {
    model?: ModelType;
    systemPrompt?: string;
  }
) {
  const model = MODELS[options?.model || 'qwen-plus'];

  return streamText({
    model,
    messages: messages as any,
    system: options?.systemPrompt,
    tools,
  });
}

export { tool };