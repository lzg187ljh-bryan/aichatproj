/**
 * Components - ArtifactPanel
 * 右侧代码/文档预览面板
 * 固定在顶部，不被外部滑条控制
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Copy, Check, Code, FileText } from 'lucide-react';

interface Artifact {
  id: string;
  type: 'code' | 'document';
  title: string;
  content: string;
  language?: string;
  createdAt: number;
}

interface ArtifactPanelProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export function ArtifactPanel({ artifact, onClose }: ArtifactPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!artifact) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full border-l bg-background w-[400px] shrink-0">
      {/* Header - 固定在顶部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          {artifact.type === 'code' ? (
            <Code className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          <span className="font-medium truncate">{artifact.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs - 内容区域有自己的滚动 */}
      <Tabs defaultValue="code" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-2 shrink-0">
          <TabsTrigger value="code" className="gap-1">
            <Code className="h-3 w-3" />
            Code
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1">
            <FileText className="h-3 w-3" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <pre className="p-4 text-sm font-mono overflow-x-auto">
              <code className={`language-${artifact.language || 'typescript'}`}>
                {artifact.content}
              </code>
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
              <pre>{artifact.content}</pre>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer - 固定在底部 */}
      <div className="px-4 py-2 border-t text-xs text-muted-foreground shrink-0">
        Created: {new Date(artifact.createdAt).toLocaleString()}
      </div>
    </div>
  );
}