// app/index.tsx
// Home — Grid com 8 funcionalidades principais
// Cards que precisam de análise prévia mostram indicação sutil

import { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Animated, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import AdBanner from '../components/AdBanner';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useAuth } from '../lib/useAuth';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 24 * 2 - CARD_GAP) / 2;

const FEATURES = [
  { key: 'salario',      icon: '📊', title: 'Descobrir meu\nsalário de mercado', color: COLORS.primary,   route: '/(onboarding)/cargo', needsAnalysis: false, badge: 'Comece aqui' },
  { key: 'vagas',        icon: '💼', title: 'Ver vagas que\npagam mais',        color: COLORS.secondary, route: '/vagas',               needsAnalysis: false },
  { key: 'negociacao',   icon: '🎯', title: 'Treinar\nnegociação com IA',       color: COLORS.success,   route: '/negociacao',          needsAnalysis: false },
  { key: 'evolucao',     icon: '📈', title: 'Acompanhar\nevolução do mercado',   color: COLORS.orange,    route: '/evolucao',            needsAnalysis: false },
  { key: 'ranking',      icon: '🏆', title: 'Ranking cargos\nmais bem pagos',    color: COLORS.warning,   route: '/ranking',             needsAnalysis: false },
  { key: 'compartilhar', icon: '🎬', title: 'Compartilhar\nmeu resultado',       color: '#C060E0',        route: '/compartilhar',        needsAnalysis: true },
  { key: 'calculadora',  icon: '💰', title: 'Calculadora de\nsalário líquido',   color: COLORS.success,   route: '/calculadora',         needsAnalysis: false },
  { key: 'faq',          icon: '❓', title: 'Dúvidas\nFrequentes',               color: COLORS.secondary, route: '/faq',                 needsAnalysis: false },
] as const;

export default function HomeScreen() {
  const anims = useRef(FEATURES.map(() => new Animated.Value(0))).current;
  const hasResult = useOnboardingStore(s => !!s.result);
  const { isLoggedIn, displayName, initials } = useAuth();

  useEffect(() => {
    Animated.stagger(60, anims.map(a =>
      Animated.spring(a, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true })
    )).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Banner ad no topo */}
      <AdBanner />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={s.logoRow}>
            <Image source={require('../assets/images/icon.png')} style={s.logoImg} resizeMode="contain" />
            <Text style={s.logoName}>Quanto Ganha!</Text>
          </View>
          {isLoggedIn ? (
            <View style={s.userBadge}>
              <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
              <Text style={s.userName} numberOfLines={1}>{displayName}</Text>
            </View>
          ) : (
            <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/cadastro')}>
              <Text style={s.loginBtnTxt}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={s.headerSub}>O que você quer descobrir?</Text>
      </View>

      {/* Grid de funcionalidades */}
      <ScrollView
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
      >
        {FEATURES.map((f, i) => {
          const anim = anims[i];
          const locked = f.needsAnalysis && !hasResult;

          return (
            <Animated.View
              key={f.key}
              style={[
                s.cardWrap,
                {
                  opacity: anim,
                  transform: [{
                    translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
                  }],
                },
              ]}
            >
              <TouchableOpacity
                style={[s.card, { borderColor: f.color + '30' }, locked && s.cardLocked]}
                activeOpacity={0.8}
                onPress={() => {
                  if (locked) {
                    router.push('/(onboarding)/cargo' as any);
                  } else {
                    router.push(f.route as any);
                  }
                }}
              >
                {f.badge && !hasResult && (
                  <View style={[s.badgeWrap, { backgroundColor: f.color + '25' }]}>
                    <Text style={[s.badgeTxt, { color: f.color }]}>{f.badge}</Text>
                  </View>
                )}
                <View style={[s.iconWrap, { backgroundColor: f.color + '18' }]}>
                  <Text style={s.icon}>{f.icon}</Text>
                </View>
                <Text style={s.cardTitle}>{f.title}</Text>
                {locked && (
                  <Text style={s.lockedHint}>Faça sua análise primeiro</Text>
                )}
                <View style={[s.cardArrow, { backgroundColor: f.color + '20' }]}>
                  <Text style={[s.arrowTxt, { color: f.color }]}>{locked ? '🔒' : '→'}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.dark },
  header:     { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  headerTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userBadge:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999, paddingRight: 14, paddingLeft: 4, paddingVertical: 4 },
  avatar:     { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: 11, fontWeight: '800', color: COLORS.dark },
  userName:   { fontSize: 12, fontWeight: '600', color: '#fff', maxWidth: 100 },
  loginBtn:   { backgroundColor: 'rgba(245,168,32,0.15)', borderWidth: 1, borderColor: 'rgba(245,168,32,0.3)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  loginBtnTxt:{ fontSize: 12, fontWeight: '700', color: COLORS.primary },
  logoImg:    { width: 36, height: 36, borderRadius: 10 },
  logoName:   { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerSub:  { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: CARD_GAP, paddingTop: 4 },
  cardWrap:   { width: CARD_WIDTH },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  cardLocked: {
    opacity: 0.6,
  },
  badgeWrap: {
    position: 'absolute',
    top: -8,
    right: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon:       { fontSize: 22 },
  cardTitle:  { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 20, letterSpacing: -0.2, marginBottom: 10 },
  lockedHint: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 6 },
  cardArrow: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowTxt:   { fontSize: 16, fontWeight: '700' },
});
