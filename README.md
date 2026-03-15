# Qual Meu Salário? 💰

> Compare seu salário com a média do mercado em segundos.

**Live:** [qualmeusalario.com.br](https://qualmeusalario.com.br)

---

## Stack

- **Frontend:** HTML + CSS + JavaScript puro (sem frameworks)
- **Banco de dados:** [Supabase](https://supabase.com) (auth + tabela de análises)
- **Deploy:** [Vercel](https://vercel.com) (static hosting)
- **Dados:** CAGED 2024 (embutidos no JS)

---

## Estrutura do projeto

```
qualmeusalario/
├── public/
│   ├── index.html            ← Landing page
│   ├── tela-1a-cargo.html    ← Passo 1: escolha o cargo
│   ├── tela-1b-local.html    ← Passo 2: cidade + modelo de trabalho
│   ├── tela-1c-salario.html  ← Passo 3: salário + variáveis
│   ├── tela-2-reward.html    ← Anúncio 30s + loading
│   ├── tela-3-resultado.html ← Resultado + navbar (Início/Tracker/Vagas/Negociação/Perfil)
│   ├── tela-4-share.html     ← Card TikTok + auth Supabase
│   └── tela-home-logado.html ← Dashboard do usuário logado
├── vercel.json               ← Config Vercel
├── package.json
├── .gitignore
└── README.md
```

---

## Setup local

```bash
# 1. Clone o repo
git clone https://github.com/SEU_USUARIO/qualmeusalario.git
cd qualmeusalario

# 2. Instale dependências (só serve para dev local)
npm install

# 3. Rode localmente
npm run dev
# → http://localhost:3000
```

---

## Configuração do Supabase

1. Acesse [app.supabase.com](https://app.supabase.com) → seu projeto
2. Vá em **SQL Editor** e rode:

```sql
-- Tabela de análises salariais
create table if not exists salary_analyses (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  cargo        text not null,
  area         text,
  cidade       text,
  uf           text,
  is_nomad     boolean default false,
  work_model   text,
  exp_years    int,
  salary_fixo  numeric,
  salary_total numeric,
  market_total numeric,
  diff_pct     int,
  diff_mes     numeric,
  diff_ano     numeric,
  created_at   timestamptz default now()
);

-- RLS: usuário só vê as próprias análises
alter table salary_analyses enable row level security;

create policy "users see own analyses"
  on salary_analyses for all
  using (auth.uid() = user_id);
```

3. Vá em **Authentication → Providers → Google** e ative com suas credenciais OAuth
4. Em **Authentication → URL Configuration** adicione:
   - Site URL: `https://qualmeusalario.vercel.app` (ou seu domínio)
   - Redirect URLs: `https://qualmeusalario.vercel.app/tela-4-share.html`

---

## Deploy no Vercel

### Opção A — Via interface (recomendado)

1. Faça push para o GitHub
2. Acesse [vercel.com/new](https://vercel.com/new)
3. Importe o repositório `qualmeusalario`
4. Vercel detecta automaticamente como **Static Site**
5. Clique **Deploy** — pronto ✓

### Opção B — Via CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Variáveis de ambiente

Não há variáveis de ambiente necessárias — as credenciais do Supabase ficam no HTML da `tela-4-share.html` (chave `anon` pública, segura para frontend).

> ⚠️ Nunca commite a chave `service_role` do Supabase.

---

## Domínio customizado (Vercel)

1. Dashboard Vercel → seu projeto → **Domains**
2. Adicione `qualmeusalario.com.br`
3. Configure os DNS no seu registrador:
   ```
   A     @    76.76.21.21
   CNAME www  cname.vercel-dns.com
   ```

---

## Fluxo do usuário

```
/ (landing)
  ↓
tela-1a-cargo.html    → escolhe cargo
  ↓
tela-1b-local.html    → cidade + modelo de trabalho
  ↓
tela-1c-salario.html  → salário + variáveis (clica "Ver resultado")
  ↓
tela-2-reward.html    → anúncio 30s + cálculo em background
  ↓
tela-3-resultado.html → resultado + navbar 5 tabs
  ↓ (clica "Gerar card TikTok" → assiste reward)
tela-4-share.html     → card viral + auth Supabase
  ↓ (após criar conta)
tela-home-logado.html → dashboard completo
```

---

## Monetização

- **Rewarded Ads:** 2 pontos — antes do resultado (30s) e antes do card TikTok (5s)
- **eCPM estimado:** R$ 40–80/mil impressões (nicho financeiro/RH)
- **Loop viral:** resultado compartilhado → novos usuários → mais análises → mais ads

---

## Licença

Proprietário — todos os direitos reservados.
