/**
 * Hooks - useAutoScroll
 * 防冲突自动滚动
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoScrollOptions {
  /** 是否启用自动滚动 */
  enabled?: boolean;
  /** 滚动阈值 (像素) */
  threshold?: number;
}

export function useAutoScroll(containerRef: React.RefObject<HTMLElement | null>, options: UseAutoScrollOptions = {}) {
  const { enabled = true, threshold = 100 } = options;
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 检测用户手动滚动
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 如果用户滚动到距离底部超过阈值，认为是手动滚动
    if (distanceFromBottom > threshold) {
      isUserScrollingRef.current = true;
      
      // 清除之前的超时
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // 停止滚动后一段时间恢复自动滚动
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1000);
    }
  }, [containerRef, threshold]);

  // 滚动到底部
  const scrollToBottom = useCallback((smooth = true) => {
    if (!containerRef.current || !enabled) return;
    
    // 如果用户正在手动滚动，不强制滚动
    if (isUserScrollingRef.current) return;

    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, [containerRef, enabled]);

  // 设置滚动监听
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [containerRef, handleScroll]);

  return {
    scrollToBottom,
    isUserScrolling: () => isUserScrollingRef.current,
  };
}
