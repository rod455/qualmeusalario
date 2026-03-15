import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const SUPABASE_URL      = extra.supabaseUrl      as string;
export const SUPABASE_ANON_KEY = extra.supabaseAnonKey  as string;
export const ADZUNA_APP_ID     = extra.adzunaAppId      as string;
export const ADZUNA_APP_KEY    = extra.adzunaAppKey     as string;

export const ADMOB_REWARDED_ANDROID = extra.admobRewardedAndroid as string;
export const ADMOB_REWARDED_IOS     = extra.admobRewardedIos     as string;

// Cores do app
export const COLORS = {
  primary:    '#1D9E75',
  primaryDark:'#0F6E56',
  primaryBg:  '#e8f8f2',
  dark:       '#0d0d0d',
  card:       '#1a1a1a',
  danger:     '#E24B4A',
  warning:    '#FAC775',
  text:       '#ffffff',
  textMuted:  'rgba(255,255,255,0.45)',
  textFaint:  'rgba(255,255,255,0.25)',
  border:     'rgba(255,255,255,0.08)',
} as const;

// Multiplicadores por modelo de trabalho
export const MODEL_MULT: Record<string, number> = {
  presencial: 1.0,
  hibrido:    1.05,
  remoto:     1.12,
  nomad:      1.20,
};

export const MODEL_LABEL: Record<string, string> = {
  presencial: 'Presencial',
  hibrido:    'Híbrido',
  remoto:     'Remoto',
  nomad:      'Nomad Digital ✈️',
};
