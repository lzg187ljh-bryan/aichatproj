/**
 * Components - ChatSkeleton
 * 骨架屏组件
 * 用于 Suspense 流式加载
 */

export function ChatSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-4xl w-full px-4 py-6 space-y-4">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>

        {/* Message list skeleton */}
        <div className="space-y-4 mt-8">
          {/* User message skeleton */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-lg p-4 bg-user-msg">
              <div className="h-4 bg-muted/30 rounded w-24 mb-2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted/30 rounded w-full"></div>
                <div className="h-3 bg-muted/30 rounded w-3/4"></div>
              </div>
            </div>
          </div>

          {/* AI message skeleton */}
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-lg p-4 bg-ai-msg">
              <div className="h-4 bg-muted/30 rounded w-32 mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted/30 rounded w-full"></div>
                <div className="h-3 bg-muted/30 rounded w-5/6"></div>
                <div className="h-3 bg-muted/30 rounded w-4/5"></div>
                <div className="h-3 bg-muted/30 rounded w-2/3"></div>
              </div>
              {/* Typing indicator */}
              <div className="flex gap-1 mt-3">
                <span className="w-2 h-2 bg-muted/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-muted/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-muted/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        </div>

        {/* Input area skeleton */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-input-bg p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 h-11 bg-muted/20 rounded-lg"></div>
              <div className="w-20 h-11 bg-muted/30 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
