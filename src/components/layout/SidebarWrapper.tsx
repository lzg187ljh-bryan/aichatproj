/**
 * Components - SidebarWrapper
 * 侧边栏容器 - 控制显示/隐藏
 */

'use client';

import { useSidebarStore } from '@/store/sidebarStore';
import { Sidebar } from './Sidebar';

export function SidebarWrapper() {
  const { isOpen, toggle } = useSidebarStore();

  return (
    <div 
      className="transition-all duration-300 ease-in-out overflow-hidden"
      style={{ 
        width: isOpen ? '18rem' : '0',
        flexShrink: 0 
      }}
    >
      {isOpen && (
        <Sidebar isOpen={isOpen} onToggle={toggle} />
      )}
    </div>
  );
}
