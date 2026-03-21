import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initAppOpenAd } from '../lib/appOpenAd';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 🆕 Inicializa o App Open Ad (interstitial de abertura)
    initAppOpenAd();

    // Pulso suave enquanto carrega
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue:1.07, duration:700, useNativeDriver:true }),
        Animated.timing(scaleAnim, { toValue:1.0,  duration:700, useNativeDriver:true }),
      ])
    );
    pulse.start();

    // Após 2.5s — fade out e revela o app
    const timer = setTimeout(() => {
      pulse.stop();
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setSplashDone(true);
        SplashScreen.hideAsync();
      });
    }, 2500);

    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, []);

  return (
    <View style={s.root}>
      <Slot />
      {!splashDone && (
        <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
          <Animated.Image
            source={require('../assets/images/splash.png')}
            style={[s.logo, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex:1, backgroundColor:'#0B1838' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B1838',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: { width:'72%', height:'45%' },
});
