import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { computeSalaryResult, fmtBRL } from '../../lib/salary';
import { COLORS } from '../../lib/constants';
import { saveAnalysis } from '../../lib/supabase';

const IS_DEV = __DEV__;
const AD_UNIT_ID = IS_DEV
  ? TestIds.REWARDED
  : (Constants.expoConfig?.extra?.admobRewardedAndroid as string);

let rewarded: ReturnType<typeof RewardedAd.createForAdRequest> | null = null;
try {
  rewarded = RewardedAd.createForAdRequest(AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: false,
  });
} catch { rewarded = null; }

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
    tryLoadAd();
  }, []);

  function tryLoadAd() {
    if (!rewarded) return;
    try {
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        try { rewarded?.show(); } catch {}
      });
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, onAdDone);
      rewarded.load();
    } catch {}
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
    router.replace('/(tabs)/resultado');
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

        {/* Preview sempre bloqueado */}
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
            <Text style={s.lockTxt}>🔒 Resultado liberado ao concluir</Text>
          </View>
        </View>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex:1, backgroundColor:COLORS.dark },
  topbar:         { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:14, paddingBottom:10 },
  logoRow:        { flexDirection:'row', alignItems:'center', gap:8 },
  logoImg:        { width:30, height:30, borderRadius:8 },
  logoName:       { fontSize:14, fontWeight:'700', color:'rgba(255,255,255,0.8)' },
  body:           { flex:1, paddingHorizontal:20, paddingTop:8, gap:14 },
  calcIconWrap:   { width:52, height:52, borderRadius:14, backgroundColor:'rgba(245,168,32,0.12)', borderWidth:1, borderColor:'rgba(245,168,32,0.2)', alignItems:'center', justifyContent:'center' },
  calcIcon:       { fontSize:24 },
  title:          { fontSize:26, fontWeight:'900', color:'#fff', letterSpacing:-0.7, lineHeight:32 },
  subtitle:       { fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:-6 },
  stepCard:       { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'rgba(255,255,255,0.05)', borderWidth:1, borderColor:'rgba(255,255,255,0.08)', borderRadius:12, paddingHorizontal:14, paddingVertical:11 },
  stepDot:        { width:8, height:8, borderRadius:4, backgroundColor:COLORS.primary, flexShrink:0 },
  stepTxt:        { fontSize:13, color:'rgba(255,255,255,0.6)', flex:1 },
  progressWrap:   { gap:7 },
  progressBg:     { height:5, backgroundColor:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' },
  progressFill:   { height:'100%', backgroundColor:COLORS.primary, borderRadius:3 },
  progressLabels: { flexDirection:'row', justifyContent:'space-between' },
  progressPct:    { fontSize:12, color:'rgba(255,255,255,0.35)' },
  progressSecs:   { fontSize:12, fontWeight:'700', color:COLORS.primary },
  previewCard:    { backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.08)', borderRadius:20, padding:16 },
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
