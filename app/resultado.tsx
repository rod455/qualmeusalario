// app/resultado.tsx
// Tela de resultado da análise salarial — com botão de voltar e ver vagas

import { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, StatusBar, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { fmtBRL } from '../lib/salary';
import { COLORS } from '../lib/constants';
import AdBanner from '../components/AdBanner';
import { logShare, logCtaClick } from '../lib/analytics';

function Bar({ label, myVal, mktVal, max }: { label: string; myVal: number; mktVal: number; max: number }) {
  const myW  = useRef(new Animated.Value(0)).current;
  const mktW = useRef(new Animated.Value(0)).current;
  const above = myVal >= mktVal;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(myW,  { toValue: (myVal / max) * 100,  duration: 800, useNativeDriver: false }),
      Animated.timing(mktW, { toValue: (mktVal / max) * 100, duration: 800, useNativeDriver: false }),
    ]).start();
  }, []);
  return (
    <View style={br.wrap}>
      <View style={br.head}>
        <Text style={br.label}>{label}</Text>
        <View style={br.vals}>
          <Text style={[br.my, above && br.green]}>{fmtBRL(myVal)}</Text>
          <Text style={br.vs}>vs</Text>
          <Text style={br.mkt}>{fmtBRL(mktVal)}</Text>
        </View>
      </View>
      <View style={br.track}>
        <Animated.View style={[br.barMkt, { width: mktW.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
        <Animated.View style={[br.barMy, above && br.barGreen, { width: myW.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
      </View>
    </View>
  );
}
const br = StyleSheet.create({
  wrap:     { marginBottom: 16 },
  head:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label:    { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  vals:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  my:       { fontSize: 13, fontWeight: '800', color: COLORS.danger },
  green:    { color: COLORS.success },
  vs:       { fontSize: 11, color: 'rgba(255,255,255,0.2)' },
  mkt:      { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  track:    { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  barMkt:   { position: 'absolute', height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 },
  barMy:    { position: 'absolute', height: 6, backgroundColor: COLORS.danger, borderRadius: 3 },
  barGreen: { backgroundColor: COLORS.success },
});

export default function ResultadoScreen() {
  const result = useOnboardingStore(s => s.result);

  if (!result) {
    return (
      <SafeAreaView style={s.empty}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
        <TouchableOpacity style={s.backBtn} onPress={() => router.replace('/')}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.emptyEmoji}>📊</Text>
        <Text style={s.emptyTitle}>Nenhuma análise ainda</Text>
        <Text style={s.emptyTxt}>Faça sua análise primeiro para ver o resultado.</Text>
        <TouchableOpacity style={s.emptyBtn} onPress={() => router.replace('/(onboarding)/cargo')}>
          <Text style={s.emptyBtnTxt}>Calcular agora →</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const ab = result.diff >= 0;
  const maxV = Math.max(result.my.total, result.mkt.total) * 1.12;
  const cidadeStr = result.isNomad ? 'Nomad Digital' : `${result.cidade.nome}, ${result.cidade.uf}`;

  const ROWS = [
    { label: 'Salário fixo', my: result.my.fixo,  mkt: result.mkt.fixo },
    { label: 'Comissão',     my: result.my.com,   mkt: result.mkt.com,   skip: result.my.com === 0  && result.mkt.com === 0 },
    { label: 'PLR / Bônus',  my: result.my.plr,   mkt: result.mkt.plr,   skip: result.my.plr === 0  && result.mkt.plr === 0 },
    { label: 'VR / VA',      my: result.my.vr,    mkt: result.mkt.vr,    skip: result.my.vr === 0   && result.mkt.vr === 0 },
    { label: 'Outros',       my: result.my.out,   mkt: result.mkt.out,   skip: result.my.out === 0  && result.mkt.out === 0 },
  ];

  const handleShare = async () => {
    logShare(result.cargo);
    const dir = ab ? 'acima' : 'abaixo';
    await Share.share({
      message: `Meu salário está ${Math.abs(result.diff)}% ${dir} do mercado para ${result.cargo.split('(')[0].trim()} em ${result.cidade.nome}.\n\nCalcula o seu → quantoganha.com.br`,
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <AdBanner />

      {/* Top bar */}
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={s.backTxt}>← Início</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Sua Análise</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.tagRow}>
            <View style={s.tagPrimary}><Text style={s.tagPrimaryTxt}>{result.cargo.split('(')[0].trim()}</Text></View>
            <View style={s.tagGray}><Text style={s.tagGrayTxt}>{cidadeStr}</Text></View>
          </View>
          <Text style={[s.vpct, ab ? s.green : s.red]}>{ab ? '+' : ''}{result.diff}%</Text>
          <Text style={s.vdesc}>{ab ? 'acima do pacote médio de mercado' : 'abaixo do pacote médio de mercado'}</Text>

          <View style={s.barsCard}>
            {ROWS.filter(r => !r.skip).map(r => (
              <Bar key={r.label} label={r.label} myVal={r.my} mktVal={r.mkt} max={maxV} />
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total mensal</Text>
              <View style={s.totalVals}>
                <Text style={[s.totalYou, ab ? s.green : s.red]}>{fmtBRL(result.my.total)}</Text>
                <Text style={s.totalMkt}>mkt: {fmtBRL(result.mkt.total)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gap card */}
        {!ab && (
          <View style={s.gapCard}>
            <Text style={s.gapTitle}>💸 Deixando na mesa</Text>
            <View style={s.gapRow}>
              <View style={s.gapItem}>
                <Text style={s.gapAmt}>{fmtBRL(result.diffMes)}</Text>
                <Text style={s.gapPer}>por mês</Text>
              </View>
              <View style={s.gapDiv} />
              <View style={s.gapItem}>
                <Text style={s.gapAmt}>{fmtBRL(result.diffAno)}</Text>
                <Text style={s.gapPer}>por ano</Text>
              </View>
            </View>
          </View>
        )}

        {/* Info cards */}
        <View style={s.infoSection}>
          <View style={s.infoCard}>
            <Text style={s.infoIcon}>🏙️</Text>
            <Text style={s.infoLabel}>Região</Text>
            <Text style={s.infoVal}>{cidadeStr}</Text>
            <Text style={s.infoDetail}>Multiplicador: {result.cidade.mult}x</Text>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoIcon}>📅</Text>
            <Text style={s.infoLabel}>Experiência</Text>
            <Text style={s.infoVal}>{result.exp} {result.exp === 1 ? 'ano' : 'anos'}</Text>
            <Text style={s.infoDetail}>Impacto no benchmark</Text>
          </View>
        </View>

        {/* CTAs */}
        <View style={s.ctaSection}>
          <TouchableOpacity style={s.ctaVagas} onPress={() => router.push('/vagas')}>
            <Text style={s.ctaVagasTxt}>💼  VER VAGAS QUE PAGAM MAIS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.ctaShare} onPress={handleShare}>
            <Text style={s.ctaShareTxt}>🎬  Compartilhar resultado</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.dark },
  empty:         { flex: 1, backgroundColor: COLORS.dark, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  emptyTxt:      { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 22 },
  emptyBtn:      { backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  emptyBtnTxt:   { color: COLORS.dark, fontWeight: '800', fontSize: 15 },
  backBtn:       { position: 'absolute', top: 60, left: 20 },
  backTxt:       { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  topbar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.07)' },
  topTitle:      { fontSize: 15, fontWeight: '700', color: '#fff' },
  hero:          { padding: 20, paddingBottom: 0 },
  tagRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  tagPrimary:    { backgroundColor: 'rgba(245,168,32,0.15)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tagPrimaryTxt: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  tagGray:       { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tagGrayTxt:    { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  vpct:          { fontSize: 64, fontWeight: '900', lineHeight: 68, letterSpacing: -2 },
  red:           { color: COLORS.danger },
  green:         { color: COLORS.success },
  vdesc:         { fontSize: 15, color: 'rgba(255,255,255,0.4)', marginTop: 4, marginBottom: 20 },
  barsCard:      { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 24, padding: 18, marginBottom: 16 },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 4, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)' },
  totalLabel:    { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  totalVals:     { alignItems: 'flex-end' },
  totalYou:      { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  totalMkt:      { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  gapCard:       { marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(226,75,74,0.08)', borderWidth: 1, borderColor: 'rgba(226,75,74,0.15)', borderRadius: 24, padding: 18 },
  gapTitle:      { fontSize: 15, fontWeight: '800', color: COLORS.danger, marginBottom: 12 },
  gapRow:        { flexDirection: 'row', alignItems: 'center' },
  gapItem:       { flex: 1, alignItems: 'center' },
  gapAmt:        { fontSize: 20, fontWeight: '900', color: COLORS.danger, letterSpacing: -0.5 },
  gapPer:        { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  gapDiv:        { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },
  infoSection:   { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  infoCard:      { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 14, alignItems: 'center' },
  infoIcon:      { fontSize: 24, marginBottom: 6 },
  infoLabel:     { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoVal:       { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
  infoDetail:    { fontSize: 11, color: 'rgba(255,255,255,0.25)' },
  ctaSection:    { paddingHorizontal: 20, gap: 12 },
  ctaVagas:      { backgroundColor: 'rgba(23,200,232,0.12)', borderWidth: 1.5, borderColor: 'rgba(23,200,232,0.3)', borderRadius: 28, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaVagasTxt:   { color: COLORS.secondary, fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },
  ctaShare:      { backgroundColor: COLORS.primary, borderRadius: 28, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaShareTxt:   { color: COLORS.dark, fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
});
