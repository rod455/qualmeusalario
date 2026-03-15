import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { COLORS } from '../../lib/constants';

type ExtraKey = 'com' | 'plr' | 'bon' | 'vr' | 'out';

const EXTRAS: { id: ExtraKey; label: string; icon: string; annual?: boolean }[] = [
  { id:'com', label:'Comissão', icon:'📈' },
  { id:'plr', label:'PLR',     icon:'🏆', annual:true },
  { id:'bon', label:'Bônus',   icon:'🎯', annual:true },
  { id:'vr',  label:'VR / VA', icon:'🍽️' },
  { id:'out', label:'Outros',  icon:'➕' },
];

const fmt = (n: number) => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

export default function SalarioScreen() {
  const { setSalario, setExtras, salario } = useOnboardingStore();
  const [activeExtras, setActiveExtras] = useState<Set<ExtraKey>>(new Set());
  const [vals, setVals] = useState<Record<ExtraKey,string>>({ com:'', plr:'', bon:'', vr:'', out:'' });

  const toggle = (id: ExtraKey) => {
    setActiveExtras(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const getNum = (id: ExtraKey) => activeExtras.has(id) ? parseFloat(vals[id]) || 0 : 0;

  const myTotal = salario
    + getNum('com')
    + getNum('plr') / 12
    + getNum('bon') / 12
    + getNum('vr')
    + getNum('out');

  const goNext = () => {
    setExtras({ com:getNum('com'), plr:getNum('plr'), bon:getNum('bon'), vr:getNum('vr'), out:getNum('out') });
    router.push('/(onboarding)/reward');
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Topbar */}
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={s.logoRow}>
          <Image source={require('../../assets/images/icon.png')} style={s.logoImg} resizeMode="contain" />
          <Text style={s.logoName}>Quanto Ganha!</Text>
        </View>
        <Text style={s.step}>3 de 3</Text>
      </View>
      <View style={s.progBg}><View style={[s.progFill, {width:'100%'}]} /></View>

      <ScrollView keyboardShouldPersistTaps="handled" style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <View style={s.badge}><Text style={s.badgeTxt}>💰 REMUNERAÇÃO</Text></View>
          <Text style={s.title} numberOfLines={1} adjustsFontSizeToFit>Qual é o seu salário atual?</Text>
          <Text style={s.sub}>Seus dados são 100% anônimos.</Text>

          {/* Input salário — compacto */}
          <Text style={s.label}>Salário fixo mensal</Text>
          <View style={s.salRow}>
            <Text style={s.salPrefix}>R$</Text>
            <TextInput
              style={s.salInput}
              value={salario > 0 ? String(salario) : ''}
              onChangeText={t => setSalario(parseFloat(t.replace(/\D/g,'')) || 0)}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="numeric"
            />
            {salario > 0 && (
              <Text style={s.salAno}>{fmt(salario * 12)}/ano</Text>
            )}
          </View>

          {/* Divisor */}
          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divTxt}>Variável (opcional)</Text>
            <View style={s.divLine} />
          </View>

          {/* Toggles */}
          <View style={s.toggleRow}>
            {EXTRAS.map(e => (
              <TouchableOpacity
                key={e.id}
                style={[s.toggle, activeExtras.has(e.id) && s.toggleActive]}
                onPress={() => toggle(e.id)}
              >
                <Text style={s.toggleIcon}>{e.icon}</Text>
                <Text style={[s.toggleTxt, activeExtras.has(e.id) && s.toggleActiveTxt]}>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Inputs ativos */}
          {EXTRAS.map(e => activeExtras.has(e.id) && (
            <View key={e.id} style={s.extraField}>
              <Text style={s.label}>{e.icon} {e.label} {e.annual ? '(anual)' : '(mensal)'}</Text>
              <View style={s.salRow}>
                <Text style={s.salPrefix}>R$</Text>
                <TextInput
                  style={s.salInput}
                  value={vals[e.id]}
                  onChangeText={t => setVals(v => ({...v, [e.id]: t.replace(/\D/g,'')}))}
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}

          {/* Total */}
          <View style={s.totalCard}>
            <View>
              <Text style={s.totalEye}>PACOTE TOTAL / MÊS</Text>
              <Text style={s.totalSub}>fixo + variável + benefícios</Text>
            </View>
            <Text style={s.totalVal}>{fmt(myTotal)}</Text>
          </View>

          <View style={{height:16}} />
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={s.ctaWrap}>
        <TouchableOpacity
          style={[s.cta, salario <= 0 && s.ctaDisabled]}
          onPress={goNext}
          disabled={salario <= 0}
        >
          <Text style={s.ctaTxt}>🔍  Ver meu resultado</Text>
        </TouchableOpacity>
        <Text style={s.hint}>Assista um breve anúncio para liberar o resultado</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex:1, backgroundColor:COLORS.dark },
  topbar:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingTop:12, paddingBottom:10 },
  backBtn:       { width:32, height:32, borderRadius:16, backgroundColor:'rgba(255,255,255,0.07)', alignItems:'center', justifyContent:'center' },
  backTxt:       { fontSize:20, color:'rgba(255,255,255,0.6)', lineHeight:24 },
  logoRow:       { flexDirection:'row', alignItems:'center', gap:8 },
  logoImg:       { width:28, height:28, borderRadius:7 },
  logoName:      { fontSize:14, fontWeight:'700', color:'#fff' },
  step:          { fontSize:12, fontWeight:'600', color:'rgba(255,255,255,0.35)' },
  progBg:        { height:3, backgroundColor:'rgba(255,255,255,0.08)' },
  progFill:      { height:3, backgroundColor:COLORS.primary, borderRadius:2 },
  scroll:        { flex:1 },
  content:       { paddingHorizontal:20, paddingTop:20 },
  badge:         { alignSelf:'flex-start', backgroundColor:'rgba(245,168,32,0.15)', borderRadius:999, paddingHorizontal:12, paddingVertical:5, marginBottom:12 },
  badgeTxt:      { color:COLORS.primary, fontSize:11, fontWeight:'700', letterSpacing:0.6 },
  title:         { fontSize:26, fontWeight:'800', color:'#fff', letterSpacing:-0.5, marginBottom:5 },
  sub:           { fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:20 },
  label:         { fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:0.7, marginBottom:8 },

  // Input compacto — menor que antes
  salRow:        { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.surface, borderWidth:1.5, borderColor:'rgba(255,255,255,0.10)', borderRadius:14, paddingHorizontal:16, paddingVertical:12, gap:8 },
  salPrefix:     { fontSize:16, fontWeight:'800', color:'rgba(255,255,255,0.4)' },
  salInput:      { flex:1, fontSize:24, fontWeight:'800', color:'#fff', padding:0 },
  salAno:        { fontSize:11, color:'rgba(255,255,255,0.3)', flexShrink:0 },

  divider:       { flexDirection:'row', alignItems:'center', gap:10, marginVertical:18 },
  divLine:       { flex:1, height:1, backgroundColor:'rgba(255,255,255,0.07)' },
  divTxt:        { fontSize:10, fontWeight:'700', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:0.7 },
  toggleRow:     { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:14 },
  toggle:        { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:8, borderWidth:1.5, borderColor:'rgba(255,255,255,0.12)', borderRadius:999, backgroundColor:'rgba(255,255,255,0.03)' },
  toggleActive:  { backgroundColor:'rgba(245,168,32,0.12)', borderColor:COLORS.primary },
  toggleIcon:    { fontSize:12 },
  toggleTxt:     { fontSize:12, fontWeight:'600', color:'rgba(255,255,255,0.4)' },
  toggleActiveTxt:{ color:COLORS.primary },
  extraField:    { marginBottom:14 },
  totalCard:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:COLORS.surface, borderWidth:1.5, borderColor:'rgba(255,255,255,0.08)', borderRadius:16, padding:14, marginTop:8 },
  totalEye:      { fontSize:10, fontWeight:'700', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:0.7, marginBottom:2 },
  totalSub:      { fontSize:11, color:'rgba(255,255,255,0.25)' },
  totalVal:      { fontSize:20, fontWeight:'900', color:COLORS.primary, letterSpacing:-0.5 },
  ctaWrap:       { padding:16, paddingBottom:24, gap:8 },
  cta:           { backgroundColor:COLORS.primary, borderRadius:28, height:52, alignItems:'center', justifyContent:'center' },
  ctaDisabled:   { opacity:0.35 },
  ctaTxt:        { color:COLORS.dark, fontSize:16, fontWeight:'800', letterSpacing:-0.3 },
  hint:          { textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.25)' },
});
