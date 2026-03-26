// app/index.tsx
// Home — Grid com 8 funcionalidades principais

import { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Animated, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import AdBanner from '../components/AdBanner';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 24 * 2 - CARD_GAP) / 2;

const FEATURES = [
  { key: 'vagas',        icon: '💼', title: 'Ver vagas que\npagam mais',        color: COLORS.secondary, route: '/vagas' },
  { key: 'salario',      icon: '📊', title: 'Descobrir meu\nsalário de mercado', color: COLORS.primary,   route: '/(onboarding)/cargo' },
  { key: 'negociacao',   icon: '🎯', title: 'Treinar\nnegociação com IA',       color: COLORS.success,   route: '/negociacao' },
  { key: 'evolucao',     icon: '📈', title: 'Acompanhar\nevolução do mercado',   color: COLORS.orange,    route: '/evolucao' },
  { key: 'ranking',      icon: '🏆', title: 'Ranking cargos\nmais bem pagos',    color: COLORS.warning,   route: '/ranking' },
  { key: 'compartilhar', icon: '🎬', title: 'Compartilhar\nmeu resultado',       color: '#C060E0',        route: '/compartilhar' },
  { key: 'calculadora',  icon: '💰', title: 'Calculadora de\nsalário líquido',   color: COLORS.success,   route: '/calculadora' },
  { key: 'faq',          icon: '❓', title: 'Dúvidas\nFrequentes',               color: COLORS.secondary, route: '/faq' },
] as const;

export default function HomeScreen() {
  const anims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

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
        <View style={s.logoRow}>
          <Image source={require('../assets/images/icon.png')} style={s.logoImg} resizeMode="contain" />
          <Text style={s.logoName}>Quanto Ganha!</Text>
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
                style={[s.card, { borderColor: f.color + '30' }]}
                activeOpacity={0.8}
                onPress={() => router.push(f.route as any)}
              >
                <View style={[s.iconWrap, { backgroundColor: f.color + '18' }]}>
                  <Text style={s.icon}>{f.icon}</Text>
                </View>
                <Text style={s.cardTitle}>{f.title}</Text>
                <View style={[s.cardArrow, { backgroundColor: f.color + '20' }]}>
                  <Text style={[s.arrowTxt, { color: f.color }]}>→</Text>
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
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
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
