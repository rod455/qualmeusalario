// lib/notifications.ts
// Push Notifications — registro, permissão, handler e persistência no Supabase
// Usa expo-notifications (compatível com Expo Push Service + FCM)

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// ─── Handler global ───────────────────────────────────────────────────────────
// Define como o app lida com notificações quando está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Registro de token ────────────────────────────────────────────────────────

/**
 * Pede permissão e retorna o Expo Push Token.
 * Retorna null se não for possível (emulador, permissão negada, etc).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push só funciona em dispositivos reais
  if (!Device.isDevice) {
    console.log('Push: ignorado — não é dispositivo real');
    return null;
  }

  // Verifica permissão atual
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Se não tem permissão, pede
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push: permissão negada pelo usuário');
    return null;
  }

  // Canal de notificação no Android (obrigatório Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Quanto Ganha!',
      description: 'Alertas de mercado e variações salariais',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F5A820',
      sound: 'default',
    });
  }

  // Obtém o token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });
    console.log('Push token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('Push: erro ao obter token:', error);
    return null;
  }
}

// ─── Salvar token no Supabase ─────────────────────────────────────────────────

/**
 * Salva (ou atualiza) o push token na tabela `push_tokens`.
 * Faz upsert por (user_id, platform) para evitar duplicatas.
 */
export async function savePushToken(token: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('Push: sem usuário logado — token não salvo');
      return;
    }

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id:  user.id,
          token:    token,
          platform: Platform.OS,   // 'android' ou 'ios'
          active:   true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,platform' }
      );

    if (error) {
      console.error('Push: erro ao salvar token:', error);
    } else {
      console.log('Push: token salvo no Supabase');
    }
  } catch (e) {
    console.error('Push: exceção ao salvar token:', e);
  }
}

/**
 * Desativa o token do usuário (ex: ao fazer logout).
 */
export async function deactivatePushToken(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('push_tokens')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('platform', Platform.OS);
  } catch (e) {
    console.error('Push: erro ao desativar token:', e);
  }
}

// ─── Fluxo completo ───────────────────────────────────────────────────────────

/**
 * Fluxo completo: pede permissão → obtém token → salva no Supabase.
 * Chamar após login/cadastro ou na abertura do app (se já logado).
 */
export async function setupPushNotifications(): Promise<string | null> {
  const token = await registerForPushNotifications();
  if (token) {
    await savePushToken(token);
  }
  return token;
}

// ─── Listeners reutilizáveis ──────────────────────────────────────────────────

/**
 * Registra listeners para quando o usuário interage com uma notificação.
 * Retorna função de cleanup para usar no useEffect.
 */
export function addNotificationListeners(
  onReceive?: (notification: Notifications.Notification) => void,
  onTap?: (response: Notifications.NotificationResponse) => void,
) {
  const receiveSub = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Push recebido (foreground):', notification.request.content.title);
    onReceive?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    console.log('Push tap — data:', data);
    onTap?.(response);
  });

  return () => {
    receiveSub.remove();
    responseSub.remove();
  };
}
