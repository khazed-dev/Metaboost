// Supabase client helper
// NOTE: Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project's values.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const SUPABASE_URL = 'https://lryicwxiavrbdpxzzthi.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyeWljd3hpYXZyYmRweHp6dGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjU3MDQsImV4cCI6MjA3OTQwMTcwNH0.wFJIRZ2KbuaMOR3M4dH1-gjkPtw3d0pKDLiuVEDmXWU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Return count of unread messages in `messages_rows` table.
 * Adjust table name if yours is different.
 */
export async function getUnreadCount() {
  try {
    const { data, count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: false })
      .eq('status', 'unread');

    if (error) throw error;
    return { count: count || 0 };
  } catch (err) {
    console.error('getUnreadCount error', err);
    return { count: 0, error: err };
  }
}

export async function fetchRecentMessages(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data };
  } catch (err) {
    console.error('fetchRecentMessages error', err);
    return { data: [], error: err };
  }
}
