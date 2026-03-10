/**
 * Store - Bookmarks
 * 收藏夹功能 + localStorage 持久化
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Message } from '@/core/types/message';
import { generateMessageId } from '@/core/types/message';

export interface Bookmark {
  id: string;
  messageId: string;
  sessionId: string;
  content: string;
  role: Message['role'];
  note?: string;
  tags: string[];
  createdAt: number;
}

interface BookmarkState {
  bookmarks: Bookmark[];
  
  // Actions
  addBookmark: (message: Message, sessionId: string, note?: string, tags?: string[]) => void;
  removeBookmark: (id: string) => void;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  getBookmarksBySession: (sessionId: string) => Bookmark[];
  isBookmarked: (messageId: string) => boolean;
  getBookmarkByMessageId: (messageId: string) => Bookmark | undefined;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (message, sessionId, note, tags = []) => {
        const bookmark: Bookmark = {
          id: `bookmark_${generateMessageId()}`,
          messageId: message.id,
          sessionId,
          content: message.content,
          role: message.role,
          note,
          tags,
          createdAt: Date.now(),
        };

        set((state) => ({
          bookmarks: [bookmark, ...state.bookmarks],
        }));
      },

      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }));
      },

      updateBookmark: (id, updates) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },

      getBookmarksBySession: (sessionId) => {
        return get().bookmarks.filter((b) => b.sessionId === sessionId);
      },

      isBookmarked: (messageId) => {
        return get().bookmarks.some((b) => b.messageId === messageId);
      },

      getBookmarkByMessageId: (messageId) => {
        return get().bookmarks.find((b) => b.messageId === messageId);
      },
    }),
    {
      name: 'ai-chat-bookmarks',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
