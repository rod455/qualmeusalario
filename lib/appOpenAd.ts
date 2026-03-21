// lib/appOpenAd.ts
// 🆕 Simula App Open Ad usando Interstitial (mesmo padrão do Concursos Brasil)
// Exibe um interstitial na abertura do app — carrega uma vez, exibe quando pronto.
import { Platform } from 'react-native';
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
let hasShown = false;

/** Inicializa o ad de abertura — chamar uma vez no _layout.tsx */
export function initAppOpenAd() {
  if (appOpenAd || hasShown) return;

  try {
    appOpenAd = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      keywords: ['salario', 'emprego', 'carreira', 'vaga emprego', 'curso online'],
    });

    const unsubLoaded = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      // Ad carregou — tenta exibir imediatamente
      if (!hasShown && appOpenAd) {
        hasShown = true;
        try {
          appOpenAd.show();
        } catch {
          // Se não conseguiu exibir, tudo bem — segue o fluxo
        }
      }
    });

    const unsubClosed = appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      // Usuário fechou o ad — não recarrega (exibe só 1x por sessão)
    });

    const unsubError = appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('App Open ad error:', error);
      // Em caso de erro, não bloqueia nada
    });

    appOpenAd.load();
  } catch (e) {
    console.log('Failed to init App Open ad:', e);
  }
}
