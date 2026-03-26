// app/(onboarding)/reward.tsx
// Tela de loading + rewarded ad — exibe automaticamente ao entrar
// Fix: usa ADMOB centralizado + cleanup de listeners

import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { computeSalaryResult, fmtBRL } from '../../lib/salary';
import { COLORS, ADMOB } from '../../lib/constants';
import { saveAnalysis } from '../../lib/supabase';

const IS_DEV = __DEV__;
const AD_UNIT_ID = IS_DEV
  ? TestIds.REWARDED
  : Platform.OS === 'ios'
    ? ADMOB.REWARDED_IOS
    : ADMOB.REWARDED_ANDROID;

const STEPS = [
  { label: 'Buscando dados do CAGED 2024...',        duration: 5000 },
  { label: 'Calculando benchmark para seu cargo...',  duration: 7000 },
  { label: 'Aplicando ajuste regional...',            duration: 6000 },
  { label: 'Comparando com 2.4M de registros...',    duration: 7000 },
  { label: 'Gerando seu relatório salarial...',       duration: 5000 },
];
const TOTAL_MS = 30000;

export default function RewardScreen() {
  const store = useOnboardingStore();
  const [stepIdx, setStepIdx]   = useState(0);
  const [secsLeft, setSecsLeft] = useState(30);
  const progressAnim  = useRef(new Animated.Value(0)).current;
  const stepAnim      = useRef(new Animated.Value(1)).current;
  const fallbackStarted = useRef(false);
  const intervalRef     = useRef<ReturnType<typeof setInterval>>();
  const listenersRef    = useRef<(() => void)[]>([]);
  const adRef           = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);

  const result = computeSalaryResult({
    cargo:     store.cargo,
    area:      store.area,
    cidade:    store.cidade!,
    workModel: store.workModel,
    exp:       store.exp,
    salario:   store.salario,
    extras:    store.extras,
  });

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

  useEffect(() => {
    startCountdown();
    loadAndShowAd();

    return () => {
      // Cleanup listeners ao desmontar
      clearInterval(intervalRef.current);
      listenersRef.current.forEach(fn => fn());
      listenersRef.current = [];
    };
  }, []);

  function loadAndShowAd() {
    try {
      const ad = RewardedAd.createForAdRequest(AD_UNIT_ID, {
        keywords: ['salario', 'emprego', 'carreira', 'vaga emprego', 'curso online'],
      });
      adRef.current = ad;

      const u1 = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        // Ad carregou — exibe imediatamente (sem botão)
        try { ad.show(); } catch {}
      });

      const u2 = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        // Reward concedido — pode navegar
        onAdDone();
      });

      const u3 = ad.addAdEventListener(AdEventType.CLOSED, () => {
        // Usuário fechou o ad — navega mesmo assim
        onAdDone();
      });

      const u4 = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Rewarded ad error:', error);
        // Em caso de erro, countdown fallback continua rodando
      });

      listenersRef.current = [u1, u2, u3, u4];
      ad.load();
    } catch (e) {
      console.log('Failed to create rewarded ad:', e);
    }
  }

  function startCountdown() {
    if (fallbackStarted.current) return;
    fallbackStarted.current = true;

    Animated.timing(progressAnim, {
      toValue: 1, duration: TOTAL_MS, useNativeDriver: false,
    }).start();

    let t = 30;
    intervalRef.current = setInterval(() => {
      t--;
      setSecsLeft(t);
      if (t <= 0) { clearInterval(intervalRef.current); onAdDone(); }
    }, 1000);

    let elapsed = 0;
    STEPS.forEach((step, i) => {
      setTimeout(() => {
        Animated.timing(stepAnim, { toValue:0, duration:250, useNativeDriver:true }).start(() => {
          setStepIdx(i);
          Animated.timing(stepAnim, { toValue:1, duration:350, useNativeDriver:true }).start();
        });
      }, elapsed);
      elapsed += step.duration;
    });
  }

  function onAdDone() {
    clearInterval(intervalRef.current);
    router.replace('/resultado');
  }

  const ab = result.diff >= 0;
  const pct = Math.round(((30 - secsLeft) / 30) * 100);

  return (
    <SafeAreaView style={s.safe}>

      {/* Topbar */}
      <View style={s.topbar}>
        <View style={s.logoRow}>
          <Image source={require('../../assets/images/icon.png')} style={s.logoImg} resizeMode="contain" />
          <Text style={s.logoName}>Quanto Ganha!</Text>
        </View>
      </View>

      <View style={s.body}>

        {/* Ícone */}
        <View style={s.calcIconWrap}>
          <Text style={s.calcIcon}>⚙️</Text>
        </View>

        <Text style={s.title}>Calculando{'\n'}seus dados...</Text>
        <Text style={s.subtitle}>Para {store.cargo.split('(')[0].trim()} em {store.cidade?.nome}</Text>

        {/* Etapa atual */}
        <Animated.View style={[s.stepCard, { opacity: stepAnim }]}>
          <View style={s.stepDot} />
          <Text style={s.stepTxt}>{STEPS[stepIdx]?.label}</Text>
        </Animated.View>

        {/* Progresso */}
        <View style={s.progressWrap}>
          <View style={s.progressBg}>
            <Animated.View style={[s.progressFill, {
              width: progressAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }),
            }]} />
          </View>
          <View style={s.progressLabels}>
            <Text style={s.progressPct}>{pct}% concluído</Text>
            <Text style={s.progressSecs}>{secsLeft}s</Text>
          </View>
        </View>

        {/* Preview bloqueado */}
        <View style={s.previewCard}>
          <Text style={s.previewEye}>SEU RESULTADO</Text>
          <View style={s.previewPctRow}>
            <View style={s.previewBlocked}>
              <Text style={s.previewBlockedTxt}>••••</Text>
            </View>
          </View>
          <Text style={s.previewDesc}>aguardando conclusão do cálculo</Text>
          <View style={s.divider} />
          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Diferença mensal</Text>
            <View style={s.previewValBlocked}><Text style={s.previewBlockSmall}>••••</Text></View>
          </View>
          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Diferença anual</Text>
            <View style={s.previewValBlocked}><Text style={s.previewBlockSmall}>••••</Text></View>
          </View>
          <View style={s.lockRow}>
            <Text style={s.lockTxt}>🔒 Resultado liberado ao final</Text>
          </View>
        </View>
      </View>

      {/* CTA fallback — caso o ad não carregue, mostra botão após 15s */}
      {secsLeft <= 15 && (
        <View style={s.ctaWrap}>
          <TouchableOpacity style={s.ctaBtn} onPress={onAdDone}>
            <Text style={s.ctaBtnTxt}>Ver resultado agora →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex:1, backgroundColor:COLORS.dark },
  topbar:         { flexDirection:'row', justifyContent:'center', alignItems:'center', paddingHorizontal:20, paddingTop:14, paddingBottom:10 },
  logoRow:        { flexDirection:'row', alignItems:'center', gap:8 },
  logoImg:        { width:28, height:28, borderRadius:7 },
  logoName:       { fontSize:14, fontWeight:'700', color:'#fff' },
  body:           { flex:1, paddingHorizontal:24, justifyContent:'center', alignItems:'center' },
  calcIconWrap:   { width:64, height:64, borderRadius:18, backgroundColor:'rgba(245,168,32,0.15)', alignItems:'center', justifyContent:'center', marginBottom:20 },
  calcIcon:       { fontSize:28 },
  title:          { fontSize:28, fontWeight:'900', color:'#fff', textAlign:'center', letterSpacing:-0.5, lineHeight:34, marginBottom:8 },
  subtitle:       { fontSize:14, color:'rgba(255,255,255,0.4)', textAlign:'center', marginBottom:24 },
  stepCard:       { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:COLORS.surface, borderRadius:12, paddingHorizontal:16, paddingVertical:10, marginBottom:20, width:'100%' },
  stepDot:        { width:8, height:8, borderRadius:4, backgroundColor:COLORS.primary },
  stepTxt:        { fontSize:13, color:'rgba(255,255,255,0.55)', fontWeight:'600', flex:1 },
  progressWrap:   { width:'100%', marginBottom:20 },
  progressBg:     { height:6, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:3 },
  progressFill:   { height:6, backgroundColor:COLORS.primary, borderRadius:3 },
  progressLabels: { flexDirection:'row', justifyContent:'space-between', marginTop:8 },
  progressPct:    { fontSize:12, fontWeight:'600', color:'rgba(255,255,255,0.35)' },
  progressSecs:   { fontSize:12, fontWeight:'700', color:COLORS.primary },
  previewCard:    { backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.08)', borderRadius:20, padding:16, width:'100%' },
  previewEye:     { fontSize:10, fontWeight:'700', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 },
  previewPctRow:  { marginBottom:6 },
  previewPct:     { fontSize:48, fontWeight:'900', letterSpacing:-1.5, lineHeight:52 },
  previewBlocked: { backgroundColor:'rgba(255,255,255,0.07)', borderRadius:10, paddingHorizontal:20, paddingVertical:10, alignSelf:'flex-start' },
  previewBlockedTxt:{ fontSize:28, fontWeight:'900', color:'rgba(255,255,255,0.15)', letterSpacing:4 },
  green:          { color:COLORS.success },
  red:            { color:COLORS.danger },
  previewDesc:    { fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:10 },
  divider:        { height:0.5, backgroundColor:'rgba(255,255,255,0.08)', marginBottom:10 },
  previewRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:7 },
  previewLabel:   { fontSize:12, color:'rgba(255,255,255,0.4)' },
  previewVal:     { fontSize:14, fontWeight:'800', color:'rgba(255,255,255,0.85)' },
  previewValBlocked:{ backgroundColor:'rgba(255,255,255,0.06)', borderRadius:6, paddingHorizontal:10, paddingVertical:3 },
  previewBlockSmall:{ fontSize:12, color:'rgba(255,255,255,0.15)', letterSpacing:3 },
  lockRow:        { marginTop:6, alignItems:'center' },
  lockTxt:        { fontSize:11, color:'rgba(255,255,255,0.2)' },
  ctaWrap:        { paddingHorizontal:20, paddingBottom:28, paddingTop:10 },
  ctaBtn:         { backgroundColor:COLORS.primary, borderRadius:28, height:52, alignItems:'center', justifyContent:'center' },
  ctaBtnTxt:      { color:COLORS.dark, fontSize:16, fontWeight:'900', letterSpacing:-0.3 },
});
