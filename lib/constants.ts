// ─── Supabase ─────────────────────────────────────────────────────────────────
export const SUPABASE_URL      = 'https://mnqqmxizchcxwptnhsfm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucXFteGl6Y2hjeHdwdG5oc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTEyMTgsImV4cCI6MjA4OTEyNzIxOH0.G8hnal04gsQVhJd9vorHHKYsnYFtlz3ALtSks1By-rQ';

// ─── Adzuna ───────────────────────────────────────────────────────────────────
export const ADZUNA_APP_ID  = '7e179384';
export const ADZUNA_APP_KEY = '3d838dfc1cc9ec16c0d4feff067fdd33';

// ─── AdMob ────────────────────────────────────────────────────────────────────
export const ADMOB = {
  APP_ID:               'ca-app-pub-9316035916536420~1961894132',
  REWARDED_ANDROID:     'ca-app-pub-9316035916536420/3401306180',     // Rewards entrada (simulação salário)
  REWARDED_VAGAS_ANDROID: 'ca-app-pub-9316035916536420/3500957073',   // Rewards vagas
  INTERSTITIAL_ANDROID: 'ca-app-pub-9316035916536420/2550558246',     // Interstitial cliente engajado
  BANNER_ANDROID:       'ca-app-pub-9316035916536420/4577955786',     // Banner nas telas
  APP_OPEN_ANDROID:     'ca-app-pub-9316035916536420/7632873852',     // Abertura do app
  REWARDED_IOS:         'ca-app-pub-9316035916536420/3401306180',
  REWARDED_VAGAS_IOS:   'ca-app-pub-9316035916536420/3500957073',
  INTERSTITIAL_IOS:     'ca-app-pub-9316035916536420/2550558246',
  BANNER_IOS:           'ca-app-pub-9316035916536420/4577955786',
  APP_OPEN_IOS:         'ca-app-pub-9316035916536420/7632873852',
  TEST_REWARDED:        'ca-app-pub-3940256099942544/5224354917',
  TEST_INTERSTITIAL:    'ca-app-pub-3940256099942544/1033173712',
  TEST_BANNER:          'ca-app-pub-3940256099942544/6300978111',
};

// ─── Brand Colors ─────────────────────────────────────────────────────────────
export const COLORS = {
  primary:   '#F5A820',   // Dourado — CTAs, destaques
  secondary: '#17C8E8',   // Cyan — focus, bordas ativas
  danger:    '#E24B4A',   // Vermelho — abaixo do mercado
  success:   '#1DBE75',   // Verde — acima do mercado
  warning:   '#FAC775',   // Amarelo — nível médio
  orange:    '#F07030',   // Laranja — accent

  dark:      '#0B1838',   // Background principal (navy)
  surface:   '#0F2048',   // Cards e modais
  border:    'rgba(255,255,255,0.08)',

  white:     '#ffffff',
  textMuted: 'rgba(255,255,255,0.45)',
  textFaint: 'rgba(255,255,255,0.25)',
} as const;

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
