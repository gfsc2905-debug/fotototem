import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Projeto Supabase específico fornecido no contexto:
const supabaseUrl = 'https://fhitqqurkhgjaqsfclaq.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoaXRxcXVya2hnamFxc2ZjbGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTYwNDYsImV4cCI6MjA4MDg3MjA0Nn0.T_LKixAl7s88Le81eD_v-YxtptR1sTtp0M_zf9PHYYM';

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };