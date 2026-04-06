/**
 * Components - SidebarToggle
 * Sidebar 折叠切换按钮
 * 参考 Vercel AI Chatbot 模板
 */

'use client';

import { PanelLeftIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SidebarToggle() {
  const { toggleSidebar } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleSidebar}
        >
          <PanelLeftIcon className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>Toggle Sidebar (⌘+B)</p>
      </TooltipContent>
    </Tooltip>
  );
}