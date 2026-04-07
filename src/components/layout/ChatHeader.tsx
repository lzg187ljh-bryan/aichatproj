/**
 * Components - ChatHeader
 * 聊天顶部栏
 * 参考 Vercel AI Chatbot 模板
 */

'use client';

export function ChatHeader() {
  return (
    <header className="flex items-center gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm shrink-0">
      <div>
        <h1 className="text-lg font-semibold">AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          AI Assistant
        </p>
      </div>
    </header>
  );
}