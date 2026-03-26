// app/_layout.tsx
// Layout raiz — splash animada + app open ad + stack navigation (sem tabs)

import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initAppOpenAd } from '../lib/appOpenAd';
import {
  setupPushNotifications,
  addNotificationListeners,
} from '../lib/notifications';
import { logScreenView } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { useCoinStore } from '../store/useCoinStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const scaleAnim    = useRef(new Animated.Value(0.85)).current;
  const opacityAnim  = useRef(new Animated.Value(1)).current;
  const dotsOpacity  = useRef(new Animated.Value(0)).current;
  const pathname     = usePathname();

  useEffect(() => {
    if (pathname) logScreenView(pathname);
  }, [pathname]);

  useEffect(() => {
    SplashScreen.hideAsync();
    initAppOpenAd();
    initPushIfLoggedIn();
    useCoinStore.getState().loadCoins();

    const cleanupListeners = addNotificationListeners(
      (notification) => {
        console.log('Notificação recebida:', notification.request.content.title);
      },
      () => {},
    );

    // ─── Animação de entrada ───
    Animated.spring(scaleAnim, {
      toValue: 1, friction: 6, tension: 40, useNativeDriver: true,
    }).start();

    const dotsTimer = setTimeout(() => {
      Animated.timing(dotsOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start();
    }, 600);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.97, duration: 500, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.0,  duration: 400, useNativeDriver: true }),
      ])
    );

    const pulseTimer = setTimeout(() => pulse.start(), 400);

    const exitTimer = setTimeout(() => {
      pulse.stop();
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1.12, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setSplashDone(true));
    }, 2500);

    return () => {
      clearTimeout(dotsTimer);
      clearTimeout(pulseTimer);
      clearTimeout(exitTimer);
      pulse.stop();
      cleanupListeners();
    };
  }, []);

  return (
    <View style={s.root}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="resultado" />
        <Stack.Screen name="vagas" />
        <Stack.Screen name="negociacao" />
        <Stack.Screen name="evolucao" />
        <Stack.Screen name="ranking" />
        <Stack.Screen name="compartilhar" />
        <Stack.Screen name="calculadora" />
        <Stack.Screen name="faq" />
        <Stack.Screen name="cadastro" />
      </Stack>
      {!splashDone && (
        <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
          <Animated.Image
            source={require('../assets/images/icon.png')}
            style={[s.logo, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
          />
          <Animated.Text style={[s.loadingText, { opacity: dotsOpacity }]}>
            Preparando seus dados...
          </Animated.Text>
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
  root:    { flex: 1, backgroundColor: '#0B1838' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B1838',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: {
    width: 280, height: 280, borderRadius: 56,
  },
  loadingText: {
    marginTop: 32, fontSize: 15,
    color: 'rgba(255,255,255,0.35)', fontWeight: '500',
  },
});
