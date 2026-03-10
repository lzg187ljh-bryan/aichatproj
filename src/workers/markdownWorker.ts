/**
 * Web Worker - Markdown Parser
 * 卸载耗时的 marked 解析
 * 语法高亮在主线程执行 (Prism.js)
 */

import { marked } from 'marked';

// 配置 marked 选项
marked.setOptions({
  gfm: true,
  breaks: true,
});

// 自定义渲染器 - 代码块带语言标签和行号
const renderer = new marked.Renderer();

renderer.code = function({ text, lang }: { text: string; lang?: string }) {
  const language = lang || 'plaintext';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // 生成行号
  const lines = text.split('\n');
  const lineNumbers = lines.map((_, i) => i + 1).join('\n');
  
  return `<div class="code-block-wrapper" data-language="${language}">
    <div class="code-header">
      <span class="code-language">${language}</span>
      <button class="copy-button" data-code="${encodeURIComponent(text)}">Copy</button>
    </div>
    <pre class="code-pre"><code class="language-${language}">${escaped}</code></pre>
  </div>`;
};

marked.use({ renderer });

// 预处理 - 补全不成对的反引号
function preprocessMarkdown(text: string): string {
  let result = text;
  
  // 统计反引号数量
  const backtickCount = (result.match(/`/g) || []).length;
  
  // 如果是奇数，添加一个闭合反引号
  if (backtickCount % 2 !== 0) {
    result += '`';
  }
  
  // 处理不完整的代码块
  const codeBlockRegex = /```(\w*)\n([\s\S]*)$/;
  const match = result.match(codeBlockRegex);
  if (match) {
    const afterMatch = result.slice(result.lastIndexOf('```' + match[1]) + 3 + match[1].length);
    if (!afterMatch.includes('```')) {
      const beforeCodeBlock = result.slice(0, result.lastIndexOf('```' + match[1]));
      const firstThreeBackticks = beforeCodeBlock.lastIndexOf('```');
      const hasClosing = beforeCodeBlock.slice(firstThreeBackticks).match(/```/g)?.length;
      if (hasClosing === 1) {
        result += '\n```';
      }
    }
  }
  
  return result;
}

// 消息类型
interface ParseRequest {
  id: string;
  markdown: string;
}

interface ParseResponse {
  id: string;
  html: string;
  error?: string;
}

// 处理消息
self.onmessage = function(e: MessageEvent<ParseRequest>) {
  const { id, markdown } = e.data;
  
  try {
    // 1. 预处理 Markdown
    const preprocessed = preprocessMarkdown(markdown);
    
    // 2. 解析为 HTML
    const parsed = marked.parse(preprocessed) as string;
    
    // 3. 返回结果 (sanitization 在主线程执行)
    const response: ParseResponse = {
      id,
      html: parsed,
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: ParseResponse = {
      id,
      html: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    self.postMessage(response);
  }
};

// 标记 Worker 就绪
self.postMessage({ type: 'READY' });
