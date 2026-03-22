import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Slot, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initAppOpenAd } from '../lib/appOpenAd';
import {
  setupPushNotifications,
  addNotificationListeners,
} from '../lib/notifications';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 🆕 Inicializa o App Open Ad (interstitial de abertura)
    initAppOpenAd();

    // 🆕 Push Notifications — registra se já logado
    initPushIfLoggedIn();

    // 🆕 Listeners de notificação (foreground + tap)
    const cleanupListeners = addNotificationListeners(
      // onReceive (foreground) — apenas loga
      (notification) => {
        console.log('Notificação recebida:', notification.request.content.title);
      },
      // onTap — navega conforme dados da notificação
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.screen) {
          // Ex: push com { screen: '/(tabs)/vagas' } navega para vagas
          try {
            router.push(data.screen as string);
          } catch {
            // Se a rota não existir, vai pro resultado
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

/**
 * Se o usuário já estiver logado, registra push automaticamente.
 * Caso contrário, o push será registrado após login/cadastro.
 */
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
