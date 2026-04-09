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

// Coding Plan 模型配置（与 ai-engine.ts 中的 MODELS 对应）
// 文档: https://help.aliyun.com/zh/model-studio/use-coding-plan-in-ai-tools/
export const BAILIAN_MODELS: Array<{
  id: string;
  name: string;
  description: string;
  input: string[];
}> = [
  {
    id: 'glm-5',
    name: 'GLM 5',
    description: '智谱模型，默认推荐',
    input: ['text'],
  },
  {
    id: 'qwen-plus',
    name: 'Qwen Plus',
    description: '通义千问，快速响应',
    input: ['text'],
  },
  {
    id: 'qwen-max',
    name: 'Qwen Max',
    description: '通义千问，最强性能',
    input: ['text'],
  },
  {
    id: 'qwen-coder-plus',
    name: 'Qwen Coder Plus',
    description: '代码专家，编程首选',
    input: ['text'],
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    description: '深度推理，思维链',
    input: ['text'],
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    description: 'DeepSeek，通用对话',
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