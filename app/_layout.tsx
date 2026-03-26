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
  const [ready, setReady]           = useState(false);
  const scaleAnim    = useRef(new Animated.Value(0.7)).current;
  const opacityAnim  = useRef(new Animated.Value(1)).current;
  const dotsOpacity  = useRef(new Animated.Value(0)).current;
  const glowAnim     = useRef(new Animated.Value(0)).current;
  const pathname     = usePathname();

  useEffect(() => {
    if (pathname) logScreenView(pathname);
  }, [pathname]);

  useEffect(() => {
    initAppOpenAd();
    initPushIfLoggedIn();
    useCoinStore.getState().loadCoins();

    const cleanupListeners = addNotificationListeners(
      (notification) => {
        console.log('Notificação recebida:', notification.request.content.title);
      },
      () => {},
    );

    // Espera o layout montar e depois esconde a splash nativa
    const readyTimer = setTimeout(() => {
      setReady(true);
      SplashScreen.hideAsync();
      startSplashAnimation();
    }, 100);

    return () => {
      clearTimeout(readyTimer);
      cleanupListeners();
    };
  }, []);

  function startSplashAnimation() {
    // Logo entra com spring grande e vibrante
    Animated.spring(scaleAnim, {
      toValue: 1, friction: 5, tension: 60, useNativeDriver: true,
    }).start();

    // Glow pulsante (simula brilho)
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    glow.start();

    // Texto "Preparando..." aparece após 500ms
    const dotsTimer = setTimeout(() => {
      Animated.timing(dotsOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start();
    }, 500);

    // Pulso suave na logo
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.96, duration: 600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.0,  duration: 500, useNativeDriver: true }),
      ])
    );

    const pulseTimer = setTimeout(() => pulse.start(), 500);

    // Fade out após 2.5s
    const exitTimer = setTimeout(() => {
      pulse.stop();
      glow.stop();
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 350, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => setSplashDone(true));
    }, 2500);

    // Cleanup em caso de unmount
    return () => {
      clearTimeout(dotsTimer);
      clearTimeout(pulseTimer);
      clearTimeout(exitTimer);
      pulse.stop();
      glow.stop();
    };
  }

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
          {/* Glow atrás da logo */}
          <Animated.View style={[s.glow, {
            opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] }),
            transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }],
          }]} />
          <Animated.Image
            source={require('../assets/images/icon.png')}
            style={[s.logo, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
          />
          <Animated.Text style={[s.appName, { opacity: dotsOpacity }]}>
            Quanto Ganha!
          </Animated.Text>
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
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#F5A820',
  },
  logo: {
    width: 180,
    height: 180,
    borderRadius: 40,
    shadowColor: '#F5A820',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  appName: {
    marginTop: 24,
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },
});
