/**
 * Services - AI Provider Factory
 * 统一创建 AI Provider 实例
 */

import type { IAIProvider, AIProviderOptions } from '@/core/interfaces/IAIProvider';
import { MockAIAdapter } from '@/services/mock/MockAIAdapter';

export { MockAIAdapter };

export type ProviderType = 'mock' | 'openai' | 'anthropic' | 'custom';

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
    
    case 'openai':
    case 'anthropic':
    case 'custom':
    default:
      // 后续可扩展真实 API
      console.warn(`Provider type "${config.type}" not implemented, falling back to mock`);
      return new MockAIAdapter();
  }
}

// 默认导出 Mock Provider
export const defaultProvider = new MockAIAdapter();
