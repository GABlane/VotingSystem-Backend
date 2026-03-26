import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

const createSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Lazy-loaded Supabase client (singleton)
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
};

// For backwards compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  },
});
