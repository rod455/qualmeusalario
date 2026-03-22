// app/(tabs)/tracker.tsx
// Tracker — blurred preview + rewarded ad para desbloquear
// Após assistir, mostra conteúdo completo do tracker

import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, ADMOB } from '../../lib/constants';
import AdBanner from '../../components/AdBanner';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { fmtBRL } from '../../lib/salary';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const IS_DEV = __DEV__;
const REWARDED_ID = IS_DEV
  ? TestIds.REWARDED
  : Platform.OS === 'ios'
    ? ADMOB.REWARDED_IOS
    : ADMOB.REWARDED_ANDROID;

export default function TrackerScreen() {
  const result = useOnboardingStore(s => s.result);
  const [unlocked, setUnlocked] = useState(false);
  const [adReady, setAdReady]   = useState(false);
  const adRef       = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);
  const listenersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    loadAd();
    return () => {
      listenersRef.current.forEach(fn => fn());
      listenersRef.current = [];
    };
  }, []);

  function loadAd() {
    try {
      const ad = RewardedAd.createForAdRequest(REWARDED_ID, {
        keywords: ['salario', 'carreira', 'mercado trabalho', 'curso online'],
      });
      adRef.current = ad;

      const u1 = ad.addAdEventListener(RewardedAdEventType.LOADED, () => setAdReady(true));
      const u2 = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => setUnlocked(true));
      const u3 = ad.addAdEventListener(AdEventType.CLOSED, () => {
        setAdReady(false);
        // Se assistiu, desbloqueia mesmo que feche antes
        setUnlocked(true);
      });
      const u4 = ad.addAdEventListener(AdEventType.ERROR, () => {
        setAdReady(false);
        setTimeout(() => loadAd(), 5000);
      });

      listenersRef.current = [u1, u2, u3, u4];
      ad.load();
    } catch {}
  }

  function handleUnlock() {
    if (adReady && adRef.current) {
      try { adRef.current.show(); } catch { setUnlocked(true); }
    } else {
      // Se ad não carregou, desbloqueia grátis (não tranca o usuário)
      setUnlocked(true);
    }
  }

  const ab = (result?.diff ?? 0) >= 0;
  const mktTotal = result?.mkt?.total ?? 0;
  const myTotal = result?.my?.total ?? 0;

  // Dados simulados de projeção para preview
  const months = ['Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez','Jan','Fev','Mar'];
  const projections = months.map((m, i) => {
    const growth = 1 + (i * 0.008); // ~0.8% ao mês
    return { month: m, mkt: Math.round(mktTotal * growth), my: myTotal };
  });

  if (!result) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
        <AdBanner />
        <View style={s.emptyWrap}>
          <Text style={s.emptyEmoji}>📊</Text>
          <Text style={s.emptyTitle}>Nenhuma análise ainda</Text>
          <Text style={s.emptyTxt}>Faça sua primeira análise para ver a projeção salarial.</Text>
          <TouchableOpacity style={s.emptyCta} onPress={() => router.replace('/(onboarding)/cargo')}>
            <Text style={s.emptyCtaTxt}>Calcular agora →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <AdBanner />

      {!unlocked ? (
        /* ─── ESTADO BLOQUEADO: preview com blur ─── */
        <View style={s.lockedWrap}>
          {/* Preview borrado */}
          <View style={s.blurredPreview}>
            <View style={s.previewHeader}>
              <Text style={s.previewTitle}>📈 Projeção salarial</Text>
              <Text style={s.previewSub}>Próximos 12 meses</Text>
            </View>

            {/* Barras borradas simuladas */}
            {[0.65, 0.72, 0.78, 0.83, 0.88, 0.92].map((w, i) => (
              <View key={i} style={s.barRow}>
                <Text style={s.barLabel}>████</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${w * 100}%` }]} />
                </View>
                <Text style={s.barVal}>██████</Text>
              </View>
            ))}

            {/* Overlay de blur */}
            <View style={s.blurOverlay}>
              <View style={s.lockBadge}>
                <Text style={s.lockIcon}>🔒</Text>
              </View>
            </View>
          </View>

          {/* Info + CTA */}
          <Text style={s.lockedTitle}>Desbloqueie o Tracker</Text>
          <Text style={s.lockedSub}>
            Assista um breve anúncio para ver sua projeção salarial, histórico e metas.
          </Text>

          <View style={s.perks}>
            {[
              { icon:'📊', text:'Histórico de análises salvo' },
              { icon:'🔔', text:'Alertas de variação do mercado' },
              { icon:'📈', text:'Projeção dos próximos 12 meses' },
              { icon:'🎯', text:'Metas salariais personalizadas' },
            ].map(p => (
              <View key={p.text} style={s.perk}>
                <View style={s.perkIcon}><Text>{p.icon}</Text></View>
                <Text style={s.perkTxt}>{p.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={[s.unlockBtn, adReady && s.unlockBtnReady]} onPress={handleUnlock}>
            <Text style={s.unlockBtnTxt}>
              {adReady ? '🎬  Assistir anúncio para desbloquear' : '⏳  Carregando anúncio...'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ─── ESTADO DESBLOQUEADO: conteúdo real ─── */
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.content}>
            {/* Header */}
            <View style={s.header}>
              <Text style={s.headerTitle}>📈 Sua projeção salarial</Text>
              <Text style={s.headerSub}>
                {result.cargo.split('(')[0].trim()} • {result.cidade.nome}
              </Text>
            </View>

            {/* Resumo */}
            <View style={s.summaryCard}>
              <View style={s.summaryRow}>
                <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Seu salário</Text>
                  <Text style={s.summaryVal}>{fmtBRL(myTotal)}</Text>
                </View>
                <View style={s.summaryDiv} />
                <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Mercado</Text>
                  <Text style={s.summaryVal}>{fmtBRL(mktTotal)}</Text>
                </View>
                <View style={s.summaryDiv} />
                <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Gap</Text>
                  <Text style={[s.summaryPct, ab ? s.green : s.red]}>
                    {ab ? '+' : ''}{result.diff}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Projeção mensal */}
            <Text style={s.sectionTitle}>Projeção de mercado — 12 meses</Text>
            <View style={s.projCard}>
              {projections.map((p, i) => {
                const maxVal = Math.max(...projections.map(x => x.mkt), myTotal) * 1.1;
                const mktW = (p.mkt / maxVal) * 100;
                const myW = (p.my / maxVal) * 100;
                return (
                  <View key={p.month} style={s.projRow}>
                    <Text style={s.projMonth}>{p.month}</Text>
                    <View style={s.projBars}>
                      <View style={[s.projBar, s.projBarMkt, { width: `${mktW}%` }]} />
                      <View style={[s.projBar, s.projBarMy, { width: `${myW}%` }]} />
                    </View>
                    <Text style={s.projVal}>{fmtBRL(p.mkt)}</Text>
                  </View>
                );
              })}
              <View style={s.projLegend}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: COLORS.secondary }]} />
                  <Text style={s.legendTxt}>Mercado</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={s.legendTxt}>Seu salário</Text>
                </View>
              </View>
            </View>

            {/* CTA criar conta */}
            <View style={s.ctaCard}>
              <Text style={s.ctaCardTitle}>Salve seu histórico 📊</Text>
              <Text style={s.ctaCardSub}>Crie uma conta para receber alertas mensais e salvar suas análises.</Text>
              <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/cadastro')}>
                <Text style={s.ctaBtnTxt}>Criar conta grátis →</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 24 }} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.dark },

  // Empty state
  emptyWrap:    { flex:1, alignItems:'center', justifyContent:'center', padding:32, gap:12 },
  emptyEmoji:   { fontSize:48 },
  emptyTitle:   { fontSize:22, fontWeight:'800', color:'#fff' },
  emptyTxt:     { fontSize:14, color:'rgba(255,255,255,0.4)', textAlign:'center' },
  emptyCta:     { backgroundColor:COLORS.primary, borderRadius:28, paddingHorizontal:28, paddingVertical:14, marginTop:8 },
  emptyCtaTxt:  { color:COLORS.dark, fontWeight:'800', fontSize:15 },

  // Locked state
  lockedWrap:   { flex:1, paddingHorizontal:20, paddingTop:12, alignItems:'center' },
  blurredPreview:{ width:'100%', backgroundColor:COLORS.surface, borderRadius:20, padding:16, marginBottom:20, overflow:'hidden', position:'relative' },
  previewHeader:{ marginBottom:12 },
  previewTitle: { fontSize:16, fontWeight:'800', color:'rgba(255,255,255,0.2)' },
  previewSub:   { fontSize:12, color:'rgba(255,255,255,0.1)', marginTop:2 },
  barRow:       { flexDirection:'row', alignItems:'center', marginBottom:8, gap:8 },
  barLabel:     { fontSize:11, color:'rgba(255,255,255,0.08)', width:36 },
  barTrack:     { flex:1, height:8, backgroundColor:'rgba(255,255,255,0.04)', borderRadius:4 },
  barFill:      { height:8, backgroundColor:'rgba(23,200,232,0.15)', borderRadius:4 },
  barVal:       { fontSize:11, color:'rgba(255,255,255,0.08)', width:56 },
  blurOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(11,24,56,0.7)', alignItems:'center', justifyContent:'center', borderRadius:20 },
  lockBadge:    { width:56, height:56, borderRadius:16, backgroundColor:'rgba(245,168,32,0.2)', alignItems:'center', justifyContent:'center' },
  lockIcon:     { fontSize:28 },
  lockedTitle:  { fontSize:22, fontWeight:'900', color:'#fff', textAlign:'center', marginBottom:8 },
  lockedSub:    { fontSize:14, color:'rgba(255,255,255,0.45)', textAlign:'center', lineHeight:22, marginBottom:20, paddingHorizontal:12 },
  perks:        { width:'100%', gap:12, marginBottom:24 },
  perk:         { flexDirection:'row', alignItems:'center', gap:12 },
  perkIcon:     { width:36, height:36, borderRadius:10, backgroundColor:'rgba(255,255,255,0.06)', alignItems:'center', justifyContent:'center' },
  perkTxt:      { fontSize:14, color:'rgba(255,255,255,0.7)', fontWeight:'500', flex:1 },
  unlockBtn:    { width:'100%', backgroundColor:'rgba(255,255,255,0.08)', borderRadius:28, height:54, alignItems:'center', justifyContent:'center' },
  unlockBtnReady:{ backgroundColor:COLORS.primary },
  unlockBtnTxt: { color:'#fff', fontSize:16, fontWeight:'900', letterSpacing:-0.3 },

  // Unlocked state
  scroll:       { flex:1 },
  content:      { paddingHorizontal:20, paddingTop:12 },
  header:       { marginBottom:16 },
  headerTitle:  { fontSize:22, fontWeight:'900', color:'#fff', letterSpacing:-0.5 },
  headerSub:    { fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:4 },

  summaryCard:  { backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.07)', borderRadius:20, padding:16, marginBottom:20 },
  summaryRow:   { flexDirection:'row', alignItems:'center' },
  summaryItem:  { flex:1, alignItems:'center' },
  summaryDiv:   { width:1, height:36, backgroundColor:'rgba(255,255,255,0.08)' },
  summaryLabel: { fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 },
  summaryVal:   { fontSize:16, fontWeight:'800', color:'#fff' },
  summaryPct:   { fontSize:20, fontWeight:'900' },
  green:        { color:COLORS.success },
  red:          { color:COLORS.danger },

  sectionTitle: { fontSize:14, fontWeight:'700', color:'rgba(255,255,255,0.5)', marginBottom:12 },
  projCard:     { backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.07)', borderRadius:20, padding:16, marginBottom:20 },
  projRow:      { flexDirection:'row', alignItems:'center', marginBottom:10, gap:8 },
  projMonth:    { fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.35)', width:28 },
  projBars:     { flex:1, height:12, position:'relative' },
  projBar:      { position:'absolute', height:6, borderRadius:3 },
  projBarMkt:   { backgroundColor:COLORS.secondary, top:0 },
  projBarMy:    { backgroundColor:COLORS.primary, top:6, opacity:0.6 },
  projVal:      { fontSize:10, color:'rgba(255,255,255,0.3)', width:60, textAlign:'right' },
  projLegend:   { flexDirection:'row', justifyContent:'center', gap:20, marginTop:8, paddingTop:10, borderTopWidth:0.5, borderTopColor:'rgba(255,255,255,0.07)' },
  legendItem:   { flexDirection:'row', alignItems:'center', gap:6 },
  legendDot:    { width:8, height:8, borderRadius:4 },
  legendTxt:    { fontSize:11, color:'rgba(255,255,255,0.35)' },

  ctaCard:      { backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.07)', borderRadius:20, padding:20, alignItems:'center' },
  ctaCardTitle: { fontSize:16, fontWeight:'800', color:'#fff', marginBottom:6 },
  ctaCardSub:   { fontSize:13, color:'rgba(255,255,255,0.4)', textAlign:'center', lineHeight:20, marginBottom:16 },
  ctaBtn:       { backgroundColor:COLORS.primary, borderRadius:28, paddingHorizontal:28, paddingVertical:14 },
  ctaBtnTxt:    { color:COLORS.dark, fontWeight:'900', fontSize:15 },
});
