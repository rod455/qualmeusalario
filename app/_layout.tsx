import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
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

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const pathname    = usePathname();

  // 🆕 Analytics — loga cada mudança de tela
  useEffect(() => {
    if (pathname) {
      logScreenView(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    // Inicializa o App Open Ad (interstitial de abertura)
    initAppOpenAd();

    // Push Notifications — registra se já logado
    initPushIfLoggedIn();

    // Listeners de notificação (foreground + tap)
    const cleanupListeners = addNotificationListeners(
      // onReceive (foreground)
      (notification) => {
        console.log('Notificação recebida:', notification.request.content.title);
      },
      // onTap — navega + loga no Analytics
      (response) => {
        const data = response.notification.request.content.data;
        const targetScreen = data?.screen as string | undefined;
        logPushOpened(targetScreen);
        if (targetScreen) {
          try {
            router.push(targetScreen);
          } catch {
            router.push('/(tabs)/resultado');
          }
        }
      },
    );

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
      cleanupListeners();
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

async function initPushIfLoggedIn() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await setupPushNotifications();
    }
  } catch (e) {
    console.log('Push init check falhou:', e);
  }
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
