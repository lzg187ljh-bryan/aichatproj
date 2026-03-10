import type { Metadata } from 'next';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export const metadata: Metadata = {
  title: 'AI Chat | Next.js Intelligent Assistant',
  description: 'Experience the future of AI conversation with our advanced chat interface. Built with Next.js, TypeScript, and real-time streaming.',
  keywords: ['AI Chat', 'Next.js', 'TypeScript', 'Chatbot', 'Artificial Intelligence'],
  authors: [{ name: 'AI Chat Team' }],
  openGraph: {
    title: 'AI Chat - Next.js Intelligent Assistant',
    description: 'Experience the future of AI conversation with our advanced chat interface.',
    type: 'website',
    locale: 'en_US',
    siteName: 'AI Chat',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Chat - Next.js Intelligent Assistant',
    description: 'Experience the future of AI conversation with our advanced chat interface.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <ChatLayout>
        <ChatContainer />
      </ChatLayout>
    </ErrorBoundary>
  );
}
