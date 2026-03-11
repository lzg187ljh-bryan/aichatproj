/**
 * Components - MarkdownRenderer
 * 动态导入的 Markdown 渲染器
 * 使用 dynamic() 懒加载，减少首屏 JS
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { Message } from '@/core/types/message';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';

// 动态导入 Prism 语言支持
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';

interface MarkdownRendererProps {
  message: Message;
  onBookmarkToggle?: (message: Message) => void;
  isBookmarked?: boolean;
}

interface WorkerRequest {
  id: string;
  markdown: string;
}

interface WorkerResponse {
  id: string;
  html: string;
  error?: string;
  type?: string;
}

export function MarkdownRenderer({ message, onBookmarkToggle, isBookmarked }: MarkdownRendererProps) {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const messageIdRef = useRef(message.id);
  const contentRef = useRef<HTMLDivElement>(null);
  // 使用 ref 存储最新消息，避免闭包问题
  const messageRef = useRef(message);
  messageRef.current = message;

  // 复制代码到剪贴板
  const handleCopy = useCallback((index: number, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }, []);

  // 处理复制按钮点击 (事件委托)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('copy-button')) {
        e.preventDefault();
        const code = target.getAttribute('data-code');
        if (code) {
          const index = parseInt(target.getAttribute('data-index') || '0', 10);
          handleCopy(index, decodeURIComponent(code));
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [handleCopy]);

  // 应用 Prism 语法高亮
  const applyHighlighting = useCallback(() => {
    if (!contentRef.current) return;

    const codeBlocks = contentRef.current.querySelectorAll('pre code');
    codeBlocks.forEach((block) => {
      const lang = block.className.match(/language-(\w+)/)?.[1];
      if (lang && Prism.languages[lang]) {
        // @ts-ignore - Prism.highlight 返回字符串
        block.innerHTML = Prism.highlight(
          block.textContent || '',
          Prism.languages[lang],
          lang
        );
        block.classList.add('hljs');
      }
    });
  }, []);

  // 初始化 Worker - 只在组件挂载时创建一次
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('@/workers/markdownWorker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.type === 'READY') return;
      
      const { id, html: workerHtml, error } = e.data;
      
      // 使用 ref 比较，避免闭包陷阱
      if (id === messageIdRef.current) {
        setIsLoading(false);
        if (error) {
          console.error('Markdown parse error:', error);
          setHtml(`<pre>${messageRef.current.content}</pre>`);
        } else {
          const sanitized = DOMPurify.sanitize(workerHtml, {
            ALLOWED_TAGS: [
              'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
              'p', 'br', 'hr',
              'ul', 'ol', 'li',
              'strong', 'em', 'code', 'pre', 'blockquote',
              'table', 'thead', 'tbody', 'tr', 'th', 'td',
              'a', 'img',
              'div', 'span', 'button',
            ],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'data-language', 'data-code', 'data-index'],
            ALLOW_DATA_ATTR: false,
          });
          setHtml(sanitized);
        }
      }
    };

    // 清理：组件卸载时终止 Worker，防止内存泄漏
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);  // 空依赖 - 只在挂载时执行一次

  // 当 HTML 更新后应用语法高亮
  useEffect(() => {
    if (html && !isLoading) {
      setTimeout(applyHighlighting, 0);
    }
  }, [html, isLoading, applyHighlighting]);

  // 当消息内容变化时，发送给 Worker 解析
  useEffect(() => {
    messageIdRef.current = message.id;

    if (!message.content) {
      if (message.role === 'assistant' && message.status === 'streaming') {
        setHtml('<span class="animate-pulse">▊</span>');
      }
      return;
    }

    if (message.status === 'done' || message.content.length > 50) {
      setIsLoading(true);
      
      const request: WorkerRequest = {
        id: message.id,
        markdown: message.content,
      };
      
      workerRef.current?.postMessage(request);
    } else {
      setHtml(message.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;'));
    }
  }, [message.content, message.status, message.id]);

  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';

  return (
    <>
      {/* 消息内容 */}
      <div
        ref={contentRef}
        className={`markdown-content ${isLoading ? 'opacity-70' : ''}`}
      >
        {isStreaming && !html ? (
          <span className="inline-flex items-center">
            <span className="animate-pulse">Generating</span>
            <span className="ml-1 inline-block w-2 h-4 bg-current animate-pulse" />
          </span>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>

      {/* 错误状态 */}
      {message.status === 'error' && message.error && (
        <div className="mt-2 text-sm text-red-500">
          Error: {message.error}
        </div>
      )}

      {/* 操作按钮 */}
      {!isUser && message.status === 'done' && onBookmarkToggle && (
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => onBookmarkToggle(message)}
            className={`p-1 rounded transition-colors ${
              isBookmarked 
                ? 'text-yellow-500 hover:text-yellow-600' 
                : 'text-muted-foreground hover:text-yellow-500'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
