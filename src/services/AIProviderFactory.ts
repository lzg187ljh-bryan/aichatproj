/**
 * Services - AI Provider
 * 统一使用 SSE 适配器调用后端 /api/chat API
 * mock/real 切换由后端通过 NEXT_PUBLIC_USE_AI 环境变量控制
 */

import type { IAIProvider } from '@/core/interfaces/IAIProvider';
import { SSEAIAdapter } from './sse/SSEAIAdapter';

// 默认使用 SSE 适配器（走后端 API）
export const aiProvider: IAIProvider = new SSEAIAdapter('/api/chat');
