/**
 * Components - MultimodalInput
 * 多模态输入组件
 * 参考 Vercel AI Chatbot 模板
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelector, type ModelId, BAILIAN_MODELS } from './ModelSelector';
import { Send, Square, Paperclip, Mic } from 'lucide-react';

interface MultimodalInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function MultimodalInput({
  onSend,
  onCancel,
  isLoading = false,
  disabled = false,
}: MultimodalInputProps) {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<ModelId>('qwen3.5-plus');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled || isLoading) return;
    
    onSend(trimmed);
    setInput('');
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, disabled, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const selectedModel = BAILIAN_MODELS.find((m) => m.id === model);
  const supportsImage = selectedModel?.input?.includes('image') ?? false;

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto max-w-3xl">
        {/* Input Area */}
        <div className="relative flex flex-col gap-2 rounded-2xl border bg-background p-2 shadow-sm">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={disabled}
            rows={1}
          />

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-2">
            {/* Left: Attachments */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={disabled || !supportsImage}
                title={supportsImage ? 'Attach file' : 'Current model does not support images'}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={disabled}
                title="Voice input (coming soon)"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>

            {/* Right: Model selector & Send */}
            <div className="flex items-center gap-2">
              <ModelSelector value={model} onChange={setModel} />
              
              {isLoading ? (
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={onCancel}
                >
                  <Square className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  disabled={!input.trim() || disabled}
                  onClick={handleSubmit}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}