/**
 * Components - Greeting
 * 新对话欢迎界面
 * 参考 Vercel AI Chatbot 模板
 * 包含 3D 粒子球可视化
 */

'use client';

import { Button } from '@/components/ui/button';
import { ParticleSphere } from '@/components/visual/ParticleSphere';
import { Sparkles, Code, FileText, HelpCircle } from 'lucide-react';

interface GreetingProps {
  onExampleClick: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  {
    icon: Sparkles,
    title: 'What are the advantages of using Next.js?',
    prompt: 'What are the advantages of using Next.js compared to other React frameworks?',
  },
  {
    icon: Code,
    title: "Write code to demonstrate Dijkstra's algorithm",
    prompt: "Write code to demonstrate Dijkstra's algorithm in TypeScript with comments explaining each step.",
  },
  {
    icon: FileText,
    title: 'Help me write an essay about Silicon Valley',
    prompt: 'Help me write an essay about the history and impact of Silicon Valley on the tech industry.',
  },
  {
    icon: HelpCircle,
    title: 'What is the weather in San Francisco?',
    prompt: 'What is the current weather in San Francisco? Please also suggest what to wear.',
  },
];

export function Greeting({ onExampleClick }: GreetingProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* 3D WebGL 粒子球 - 在标题上方 */}
        <div className="relative w-[300px] h-[300px] mb-4 pointer-events-none mx-auto">
          <ParticleSphere />
        </div>
        
        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            What can I help with?
          </h1>
          <p className="text-muted-foreground text-lg">
            Ask a question, write code, or explore ideas.
          </p>
        </div>

        {/* Example Prompts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
          {EXAMPLE_PROMPTS.map((example, index) => {
            const Icon = example.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto py-4 px-4 justify-start text-left bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={() => onExampleClick(example.prompt)}
              >
                <Icon className="h-4 w-4 mr-3 shrink-0 text-muted-foreground" />
                <span className="text-sm">{example.title}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}