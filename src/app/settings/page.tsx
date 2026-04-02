import type { Metadata } from 'next';
import { SettingsContent } from './SettingsContent';

export const metadata: Metadata = {
  title: 'Settings | AI Chat',
  description: 'Manage your AI assistant settings and roles',
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-chat-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SettingsContent />
      </div>
    </div>
  );
}