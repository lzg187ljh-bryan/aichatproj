/**
 * Core Interfaces - IAIProvider
 * 流式 AI Provider 适配器接口
 */

import type { Message } from '../types/message';

/**
 * 流式 AI Provider 适配器接口
 * 统一所有 AI 后端的调用契约
 */
export interface IAIProvider {
  /**
   * 发送消息并接收流式响应
   * @param messages - 上下文消息数组
   * @param onChunk - 流式片段回调 (每个字/词)
   * @param onDone - 完成回调
   * @param onError - 错误回调
   * @returns AbortController - 可取消请求
   */
  sendMessageStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): AbortController;
}

/**
 * Provider 配置选项
 */
export interface AIProviderOptions {
  baseURL?: string;
  apiKey?: string;
  model?: string;
  timeout?: number;
}
