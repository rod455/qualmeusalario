// app/_layout.tsx
// Layout raiz — splash customizada + app open ad + push notifications
// Fix: usa icon.png com tamanho explícito em vez de splash.png (que tinha padding demais)

import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, Text, Dimensions } from 'react-native';
import { Slot, router, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initAppOpenAd } from '../lib/appOpenAd';
import {
  setupPushNotifications,
  addNotificationListeners,
} from '../lib/notifications';
import { logScreenView, logPushOpened } from '../lib/analytics';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync();

const { width: SCREEN_W } = Dimensions.get('window');
const LOGO_SIZE = Math.min(SCREEN_W * 0.45, 200); // 45% da tela, max 200px

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const pathname    = usePathname();

  useEffect(() => {
    if (pathname) logScreenView(pathname);
  }, [pathname]);

  useEffect(() => {
    initAppOpenAd();
    initPushIfLoggedIn();

    const cleanupListeners = addNotificationListeners(
      (notification) => {
        console.log('Notificação recebida:', notification.request.content.title);
      },
      (response) => {
        const data = response.notification.request.content.data;
        const targetScreen = data?.screen as string | undefined;
        logPushOpened(targetScreen);
        if (targetScreen) {
          try { router.push(targetScreen); } catch { router.push('/(tabs)/resultado'); }
        }
      },
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue:1.07, duration:700, useNativeDriver:true }),
        Animated.timing(scaleAnim, { toValue:1.0,  duration:700, useNativeDriver:true }),
      ])
    );
    pulse.start();

    const timer = setTimeout(() => {
      pulse.stop();
      Animated.timing(opacityAnim, {
        toValue: 0, duration: 400, useNativeDriver: true,
      }).start(() => {
        setSplashDone(true);
        SplashScreen.hideAsync();
      });
    }, 2500);

    return () => { clearTimeout(timer); pulse.stop(); cleanupListeners(); };
  }, []);

  return (
    <View style={s.root}>
      <Slot />
      {!splashDone && (
        <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
          <Animated.Image
            source={require('../assets/images/icon.png')}
            style={[s.logo, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
          />
          <Text style={s.brandName}>Quanto Ganha!</Text>
        </Animated.View>
      )}
    </View>
  );
}

async function initPushIfLoggedIn() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await setupPushNotifications();
  } catch (e) { console.log('Push init check falhou:', e); }
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
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE * 0.22, // Cantos arredondados proporcionais
  },
  brandName: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
});
