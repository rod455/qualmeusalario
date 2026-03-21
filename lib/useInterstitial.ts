// lib/useInterstitial.ts
// 🆕 Hook reutilizável para exibir interstitial antes de uma ação
// Mesmo padrão do Concursos Brasil: carrega ao montar, exibe no clique, executa callback no CLOSED
import { useEffect, useState, useRef } from 'react';
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
    ? ADMOB.INTERSTITIAL_IOS
    : ADMOB.INTERSTITIAL_ANDROID;

/**
 * Hook que gerencia um interstitial.
 * Retorna `showAdThenDo(callback)` — exibe o ad e executa o callback quando o ad fecha.
 * Se o ad não carregou, executa o callback direto (não bloqueia o usuário).
 */
export function useInterstitial(keywords?: string[]) {
  const [adReady, setAdReady] = useState(false);
  const callbackRef = useRef<(() => void) | null>(null);
  const adRef = useRef<ReturnType<typeof InterstitialAd.createForAdRequest> | null>(null);

  useEffect(() => {
    try {
      const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
        keywords: keywords ?? [
          'salario', 'emprego', 'carreira', 'vaga emprego',
          'curso online', 'pos graduacao', 'trabalho remoto',
        ],
      });
      adRef.current = ad;

      const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        setAdReady(true);
      });

      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        setAdReady(false);
        // Executa o callback pendente
        if (callbackRef.current) {
          callbackRef.current();
          callbackRef.current = null;
        }
        // Recarrega para próximo uso
        ad.load();
      });

      const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
        setAdReady(false);
        // Em caso de erro, executa callback direto
        if (callbackRef.current) {
          callbackRef.current();
          callbackRef.current = null;
        }
      });

      ad.load();

      return () => {
        unsubLoaded();
        unsubClosed();
        unsubError();
      };
    } catch {
      // Se falhar a criação do ad, tudo funciona sem ad
    }
  }, []);

  /** Exibe o interstitial e depois executa `callback`. Se ad não estiver pronto, executa direto. */
  async function showAdThenDo(callback: () => void) {
    if (adReady && adRef.current) {
      callbackRef.current = callback;
      try {
        await adRef.current.show();
      } catch {
        // Se show() falhar, executa direto
        callbackRef.current = null;
        callback();
      }
    } else {
      // Ad não carregou — não bloqueia o usuário
      callback();
    }
  }

  return { adReady, showAdThenDo };
}
