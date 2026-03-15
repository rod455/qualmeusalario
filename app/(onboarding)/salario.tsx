import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { COLORS } from '../../lib/constants';

type ExtraKey = 'com' | 'plr' | 'bon' | 'vr' | 'out';

const EXTRAS: { id: ExtraKey; label: string; annual?: boolean }[] = [
  { id:'com', label:'Comissão' },
  { id:'plr', label:'PLR', annual:true },
  { id:'bon', label:'Bônus', annual:true },
  { id:'vr',  label:'VR / VA' },
  { id:'out', label:'Outros' },
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

      <View style={s.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.logoName}>Quanto Ganha!</Text>
        <Text style={s.step}>3 de 3</Text>
      </View>
      <View style={s.progBg}><View style={[s.progFill, {width:'100%'}]} /></View>

      <ScrollView keyboardShouldPersistTaps="handled" style={s.scroll}>
        <View style={s.content}>
          <View style={s.badge}><Text style={s.badgeTxt}>💰 REMUNERAÇÃO</Text></View>
          <Text style={s.title}>Qual é o seu{'\n'}salário atual?</Text>
          <Text style={s.sub}>Seus dados são 100% anônimos.</Text>

          <Text style={s.label}>Salário fixo mensal</Text>
          <View style={s.salRow}>
            <View style={s.salPrefix}><Text style={s.salPrefixTxt}>R$</Text></View>
            <TextInput
              style={s.salInput}
              value={salario > 0 ? String(salario) : ''}
              onChangeText={t => setSalario(parseFloat(t.replace(/\D/g,'')) || 0)}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="numeric"
            />
          </View>
          {salario > 0 && <Text style={s.salAno}>{fmt(salario * 12)} / ano</Text>}

          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divTxt}>Variável (opcional)</Text>
            <View style={s.divLine} />
          </View>

          <View style={s.toggleRow}>
            {EXTRAS.map(e => (
              <TouchableOpacity
                key={e.id}
                style={[s.toggle, activeExtras.has(e.id) && s.toggleActive]}
                onPress={() => toggle(e.id)}
              >
                <Text style={[s.toggleTxt, activeExtras.has(e.id) && s.toggleActiveTxt]}>
                  {activeExtras.has(e.id) ? '' : '+ '}{e.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {EXTRAS.map(e => activeExtras.has(e.id) && (
            <View key={e.id} style={s.extraField}>
              <Text style={s.label}>{e.label} {e.annual ? '(anual)' : '(mensal)'}</Text>
              <View style={s.salRow}>
                <View style={s.salPrefix}><Text style={s.salPrefixTxt}>R$</Text></View>
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

          <View style={s.totalCard}>
            <View>
              <Text style={s.totalLabel}>Pacote total / mês</Text>
              <Text style={s.totalSub}>fixo + variável + benefícios</Text>
            </View>
            <Text style={s.totalVal}>{fmt(myTotal)}</Text>
          </View>
        </View>
      </ScrollView>

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
  safe:         {flex:1, backgroundColor:COLORS.dark},
  topbar:       {flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:22, paddingTop:16, paddingBottom:12},
  backBtn:      {padding:4},
  backTxt:      {fontSize:24, color:'rgba(255,255,255,0.5)'},
  logoName:     {fontSize:14, fontWeight:'700', color:'#fff'},
  step:         {fontSize:12, fontWeight:'600', color:'rgba(255,255,255,0.35)'},
  progBg:       {height:3, backgroundColor:'rgba(255,255,255,0.08)'},
  progFill:     {height:3, backgroundColor:COLORS.primary},
  scroll:       {flex:1},
  content:      {paddingHorizontal:24, paddingTop:28, paddingBottom:16},
  badge:        {alignSelf:'flex-start', backgroundColor:'rgba(245,168,32,0.15)', borderRadius:20, paddingHorizontal:12, paddingVertical:5, marginBottom:16},
  badgeTxt:     {color:COLORS.primary, fontSize:12, fontWeight:'700', letterSpacing:0.5},
  title:        {fontSize:26, fontWeight:'800', color:'#fff', lineHeight:32, letterSpacing:-0.5, marginBottom:6},
  sub:          {fontSize:15, color:'rgba(255,255,255,0.45)', lineHeight:22, marginBottom:24},
  label:        {fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8},
  salRow:       {flexDirection:'row', alignItems:'stretch', borderWidth:1.5, borderColor:'rgba(255,255,255,0.12)', borderRadius:14, overflow:'hidden'},
  salPrefix:    {paddingHorizontal:14, paddingVertical:14, backgroundColor:'rgba(255,255,255,0.04)', borderRightWidth:1, borderRightColor:'rgba(255,255,255,0.08)', justifyContent:'center'},
  salPrefixTxt: {fontSize:18, fontWeight:'800', color:'rgba(255,255,255,0.5)'},
  salInput:     {flex:1, fontSize:24, fontWeight:'800', color:'#fff', paddingHorizontal:12, paddingVertical:14},
  salAno:       {fontSize:13, color:'rgba(255,255,255,0.35)', marginTop:6, marginBottom:12},
  divider:      {flexDirection:'row', alignItems:'center', gap:10, marginVertical:20},
  divLine:      {flex:1, height:1, backgroundColor:'rgba(255,255,255,0.08)'},
  divTxt:       {fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:0.5},
  toggleRow:    {flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16},
  toggle:       {paddingHorizontal:14, paddingVertical:8, borderWidth:1.5, borderColor:'rgba(255,255,255,0.12)', borderRadius:20},
  toggleActive: {backgroundColor:'rgba(245,168,32,0.15)', borderColor:COLORS.primary},
  toggleTxt:    {fontSize:13, fontWeight:'600', color:'rgba(255,255,255,0.4)'},
  toggleActiveTxt:{color:COLORS.primary},
  extraField:   {marginBottom:14},
  totalCard:    {flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'rgba(255,255,255,0.04)', borderWidth:1.5, borderColor:'rgba(255,255,255,0.08)', borderRadius:16, padding:16, marginTop:8},
  totalLabel:   {fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:2},
  totalSub:     {fontSize:11, color:'rgba(255,255,255,0.3)'},
  totalVal:     {fontSize:20, fontWeight:'800', color:'#fff'},
  ctaWrap:      {padding:20, paddingBottom:16, gap:8},
  cta:          {backgroundColor:COLORS.primary, borderRadius:28, padding:18, alignItems:'center'},
  ctaDisabled:  {opacity:0.35},
  ctaTxt:       {color:COLORS.dark, fontSize:18, fontWeight:'800', letterSpacing:-0.3},
  hint:         {textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.3)'},
});
