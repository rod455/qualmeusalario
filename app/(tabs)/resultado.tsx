import { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useRouter } from 'expo-router';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { fmtBRL } from '../../lib/salary';
import { COLORS } from '../../lib/constants';

function Bar({ label, myVal, mktVal, max }: { label:string; myVal:number; mktVal:number; max:number }) {
  const myW  = useRef(new Animated.Value(0)).current;
  const mktW = useRef(new Animated.Value(0)).current;
  const above = myVal >= mktVal;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(myW,  { toValue:(myVal/max)*100,  duration:700, useNativeDriver:false }),
      Animated.timing(mktW, { toValue:(mktVal/max)*100, duration:700, useNativeDriver:false }),
    ]).start();
  }, []);

  return (
    <View style={br.wrap}>
      <View style={br.head}>
        <Text style={br.label}>{label}</Text>
        <View style={br.vals}>
          <Text style={[br.my, above && br.green]}>{fmtBRL(myVal)}</Text>
          <Text style={br.vs}>vs</Text>
          <Text style={br.mkt}>{fmtBRL(mktVal)} mkt</Text>
        </View>
      </View>
      <View style={br.track}>
        <Animated.View style={[br.barMkt, { width: mktW.interpolate({inputRange:[0,100],outputRange:['0%','100%']}) }]} />
        <Animated.View style={[br.barMy, above && br.barGreen, { width: myW.interpolate({inputRange:[0,100],outputRange:['0%','100%']}) }]} />
      </View>
    </View>
  );
}

const br = StyleSheet.create({
  wrap:   { marginBottom:14 },
  head:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:7 },
  label:  { fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:'600' },
  vals:   { flexDirection:'row', alignItems:'center', gap:6 },
  my:     { fontSize:13, fontWeight:'700', color:COLORS.danger },
  green:  { color:COLORS.success },
  vs:     { fontSize:11, color:'rgba(255,255,255,0.25)' },
  mkt:    { fontSize:11, color:'rgba(255,255,255,0.35)' },
  track:  { height:6, backgroundColor:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' },
  barMkt: { position:'absolute', height:6, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:3 },
  barMy:  { position:'absolute', height:6, backgroundColor:COLORS.danger, borderRadius:3 },
  barGreen:{ backgroundColor:COLORS.success },
});

export default function ResultadoScreen() {
  const result = useOnboardingStore(s => s.result);
  const reset  = useOnboardingStore(s => s.reset);

  if (!result) {
    return (
      <SafeAreaView style={s.empty}>
        <Text style={s.emptyTxt}>Nenhuma análise disponível</Text>
        <TouchableOpacity style={s.emptyBtn} onPress={() => router.replace('/(onboarding)/cargo')}>
          <Text style={s.emptyBtnTxt}>Calcular agora →</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const ab = result.diff >= 0;
  const maxV = Math.max(result.my.total, result.mkt.total) * 1.1;
  const cidadeStr = result.isNomad ? 'Nomad Digital ✈️' : `${result.cidade.nome}, ${result.cidade.uf}`;

  const ROWS = [
    { label:'Salário fixo', my:result.my.fixo,  mkt:result.mkt.fixo  },
    { label:'Comissão',     my:result.my.com,   mkt:result.mkt.com,  skip: result.my.com===0 && result.mkt.com===0 },
    { label:'PLR / Bônus',  my:result.my.plr,   mkt:result.mkt.plr,  skip: result.my.plr===0 && result.mkt.plr===0 },
    { label:'VR / VA',      my:result.my.vr,    mkt:result.mkt.vr,   skip: result.my.vr===0  && result.mkt.vr===0  },
    { label:'Outros',       my:result.my.out,   mkt:result.mkt.out,  skip: result.my.out===0 && result.mkt.out===0 },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => { reset(); router.replace('/(onboarding)/cargo'); }}>
          <Text style={s.refazer}>← Refazer</Text>
        </TouchableOpacity>
        <Text style={s.logoName}>Quanto Ganha!</Text>
        <View style={{width:70}} />
      </View>

      <ScrollView>
        <View style={s.hero}>
          <View style={s.tagRow}>
            <View style={s.tagGreen}><Text style={s.tagGreenTxt}>{result.cargo.split('(')[0].trim()}</Text></View>
            <View style={s.tagGray}><Text style={s.tagGrayTxt}>{cidadeStr}</Text></View>
          </View>
          <View style={s.verdictRow}>
            <Text style={[s.vpct, ab ? s.green : s.red]}>{ab?'+':''}{result.diff}%</Text>
            <Text style={s.vdesc}>{ab?'acima':'abaixo'} do mercado</Text>
          </View>
          {ROWS.filter(r => !r.skip).map(r => (
            <Bar key={r.label} label={r.label} myVal={r.my} mktVal={r.mkt} max={maxV} />
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total mensal</Text>
            <View>
              <Text style={[s.totalYou, ab ? s.green : s.red]}>{fmtBRL(result.my.total)}</Text>
              <Text style={s.totalMkt}>Mercado: {fmtBRL(result.mkt.total)}</Text>
            </View>
          </View>
        </View>

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

        <View style={s.ctaSection}>
          <TouchableOpacity style={s.ctaShare}>
            <Text style={s.ctaShareTxt}>🎬  Gerar card para TikTok</Text>
          </TouchableOpacity>
          <View style={s.ctaRow}>
            <TouchableOpacity style={s.ctaSec} onPress={() => router.push('/(tabs)/vagas')}>
              <Text style={s.ctaSecTxt}>💼 Vagas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ctaSec} onPress={() => router.push('/(tabs)/negociacao')}>
              <Text style={s.ctaSecTxt}>🎯 Negociar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex:1, backgroundColor:COLORS.dark },
  empty:      { flex:1, backgroundColor:COLORS.dark, alignItems:'center', justifyContent:'center', gap:16 },
  emptyTxt:   { fontSize:16, color:'rgba(255,255,255,0.5)' },
  emptyBtn:   { backgroundColor:COLORS.primary, borderRadius:28, paddingHorizontal:24, paddingVertical:12 },
  emptyBtnTxt:{ color:COLORS.dark, fontWeight:'700', fontSize:14 },
  topbar:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:22, paddingTop:14, paddingBottom:12, borderBottomWidth:0.5, borderBottomColor:'rgba(255,255,255,0.08)' },
  refazer:    { fontSize:14, fontWeight:'500', color:COLORS.primary },
  logoName:   { fontSize:13, fontWeight:'700', color:'#fff' },
  hero:       { padding:20, borderBottomWidth:0.5, borderBottomColor:'rgba(255,255,255,0.08)' },
  tagRow:     { flexDirection:'row', flexWrap:'wrap', gap:7, marginBottom:14 },
  tagGreen:   { backgroundColor:'rgba(245,168,32,0.15)', borderRadius:20, paddingHorizontal:11, paddingVertical:4 },
  tagGreenTxt:{ fontSize:12, fontWeight:'600', color:COLORS.primary },
  tagGray:    { backgroundColor:'rgba(255,255,255,0.07)', borderRadius:20, paddingHorizontal:11, paddingVertical:4 },
  tagGrayTxt: { fontSize:12, fontWeight:'600', color:'rgba(255,255,255,0.5)' },
  verdictRow: { flexDirection:'row', alignItems:'flex-end', gap:14, marginBottom:20 },
  vpct:       { fontSize:52, fontWeight:'800', lineHeight:56, letterSpacing:-1 },
  red:        { color:COLORS.danger },
  green:      { color:COLORS.success },
  vdesc:      { fontSize:15, color:'rgba(255,255,255,0.45)', lineHeight:22, paddingBottom:6 },
  totalRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:14, borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.08)' },
  totalLabel: { fontSize:14, fontWeight:'700', color:'#fff' },
  totalYou:   { fontSize:18, fontWeight:'800' },
  totalMkt:   { fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:2 },
  gapCard:    { margin:16, backgroundColor:'rgba(226,75,74,0.08)', borderWidth:1, borderColor:'rgba(226,75,74,0.2)', borderRadius:16, padding:16 },
  gapTitle:   { fontSize:14, fontWeight:'700', color:COLORS.danger, marginBottom:12 },
  gapRow:     { flexDirection:'row' },
  gapItem:    { flex:1, alignItems:'center' },
  gapDiv:     { width:1, backgroundColor:'rgba(226,75,74,0.2)' },
  gapAmt:     { fontSize:20, fontWeight:'800', color:COLORS.danger },
  gapPer:     { fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:3 },
  ctaSection: { padding:16, gap:10 },
  ctaShare:   { backgroundColor:COLORS.primary, borderRadius:28, padding:16, alignItems:'center' },
  ctaShareTxt:{ color:COLORS.dark, fontSize:15, fontWeight:'800' },
  ctaRow:     { flexDirection:'row', gap:10 },
  ctaSec:     { flex:1, backgroundColor:'rgba(255,255,255,0.06)', borderWidth:1, borderColor:'rgba(255,255,255,0.1)', borderRadius:14, padding:14, alignItems:'center' },
  ctaSecTxt:  { fontSize:14, fontWeight:'700', color:'#fff' },
});
