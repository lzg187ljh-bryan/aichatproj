/**
 * Supabase Database Service
 * 使用 Supabase Client 代替 Prisma 直连数据库
 * 解决端口 5432 无法访问的问题
 */

import { createBrowserSupabase, createServerSupabase } from './supabase';
import type { Message, MessageRole } from '@/core/types/message';

// ============================================================
// Server-side Helper (for API routes)
// ============================================================

export function getServerSupabase(cookies: {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: any }[]) => void;
}) {
  return createServerSupabase(cookies);
}

// ============================================================
// Conversation Operations
// ============================================================

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string) {
  const supabase = createBrowserSupabase();
  
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at, messages(count)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get a single conversation with messages
 */
export async function getConversation(conversationId: string, userId: string) {
  const supabase = createBrowserSupabase();
  
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (convError) return null;

  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (msgError) throw msgError;

  return {
    ...conversation,
    messages: messages || [],
  };
}

/**
 * Create a new conversation
 */
export async function createConversation(userId: string, title?: string) {
  const supabase = createBrowserSupabase();
  
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: title || 'New Chat',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(conversationId: string, userId: string, title: string) {
  const supabase = createBrowserSupabase();
  
  const { data, error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string, userId: string) {
  const supabase = createBrowserSupabase();
  
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================================
// Message Operations
// ============================================================

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  metadata?: { tokenCount?: number; model?: string }
) {
  const supabase = createBrowserSupabase();
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      token_count: metadata?.tokenCount,
      model: metadata?.model,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Add multiple messages (batch)
 */
export async function addMessages(
  conversationId: string,
  messages: Array<{ role: MessageRole; content: string; metadata?: { tokenCount?: number; model?: string } }>
) {
  const supabase = createBrowserSupabase();
  
  const { error } = await supabase
    .from('messages')
    .insert(
      messages.map((msg) => ({
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
        token_count: msg.metadata?.tokenCount,
        model: msg.metadata?.model,
      }))
    );

  if (error) throw error;
}

/**
 * Get messages from a conversation
 */
export async function getMessages(conversationId: string, userId: string) {
  const supabase = createBrowserSupabase();
  
  // Verify ownership
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (!conversation) return [];

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return messages || [];
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Convert Supabase message to app Message type
 */
export function toMessage(supabaseMessage: {
  id: string;
  role: string;
  content: string;
  created_at: string;
}): Message {
  return {
    id: supabaseMessage.id,
    role: supabaseMessage.role as MessageRole,
    content: supabaseMessage.content,
    timestamp: new Date(supabaseMessage.created_at).getTime(),
    status: 'done',
  };
}

/**
 * Auto-generate conversation title from first message
 */
export function generateTitle(firstMessage: string): string {
  const cleaned = firstMessage.slice(0, 50).trim();
  return cleaned.length < firstMessage.slice(0, 50).length
    ? `${cleaned}...`
    : cleaned;
}