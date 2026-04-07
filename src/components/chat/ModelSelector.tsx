/**
 * Components - ModelSelector
 * 百炼模型选择器
 * 参考 Vercel AI Chatbot 模板
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';

// 百炼模型配置（与 ai-engine.ts 中的 MODELS 对应）
export const BAILIAN_MODELS: Array<{
  id: string;
  name: string;
  description: string;
  input: string[];
}> = [
  {
    id: 'qwen-plus',
    name: 'Qwen Plus',
    description: '快速响应，适合日常对话',
    input: ['text', 'image'],
  },
  {
    id: 'qwen-max',
    name: 'Qwen Max',
    description: '最强性能，复杂任务首选',
    input: ['text'],
  },
  {
    id: 'qwen-coder-plus',
    name: 'Qwen Coder Plus',
    description: '代码助手，高性价比',
    input: ['text'],
  },
  {
    id: 'qwen-coder-next',
    name: 'Qwen Coder Next',
    description: '代码专家，编程最佳',
    input: ['text'],
  },
  {
    id: 'kimi-k2.5',
    name: 'Kimi K2.5',
    description: '长上下文，文档理解',
    input: ['text', 'image'],
  },
  {
    id: 'glm-5',
    name: 'GLM 5',
    description: '智谱模型，平衡性能',
    input: ['text'],
  },
  {
    id: 'glm-4.7',
    name: 'GLM 4.7',
    description: '智谱模型，稳定版本',
    input: ['text'],
  },
  {
    id: 'minimax-m2.5',
    name: 'MiniMax M2.5',
    description: 'MiniMax 出品',
    input: ['text'],
  },
];

export type ModelId = typeof BAILIAN_MODELS[number]['id'];

interface ModelSelectorProps {
  value: ModelId;
  onChange: (model: ModelId) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const selectedModel = BAILIAN_MODELS.find((m) => m.id === value) || BAILIAN_MODELS[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
          <span className="truncate max-w-[120px]">{selectedModel.name}</span>
          <ChevronDown className="h-3 w-3 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Select Model</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {BAILIAN_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => {
              onChange(model.id as ModelId);
              setOpen(false);
            }}
            className="flex items-start gap-2 py-2"
          >
            <div className="flex-1">
              <div className="font-medium">{model.name}</div>
              <div className="text-xs text-muted-foreground">
                {model.description}
              </div>
            </div>
            {value === model.id && (
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}