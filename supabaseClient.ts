import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Como o app já está rodando na Vercel com este projeto Supabase específico,
// usamos diretamente a URL e a anon key fornecidas.
const SUPABASE_URL = 'https://fhitqqurkhgjaqsfclaq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoaXRxcXVya2hnamFxc2ZjbGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTYwNDYsImV4cCI6MjA4MDg3MjA0Nn0.T_LKixAl7s88Le81eD_v-YxtptR1sTtp0M_zf9PHYYM';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn(
    'Supabase não configurado corretamente: verifique a URL e a anon key.'
  );
}

export { supabase };