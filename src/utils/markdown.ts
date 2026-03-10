/**
 * Utils - Markdown Preprocessor
 * 正则预处理 - 动态补全不成对的反引号
 */

import DOMPurify from 'dompurify';

/**
 * 补全不成对的反引号
 */
export function preprocessMarkdown(text: string): string {
  let result = text;
  
  // 统计反引号数量
  const backtickCount = (result.match(/`/g) || []).length;
  
  // 如果是奇数，添加一个闭合反引号
  if (backtickCount % 2 !== 0) {
    result += '`';
  }
  
  // 处理不完整的代码块 (只有开头没有结尾)
  const codeBlockRegex = /```(\w*)\n([\s\S]*)$/;
  const match = result.match(codeBlockRegex);
  if (match) {
    // 检查是否有闭合
    const beforeMatch = result.slice(0, result.lastIndexOf('```' + match[1]));
    const afterMatch = result.slice(result.lastIndexOf('```' + match[1]) + 3 + match[1].length);
    
    // 如果没有闭合标签
    if (!afterMatch.includes('```')) {
      // 找到代码块开始位置前的所有 ```
      const beforeCodeBlock = result.slice(0, result.lastIndexOf('```' + match[1]));
      const firstThreeBackticks = beforeCodeBlock.lastIndexOf('```');
      const hasClosing = beforeCodeBlock.slice(firstThreeBackticks).match(/```/g)?.length;
      
      // 如果只有一个开头的 ```
      if (hasClosing === 1) {
        result += '\n```';
      }
    }
  }
  
  return result;
}

/**
 * 安全渲染 Markdown (在 Worker 中调用)
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'code', 'pre', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'img',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}
