/**
 * Core Types - Message Entity
 * 强类型消息实体定义
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'pending' | 'streaming' | 'done' | 'error';

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
