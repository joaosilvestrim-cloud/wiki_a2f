import { createClient } from '@supabase/supabase-js';

// Mesmo banco do sistema A2F Gestao (projeto Supabase "Site_a2f" / ltuaaankunjsatowwekn).
// Configurado via .env.local; o fallback aponta para o mesmo projeto compartilhado.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://ltuaaankunjsatowwekn.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0dWFhYW5rdW5qc2F0b3d3ZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTIxMjksImV4cCI6MjA2OTgyODEyOX0.WTXR6fzqOVmmjHkKtYu8t6z9JFeXAdFBAqp_Nc7Ob2A';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export {
    customSupabaseClient,
    customSupabaseClient as supabase,
};
