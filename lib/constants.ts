// ─── Supabase ─────────────────────────────────────────────────────────────────
export const SUPABASE_URL      = 'https://mnqqmxizchcxwptnhsfm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucXFteGl6Y2hjeHdwdG5oc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTEyMTgsImV4cCI6MjA4OTEyNzIxOH0.G8hnal04gsQVhJd9vorHHKYsnYFtlz3ALtSks1By-rQ';

// ─── Adzuna ───────────────────────────────────────────────────────────────────
export const ADZUNA_APP_ID  = '7e179384';
export const ADZUNA_APP_KEY = '3d838dfc1cc9ec16c0d4feff067fdd33';

// ─── AdMob ────────────────────────────────────────────────────────────────────
export const ADMOB = {
  APP_ID:               'ca-app-pub-9316035916536420~1961894132',
  REWARDED_ANDROID:     'ca-app-pub-9316035916536420/4923099397',
  INTERSTITIAL_ANDROID: 'ca-app-pub-9316035916536420/3763763682',
  REWARDED_IOS:         'ca-app-pub-9316035916536420/4923099397',     // trocar quando criar no iOS
  INTERSTITIAL_IOS:     'ca-app-pub-9316035916536420/3763763682',     // trocar quando criar no iOS
  // IDs de teste para desenvolvimento
  TEST_REWARDED:        'ca-app-pub-3940256099942544/5224354917',
  TEST_INTERSTITIAL:    'ca-app-pub-3940256099942544/1033173712',
};

// ─── Cores ────────────────────────────────────────────────────────────────────
export const COLORS = {
  primary:     '#1D9E75',
  primaryDark: '#0F6E56',
  primaryBg:   '#e8f8f2',
  primaryBgDark:'rgba(29,158,117,0.15)',
  dark:        '#0d0d0d',
  card:        '#1a1a1a',
  danger:      '#E24B4A',
  warning:     '#FAC775',
  white:       '#ffffff',
  textPrimary: '#1a1a1a',
  textMuted:   '#8e8e93',
  textFaint:   '#aeaeb2',
  border:      '#e5e5ea',
  borderDark:  'rgba(255,255,255,0.08)',
  bgLight:     '#f9f9f9',
} as const;

// ─── Tipografia ───────────────────────────────────────────────────────────────
export const FONTS = {
  black:      '800' as const,
  bold:       '700' as const,
  semiBold:   '600' as const,
  medium:     '500' as const,
  regular:    '400' as const,
};

// ─── Multiplicadores de modelo ────────────────────────────────────────────────
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
