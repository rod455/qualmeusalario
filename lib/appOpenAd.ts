// lib/appOpenAd.ts
// App Open Ad — exibe interstitial na abertura do app E ao voltar do background
// Abertura: 1x por sessão
// Background: a cada 5+ min inativo

import { Platform, AppState, AppStateStatus } from 'react-native';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB } from './constants';

const IS_DEV = __DEV__;
const AD_UNIT_ID = IS_DEV
  ? TestIds.INTERSTITIAL
  : Platform.OS === 'ios'
    ? ADMOB.APP_OPEN_IOS
    : ADMOB.APP_OPEN_ANDROID;

let appOpenAd: ReturnType<typeof InterstitialAd.createForAdRequest> | null = null;
let hasShownInitial = false;
let backgroundTimestamp: number | null = null;
let resumeAd: ReturnType<typeof InterstitialAd.createForAdRequest> | null = null;
let resumeAdReady = false;

const MIN_BACKGROUND_MS = 5 * 60 * 1000; // 5 minutos

/** Inicializa o ad de abertura + listener de background — chamar uma vez no _layout.tsx */
export function initAppOpenAd() {
  // ─── Ad de abertura (1x por sessão) ─────────────────────────────────────────
  if (!hasShownInitial && !appOpenAd) {
    try {
      appOpenAd = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
        keywords: ['salario', 'emprego', 'carreira', 'vaga emprego', 'curso online'],
      });

      appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        if (!hasShownInitial && appOpenAd) {
          hasShownInitial = true;
          try { appOpenAd.show(); } catch {}
        }
      });

      appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
        // Não recarrega — só 1x na abertura
      });

      appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('App Open ad error:', error);
      });

      appOpenAd.load();
    } catch (e) {
      console.log('Failed to init App Open ad:', e);
    }
  }

  // ─── Listener de background → foreground ──────────────────────────────────
  setupBackgroundListener();
  // Pré-carrega o ad de retorno
  loadResumeAd();
}

function setupBackgroundListener() {
  AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'background' || nextState === 'inactive') {
      // App foi para background — marca timestamp
      backgroundTimestamp = Date.now();
    } else if (nextState === 'active' && backgroundTimestamp) {
      // App voltou para foreground — verifica tempo
      const elapsed = Date.now() - backgroundTimestamp;
      backgroundTimestamp = null;

      if (elapsed >= MIN_BACKGROUND_MS) {
        showResumeAd();
      }
    }
  });
}

function loadResumeAd() {
  try {
    resumeAd = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      keywords: ['salario', 'emprego', 'carreira', 'vaga emprego', 'curso online'],
    });

    resumeAd.addAdEventListener(AdEventType.LOADED, () => {
      resumeAdReady = true;
    });

    resumeAd.addAdEventListener(AdEventType.CLOSED, () => {
      resumeAdReady = false;
      // Recarrega para próximo retorno
      setTimeout(() => loadResumeAd(), 1000);
    });

    resumeAd.addAdEventListener(AdEventType.ERROR, () => {
      resumeAdReady = false;
      // Retry após 30s
      setTimeout(() => loadResumeAd(), 30000);
    });

    resumeAd.load();
  } catch (e) {
    console.log('Failed to load resume ad:', e);
  }
}

function showResumeAd() {
  if (resumeAdReady && resumeAd) {
    try {
      resumeAd.show();
    } catch {
      // Se falhar, recarrega
      loadResumeAd();
    }
  }
}
