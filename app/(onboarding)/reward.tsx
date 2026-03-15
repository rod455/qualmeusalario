import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { computeSalaryResult, fmtBRL } from '../../lib/salary';
import { COLORS } from '../../lib/constants';
import { saveAnalysis } from '../../lib/supabase';

// Em produção usa o ID real; em dev usa o ID de teste do AdMob
const IS_DEV = __DEV__;
const AD_UNIT_ID = IS_DEV
  ? TestIds.REWARDED
  : (Constants.expoConfig?.extra?.admobRewardedAndroid as string);

const rewarded = RewardedAd.createForAdRequest(AD_UNIT_ID, {
  requestNonPersonalizedAdsOnly: false,
});

export default function RewardScreen() {
  const store  = useOnboardingStore();
  const [secsLeft, setSecsLeft]       = useState(30);
  const [adDone, setAdDone]           = useState(false);
  const [previewReveal, setReveal]    = useState(false);
  const [adLoaded, setAdLoaded]       = useState(false);
  const [adError, setAdError]         = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const intervalRef  = useRef<ReturnType<typeof setInterval>>();

  // ── Calcula resultado ────────────────────────────────────────────────────
  const result = computeSalaryResult({
    cargo:     store.cargo,
    area:      store.area,
    cidade:    store.cidade!,
    workModel: store.workModel,
    exp:       store.exp,
    salario:   store.salario,
    extras:    store.extras,
  });

  // ── Salva resultado no store e Supabase ──────────────────────────────────
  useEffect(() => {
    store.setResult(result);
    saveAnalysis({
      cargo: result.cargo, area: result.area ?? '',
      cidade: result.cidade.nome, uf: result.cidade.uf,
      is_nomad: result.isNomad, work_model: result.workModel,
      exp_years: result.exp, salary_fixo: result.my.fixo,
      salary_total: result.my.total, market_total: result.mkt.total,
      diff_pct: result.diff, diff_mes: result.diffMes, diff_ano: result.diffAno,
    });
  }, []);

  // ── AdMob Rewarded ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubLoaded  = rewarded.addAdEventListener(AdEventType.LOADED, () => setAdLoaded(true));
    const unsubError   = rewarded.addAdEventListener(AdEventType.ERROR,  () => { setAdError(true); startFallback(); });
    const unsubClosed  = rewarded.addAdEventListener(AdEventType.CLOSED, onAdDone);
    const unsubEarned  = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, onAdDone);

    rewarded.load();

    return () => { unsubLoaded(); unsubError(); unsubClosed(); unsubEarned(); };
  }, []);

  // Mostra o ad assim que carregar
  useEffect(() => {
    if (adLoaded) {
      rewarded.show().catch(() => startFallback());
    }
  }, [adLoaded]);

  // ── Fallback countdown 30s (se ad falhar ou não carregar) ─────────────────
  function startFallback() {
    Animated.timing(progressAnim, {
      toValue: 1, duration: 30000, useNativeDriver: false,
    }).start();

    let t = 30;
    intervalRef.current = setInterval(() => {
      t--;
      setSecsLeft(t);
      if (t <= 12) setReveal(true);
      if (t <= 0)  { clearInterval(intervalRef.current); onAdDone(); }
    }, 1000);
  }

  function onAdDone() {
    clearInterval(intervalRef.current);
    setAdDone(true);
    setReveal(true);
  }

  function goResult() {
    router.replace('/(tabs)/resultado');
  }

  const ab = result.diff >= 0;

  return (
    <SafeAreaView style={s.safe}>

      {/* Topbar */}
      <View style={s.topbar}>
        <View style={s.logoRow}>
          <View style={s.logoIcon}><Text style={s.logoIconText}>$</Text></View>
          <Text style={s.logoName}>Qual Meu Salário?</Text>
        </View>
        <Text style={s.adNotice}>Anúncio</Text>
      </View>

      {/* Teaser */}
      <View style={s.teaser}>
        <View style={s.badge}><Text style={s.badgeText}>🔍 ANÁLISE EM ANDAMENTO</Text></View>
        <Text style={s.teaserTitle}>
          Analisando {store.cargo.split('(')[0].trim()} em {store.cidade?.nome}
        </Text>
        <Text style={s.teaserSub}>Assista o anúncio e libere o resultado completo</Text>
      </View>

      {/* Preview card — borrado até reveal */}
      <View style={s.previewCard}>
        <Text style={s.previewEyebrow}>SEU RESULTADO MOSTRARÁ</Text>
        <Text style={[s.previewBig, { opacity: previewReveal ? 1 : 0.1 }]}>
          {ab ? '+' : ''}{result.diff}%
        </Text>
        <Text style={s.previewDesc}>
          {ab ? 'acima' : 'abaixo'} do mercado para o seu cargo
        </Text>
        <View style={s.divider} />
        <View style={s.previewRow}>
          <Text style={s.previewLabel}>Diferença mensal</Text>
          <Text style={[s.previewVal, { opacity: previewReveal ? 1 : 0.1 }]}>
            {fmtBRL(result.diffMes)}
          </Text>
        </View>
        <View style={s.previewRow}>
          <Text style={s.previewLabel}>Diferença anual</Text>
          <Text style={[s.previewVal, { opacity: previewReveal ? 1 : 0.1 }]}>
            {fmtBRL(result.diffAno)}
          </Text>
        </View>
      </View>

      {/* ── ESPAÇO DO AD ──
          O AdMob mostra o anúncio como overlay fullscreen nativo.
          Este bloco só aparece como fallback quando o ad falha.
       ── */}
      {(adError || !adLoaded) && !adDone && (
        <View style={s.adFallback}>
          <Text style={s.adSponsored}>Patrocinado</Text>
          <Text style={s.adFallbackText}>Carregando anúncio...</Text>
          <View style={s.skipBadge}>
            <Text style={s.skipText}>{secsLeft}s</Text>
          </View>
        </View>
      )}

      {/* Progress */}
      {!adDone && (
        <View style={s.progressSection}>
          <View style={s.progressTop}>
            <Text style={s.progressLabel}>Preparando seu resultado...</Text>
            <Text style={s.progressSecs}>{secsLeft}</Text>
          </View>
          <View style={s.progressBg}>
            <Animated.View
              style={[s.progressFill, {
                width: progressAnim.interpolate({
                  inputRange: [0, 1], outputRange: ['0%', '100%'],
                }),
              }]}
            />
          </View>
        </View>
      )}

      {/* CTA — aparece quando ad conclui */}
      {adDone && (
        <View style={s.ctaSection}>
          <TouchableOpacity style={s.ctaBtn} onPress={goResult}>
            <Text style={s.ctaBtnText}>Ver meu resultado agora →</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex:1, backgroundColor:'#0a0a0a' },
  topbar:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:22, paddingTop:20, paddingBottom:16 },
  logoRow:       { flexDirection:'row', alignItems:'center', gap:9 },
  logoIcon:      { width:32, height:32, backgroundColor:COLORS.primary, borderRadius:9, alignItems:'center', justifyContent:'center' },
  logoIconText:  { color:'#fff', fontWeight:'800', fontSize:15 },
  logoName:      { fontSize:14, fontWeight:'700', color:'rgba(255,255,255,0.7)' },
  adNotice:      { fontSize:11, fontWeight:'600', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:0.5 },
  teaser:        { paddingHorizontal:22 },
  badge:         { alignSelf:'flex-start', backgroundColor:'rgba(29,158,117,0.15)', borderRadius:20, paddingHorizontal:12, paddingVertical:5, marginBottom:14 },
  badgeText:     { color:COLORS.primary, fontSize:12, fontWeight:'700', letterSpacing:0.5 },
  teaserTitle:   { fontSize:22, fontWeight:'800', color:'#fff', lineHeight:28, letterSpacing:-0.4, marginBottom:7 },
  teaserSub:     { fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:20 },
  previewCard:   { margin:18, marginHorizontal:22, backgroundColor:'rgba(255,255,255,0.04)', borderWidth:1, borderColor:'rgba(255,255,255,0.08)', borderRadius:18, padding:18 },
  previewEyebrow:{ fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 },
  previewBig:    { fontSize:44, fontWeight:'800', color:'#E24B4A', letterSpacing:-1, lineHeight:48, marginBottom:4 },
  previewDesc:   { fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:14 },
  divider:       { height:0.5, backgroundColor:'rgba(255,255,255,0.08)', marginVertical:10 },
  previewRow:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:9 },
  previewLabel:  { fontSize:13, color:'rgba(255,255,255,0.4)' },
  previewVal:    { fontSize:14, fontWeight:'700', color:'rgba(255,255,255,0.8)' },
  adFallback:    { marginHorizontal:22, height:90, backgroundColor:'rgba(255,255,255,0.05)', borderWidth:1, borderColor:'rgba(255,255,255,0.09)', borderRadius:12, alignItems:'center', justifyContent:'center', position:'relative' },
  adSponsored:   { position:'absolute', top:8, left:12, fontSize:10, color:'rgba(255,255,255,0.16)', fontWeight:'600', textTransform:'uppercase', letterSpacing:0.5 },
  adFallbackText:{ fontSize:12, color:'rgba(255,255,255,0.18)' },
  skipBadge:     { position:'absolute', top:8, right:12, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:20, paddingHorizontal:10, paddingVertical:4 },
  skipText:      { fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.4)' },
  progressSection:{ paddingHorizontal:22, paddingTop:14 },
  progressTop:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  progressLabel: { fontSize:13, color:'rgba(255,255,255,0.45)', fontWeight:'500' },
  progressSecs:  { fontSize:20, fontWeight:'800', color:COLORS.primary, letterSpacing:-0.5 },
  progressBg:    { height:5, backgroundColor:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' },
  progressFill:  { height:'100%', backgroundColor:COLORS.primary, borderRadius:3 },
  ctaSection:    { marginHorizontal:22, marginTop:'auto', paddingTop:16, paddingBottom:32 },
  ctaBtn:        { backgroundColor:COLORS.primary, borderRadius:14, padding:16, alignItems:'center' },
  ctaBtnText:    { color:'#fff', fontSize:16, fontWeight:'800', letterSpacing:-0.2 },
});
