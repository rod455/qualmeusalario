// components/AdBanner.tsx
// 🆕 Banner adaptativo reutilizável — mesmo padrão do Concursos Brasil
import { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB } from '../lib/constants';

const IS_DEV = __DEV__;
const BANNER_ID = IS_DEV
  ? TestIds.ADAPTIVE_BANNER
  : Platform.OS === 'ios'
    ? ADMOB.BANNER_IOS
    : ADMOB.BANNER_ANDROID;

export default function AdBanner() {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={[styles.container, !loaded && styles.hidden]}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
          keywords: [
            'salario',
            'emprego',
            'vaga emprego',
            'carreira',
            'curso online',
            'pos graduacao',
            'freelancer',
            'trabalho remoto',
          ],
        }}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={(e) => {
          setLoaded(false);
          console.log('Banner failed:', e);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    minHeight: 60,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  hidden: {
    minHeight: 0,
    height: 0,
    overflow: 'hidden',
  },
});
