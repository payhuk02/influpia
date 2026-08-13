import { createClient } from '@/utils/supabase/server';
import type { PostgrestError } from '@supabase/supabase-js';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function getSessionClient() {
  return createClient();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readList<T = any>(
  context: string,
  query: (client: SupabaseClient) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>
): Promise<T[]> {
  try {
    const client = await createClient();
    const { data, error } = await query(client);
    if (error) {
      console.error(`[${context}]`, error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error(`[${context}]`, err);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readOne<T = any>(
  context: string,
  query: (client: SupabaseClient) => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  options?: { notFoundOk?: boolean }
): Promise<T | null> {
  try {
    const client = await createClient();
    const { data, error } = await query(client);
    if (error) {
      if (options?.notFoundOk && error.code === 'PGRST116') return null;
      console.error(`[${context}]`, error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`[${context}]`, err);
    return null;
  }
}
