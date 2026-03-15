import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:           AsyncStorage,
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl: false,
  },
});

// Tipos das tabelas
export type SalaryAnalysis = {
  id?:          string;
  user_id?:     string;
  cargo:        string;
  area:         string | null;
  cidade:       string;
  uf:           string;
  is_nomad:     boolean;
  work_model:   string;
  exp_years:    number;
  salary_fixo:  number;
  salary_total: number;
  market_total: number;
  diff_pct:     number;
  diff_mes:     number;
  diff_ano:     number;
  created_at?:  string;
};

export async function saveAnalysis(analysis: Omit<SalaryAnalysis, 'id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('salary_analyses')
    .insert({ ...analysis, user_id: user.id })
    .select()
    .single();

  if (error) console.error('saveAnalysis error:', error);
  return data;
}

export async function getUserAnalyses() {
  const { data, error } = await supabase
    .from('salary_analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) console.error('getUserAnalyses error:', error);
  return data ?? [];
}
