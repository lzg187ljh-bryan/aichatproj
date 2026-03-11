/**
 * Components - SidebarSkeleton
 * 侧边栏骨架屏
 * 用于 Suspense 流式加载
 */

export function SidebarSkeleton() {
  return (
    <aside className="w-72 h-full bg-sidebar border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-16 mb-3"></div>
          <div className="h-10 bg-muted rounded w-full"></div>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
          >
            <div className="w-5 h-5 bg-muted rounded flex-shrink-0"></div>
            <div className="flex-1 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-1"></div>
              <div className="h-3 bg-muted/50 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="h-4 bg-muted rounded w-12 mx-auto"></div>
      </div>
    </aside>
  );
}
