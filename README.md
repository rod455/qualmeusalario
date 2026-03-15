# Qual Meu Salário? — App Nativo (Expo + React Native)

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Expo SDK 51** + Expo Router |
| Linguagem | **TypeScript** |
| State | **Zustand** |
| Auth + DB | **Supabase** |
| Ads | **AdMob** (react-native-google-mobile-ads) |
| Vagas | **Adzuna API** |
| Negociação | **Claude API** (Anthropic) |

## Estrutura

```
qualmeusalario-app/
├── app/
│   ├── _layout.tsx              ← Root layout (providers)
│   ├── (onboarding)/
│   │   ├── cargo.tsx            ← Tela 1A: cargo
│   │   ├── localizacao.tsx      ← Tela 1B: cidade + modelo
│   │   ├── salario.tsx          ← Tela 1C: salário + variáveis
│   │   └── reward.tsx           ← Tela 2: Rewarded Ad (AdMob)
│   └── (tabs)/
│       ├── resultado.tsx        ← Tab Início: resultado
│       ├── tracker.tsx          ← Tab Tracker
│       ├── vagas.tsx            ← Tab Vagas (Adzuna API)
│       ├── negociacao.tsx       ← Tab Negociação (Claude AI)
│       └── perfil.tsx           ← Tab Perfil + Share
├── lib/
│   ├── constants.ts             ← Credenciais e constantes
│   ├── supabase.ts              ← Cliente Supabase + helpers
│   └── salary.ts                ← Cálculo salarial (lógica pura)
├── store/
│   └── useOnboardingStore.ts    ← State global (Zustand)
├── app.json                     ← Config Expo + IDs AdMob
└── eas.json                     ← Config builds EAS
```

## Setup em 10 minutos

### 1. Clone e instale
```bash
git clone https://github.com/SEU_USUARIO/qualmeusalario-app.git
cd qualmeusalario-app
npm install
```

### 2. Configure as credenciais em `app.json > extra`
Já estão configuradas:
- ✅ Supabase URL + Anon Key
- ✅ Adzuna App ID + Key
- ✅ AdMob App ID + Ad Unit ID (Rewarded)

### 3. Rode localmente
```bash
npx expo start
# Escaneie o QR com Expo Go (iOS/Android)
```

### 4. Build para produção

**Android APK (teste interno):**
```bash
eas build --platform android --profile preview
```

**Android AAB (Play Store):**
```bash
eas build --platform android --profile production
eas submit --platform android
```

**iOS (App Store):**
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

## AdMob — Credenciais

| Campo | Valor |
|---|---|
| App ID (Android + iOS) | `ca-app-pub-9316035916536420~1961894132` |
| Ad Unit Rewarded | `ca-app-pub-9316035916536420/4923099397` |

Em `__DEV__` o app usa automaticamente os IDs de teste do AdMob.

## Fluxo de navegação

```
app.json → index → (onboarding)/cargo
                          ↓
                   (onboarding)/localizacao
                          ↓
                   (onboarding)/salario
                          ↓
                   (onboarding)/reward  ← AdMob Rewarded aqui
                          ↓
                     (tabs)/resultado
                          ↓
              ┌───────────┼───────────┐
           tracker      vagas    negociacao   perfil
```

## Supabase — SQL setup

```sql
create table salary_analyses (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  cargo        text, area text, cidade text, uf text,
  is_nomad     boolean default false,
  work_model   text, exp_years int,
  salary_fixo  numeric, salary_total numeric, market_total numeric,
  diff_pct     int, diff_mes numeric, diff_ano numeric,
  created_at   timestamptz default now()
);

alter table salary_analyses enable row level security;
create policy "own" on salary_analyses for all using (auth.uid() = user_id);
```
