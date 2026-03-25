/**
 * Services - AI Provider Factory
 * 统一创建 AI Provider 实例
 */

import type { IAIProvider, AIProviderOptions } from '@/core/interfaces/IAIProvider';
import { MockAIAdapter } from '@/services/mock/MockAIAdapter';
import { SSEAIAdapter } from '@/services/sse/SSEAIAdapter';

export { MockAIAdapter, SSEAIAdapter };

export type ProviderType = 'mock' | 'sse' | 'openai' | 'anthropic' | 'custom';

export interface ProviderConfig {
  type: ProviderType;
  options?: AIProviderOptions;
}

/**
 * AI Provider 工厂函数
 */
export function createAIProvider(config: ProviderConfig): IAIProvider {
  switch (config.type) {
    case 'mock':
      return new MockAIAdapter();
    
    case 'sse':
      // 使用 SSE 适配器调用后端 /api/chat
      return new SSEAIAdapter('/api/chat');
    
    case 'openai':
    case 'anthropic':
    case 'custom':
    default:
      console.warn(`Provider type "${config.type}" not implemented, falling back to SSE`);
      return new SSEAIAdapter('/api/chat');
  }
}

// 默认使用 SSE 适配器（调用后端 API）
export const defaultProvider = new SSEAIAdapter('/api/chat');