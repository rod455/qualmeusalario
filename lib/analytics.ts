// lib/analytics.ts
// Firebase Analytics — tracking de eventos e telas
// Requer: @react-native-firebase/app + @react-native-firebase/analytics

import analytics from '@react-native-firebase/analytics';

// ─── Eventos de tela ──────────────────────────────────────────────────────────

/** Loga visualização de tela (substituindo o auto screen tracking) */
export async function logScreenView(screenName: string, screenClass?: string) {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass ?? screenName,
    });
  } catch (e) {
    console.log('Analytics logScreenView error:', e);
  }
}

// ─── Eventos de negócio ───────────────────────────────────────────────────────

/** Onboarding: usuário selecionou cargo */
export async function logCargoSelected(cargo: string, area: string) {
  try {
    await analytics().logEvent('cargo_selected', { cargo, area });
  } catch {}
}

/** Onboarding: usuário selecionou cidade */
export async function logCidadeSelected(cidade: string, uf: string) {
  try {
    await analytics().logEvent('cidade_selected', { cidade, uf });
  } catch {}
}

/** Onboarding: usuário informou salário */
export async function logSalarioInformado(salario: number, workModel: string) {
  try {
    await analytics().logEvent('salario_informado', {
      salario_faixa: getSalaryBucket(salario),
      work_model: workModel,
    });
  } catch {}
}

/** Resultado: análise concluída */
export async function logAnaliseCompleta(params: {
  cargo: string;
  cidade: string;
  uf: string;
  diff_pct: number;
  acima: boolean;
}) {
  try {
    await analytics().logEvent('analise_completa', {
      cargo: params.cargo,
      cidade: params.cidade,
      uf: params.uf,
      diff_pct: params.diff_pct,
      posicao: params.acima ? 'acima' : 'abaixo',
    });
  } catch {}
}

/** Usuário compartilhou resultado */
export async function logShare(cargo: string) {
  try {
    await analytics().logEvent('share', {
      content_type: 'salary_result',
      item_id: cargo,
    });
  } catch {}
}

/** Cadastro ou login realizado */
export async function logAuthEvent(method: 'cadastro' | 'login') {
  try {
    if (method === 'cadastro') {
      await analytics().logSignUp({ method: 'email' });
    } else {
      await analytics().logLogin({ method: 'email' });
    }
  } catch {}
}

/** CTA clicado (vagas, negociação, tracker, etc) */
export async function logCtaClick(ctaName: string, screen: string) {
  try {
    await analytics().logEvent('cta_click', { cta_name: ctaName, screen });
  } catch {}
}

// ─── Eventos de anúncio ───────────────────────────────────────────────────────

/** Rewarded assistido com sucesso */
export async function logRewardedWatched() {
  try {
    await analytics().logEvent('ad_rewarded_watched', {});
  } catch {}
}

/** Interstitial exibido */
export async function logInterstitialShown(screen: string) {
  try {
    await analytics().logEvent('ad_interstitial_shown', { screen });
  } catch {}
}

// ─── Push ─────────────────────────────────────────────────────────────────────

/** Push permission concedida */
export async function logPushPermissionGranted() {
  try {
    await analytics().logEvent('push_permission_granted', {});
  } catch {}
}

/** Push notification aberta (tap) */
export async function logPushOpened(screen?: string) {
  try {
    await analytics().logEvent('push_opened', { target_screen: screen ?? 'unknown' });
  } catch {}
}

// ─── User Properties ──────────────────────────────────────────────────────────

/** Define propriedades do usuário para segmentação */
export async function setUserProperties(props: {
  cargo?: string;
  cidade?: string;
  uf?: string;
  posicao_mercado?: 'acima' | 'abaixo';
}) {
  try {
    if (props.cargo) await analytics().setUserProperty('cargo', props.cargo.slice(0, 36));
    if (props.cidade) await analytics().setUserProperty('cidade', props.cidade);
    if (props.uf) await analytics().setUserProperty('uf', props.uf);
    if (props.posicao_mercado) await analytics().setUserProperty('posicao_mercado', props.posicao_mercado);
  } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSalaryBucket(salario: number): string {
  if (salario < 2000) return 'ate_2k';
  if (salario < 4000) return '2k_4k';
  if (salario < 7000) return '4k_7k';
  if (salario < 12000) return '7k_12k';
  if (salario < 20000) return '12k_20k';
  return 'acima_20k';
}
