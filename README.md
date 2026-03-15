@'
# Quanto Ganha! 💰

> Descubra se seu salário está acima ou abaixo do mercado em segundos.

## Stack

- **App:** React Native + Expo (Expo Router)
- **Banco de dados:** Supabase (auth + análises)
- **Anúncios:** Google AdMob (rewarded + interstitial)
- **Vagas:** Adzuna API
- **Dados salariais:** CAGED 2024

## Estrutura
```
quantoganha/
├── app/
│   ├── (onboarding)/     ← fluxo de entrada (cargo, local, salário, reward)
│   ├── (tabs)/           ← telas principais (resultado, tracker, vagas, negociação, perfil)
│   └── _layout.tsx       ← layout raiz
├── lib/
│   ├── constants.ts      ← cores, IDs AdMob, Supabase, Adzuna
│   ├── salary.ts         ← cálculo de benchmark salarial
│   └── supabase.ts       ← cliente Supabase + auth
├── store/
│   └── useOnboardingStore.ts  ← estado global (Zustand)
├── assets/               ← ícones, splash, fontes
├── app.json              ← config Expo
└── eas.json              ← config EAS Build
```

## Rodando localmente
```bash
npm install
npx expo start
```

## Build Android local
```bash
npx expo run:android --variant release
```

O APK gerado fica em:
`android/app/build/outputs/apk/release/app-release.apk`

## Variáveis de configuração

Todas em `lib/constants.ts` e espelhadas em `app.json > extra`:

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave pública Supabase |
| `ADMOB.APP_ID` | ID do app AdMob |
| `ADMOB.REWARDED_ANDROID` | ID do anúncio rewarded |
| `ADMOB.INTERSTITIAL_ANDROID` | ID do anúncio interstitial |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | Credenciais API de vagas |

## Licença

Proprietário — todos os direitos reservados.
'@ | Set-Content -Encoding UTF8 "README.md"