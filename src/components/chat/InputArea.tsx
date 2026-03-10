/**
 * Components - InputArea
 * 自适应高度输入框
 * 支持自动滚动与用户手动翻阅防冲突
 */

'use client';

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { useChatStore } from '@/store/chatStore';

const MIN_HEIGHT = 44;
const MAX_HEIGHT = 200;

interface InputAreaProps {
  onSend: (content: string) => Promise<string | void>;
  onCancel: () => void;
}

export function InputArea({ onSend, onCancel }: InputAreaProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = useChatStore((state) => state.isLoading);

  // 自适应高度
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 重置高度以获取正确的 scrollHeight
    textarea.style.height = `${MIN_HEIGHT}px`;
    
    // 计算新高度
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, MIN_HEIGHT),
      MAX_HEIGHT
    );
    
    textarea.style.height = `${newHeight}px`;
  }, []);

  // 输入变化时调整高度
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // 延迟调整高度，确保 DOM 已更新
    setTimeout(adjustHeight, 0);
  }, [adjustHeight]);

  // 提交消息
  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // 清空输入
    setInput('');
    
    // 重置高度
    if (textareaRef.current) {
      textareaRef.current.style.height = `${MIN_HEIGHT}px`;
    }

    // 发送消息
    await onSend(trimmed);
  }, [input, isLoading, onSend]);

  // 键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 提交，Shift + Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    
    // Escape 取消
    if (e.key === 'Escape' && isLoading) {
      e.preventDefault();
      onCancel();
    }
  }, [handleSubmit, onCancel, isLoading]);

  // 加载状态变化时调整高度
  useEffect(() => {
    adjustHeight();
  }, [isLoading, adjustHeight]);

  return (
    <div className="border-t border-border bg-input-bg px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2">
          {/* 输入框 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 
                         text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: `${MIN_HEIGHT}px`, maxHeight: `${MAX_HEIGHT}px` }}
              rows={1}
              disabled={isLoading}
            />
          </div>

          {/* 发送/取消按钮 */}
          <button
            onClick={isLoading ? onCancel : handleSubmit}
            disabled={!input.trim() && !isLoading}
            className={`
              px-4 py-2.5 rounded-lg font-medium transition-all
              ${isLoading 
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-primary hover:bg-primary-hover text-white disabled:opacity-50 disabled:cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Cancel
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>

        {/* 提示 */}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {isLoading 
            ? 'Press ESC to cancel'
            : 'Press Enter to send, Shift+Enter for new line'
          }
        </p>
      </div>
    </div>
  );
}
