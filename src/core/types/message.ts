/**
 * Core Types - Message Entity
 * 强类型消息实体定义 - 支持多种消息子类型
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'pending' | 'streaming' | 'done' | 'error';

/**
 * 消息子类型 - 用于区分 AI 消息的不同形态
 */
export type MessageType = 'text' | 'thinking' | 'tool-call' | 'source' | 'code';

/**
 * 工具调用信息
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

/**
 * 引用来源 (RAG 场景)
 */
export interface Source {
  id: string;
  title: string;
  content: string;
  score?: number;
}

/**
 * 强类型消息实体
 */
export interface Message {
  /** 唯一标识符 */
  id: string;
  /** 消息角色 */
  role: MessageRole;
  /** 消息内容 */
  content: string;
  /** 发送时间戳 */
  timestamp: number;
  /** 消息状态 */
  status: MessageStatus;
  /** 错误信息 (当 status === 'error' 时) */
  error?: string;
  /** 消息子类型 */
  type?: MessageType;
  /** 工具调用列表 */
  toolCalls?: ToolCall[];
  /** 引用来源列表 (RAG) */
  sources?: Source[];
}

/**
 * 创建消息的工厂函数参数
 */
export interface CreateMessageParams {
  role: MessageRole;
  content: string;
}

/**
 * 生成唯一消息 ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 创建消息实体工厂函数
 */
export function createMessage(params: CreateMessageParams): Message {
  return {
    id: generateMessageId(),
    role: params.role,
    content: params.content,
    timestamp: Date.now(),
    status: 'pending',
  };
}
