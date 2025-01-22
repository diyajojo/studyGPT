import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey || !supabaseUrl) {
  console.error('Supabase environment variables are missing');
  throw new Error('Supabase environment variables are missing');
}

let supabase: SupabaseClient;

try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (err) {
  console.error('Error creating Supabase client', err);
  throw new Error('Error creating Supabase client');
}

export { supabase };