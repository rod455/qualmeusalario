import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Share, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { fmtBRL } from '../../lib/salary';
import { COLORS } from '../../lib/constants';
import AdBanner from '../../components/AdBanner';
import { useInterstitial } from '../../lib/useInterstitial';

export default function PerfilScreen() {
  const result = useOnboardingStore(s => s.result);
  const reset  = useOnboardingStore(s => s.reset);
  const ab     = (result?.diff ?? 0) >= 0;

  // 🆕 Interstitial para ações no perfil
  const { showAdThenDo } = useInterstitial(['carreira', 'salario', 'curso online', 'emprego']);

  const handleShare = async () => {
    if (!result) return;
    const dir = ab ? 'acima' : 'abaixo';
    await Share.share({
      message: `Meu salário está ${Math.abs(result.diff)}% ${dir} do mercado para ${result.cargo.split('(')[0].trim()} em ${result.cidade.nome}.\n\nCalcula o seu → quantoganha.com.br`,
    });
  };

  // 🆕 Nova análise com interstitial
  const handleNovaAnalise = () => {
    showAdThenDo(() => {
      reset();
      router.replace('/(onboarding)/cargo');
    });
  };

  // 🆕 Criar conta com interstitial
  const handleCriarConta = () => {
    showAdThenDo(() => {
      router.push('/cadastro');
    });
  };

  return (
    <SafeAreaView style={ps.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* 🆕 Banner ad no topo */}
      <AdBanner />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={ps.header}>
          <View style={ps.avatarRow}>
            <View style={ps.avatar}>
              <Text style={ps.avatarTxt}>?</Text>
            </View>
            <View style={ps.info}>
              <Text style={ps.name}>Visitante</Text>
              <TouchableOpacity onPress={() => router.push('/cadastro')}>
                <Text style={ps.loginLink}>Criar conta / Entrar →</Text>
              </TouchableOpacity>
            </View>
          </View>
          {result && (
            <View style={ps.tagRow}>
              {[result.cargo.split('(')[0].trim(), result.cidade?.nome].filter(Boolean).map(t => (
                <View key={t} style={ps.tag}><Text style={ps.tagTxt}>{t}</Text></View>
              ))}
            </View>
          )}
        </View>

        {/* Resultado */}
        {result && (
          <View style={ps.card}>
            <Text style={ps.cardEye}>SUA ANÁLISE ATUAL</Text>
            <View style={ps.resultMain}>
              <Text style={[ps.resultPct, ab ? ps.green : ps.red]}>
                {ab ? '+' : '−'}{Math.abs(result.diff)}%
              </Text>
              <View>
                <Text style={ps.resultDesc}>{ab ? 'acima' : 'abaixo'} do mercado</Text>
                <View style={ab ? ps.pillGreen : ps.pillRed}>
                  <Text style={ab ? ps.pillGreenTxt : ps.pillRedTxt}>
                    {ab ? '🟢 Saudável' : '🔴 Atenção'}
                  </Text>
                </View>
              </View>
            </View>
            {[
              { label:'Seu pacote mensal',        val:fmtBRL(result.my.total)  },
              { label:'Média do mercado',          val:fmtBRL(result.mkt.total) },
              { label:'Diferença / mês',           val:fmtBRL(result.diffMes)   },
              { label:'Diferença acumulada / ano', val:fmtBRL(result.diffAno)   },
            ].map(r => (
              <View key={r.label} style={ps.resultRow}>
                <Text style={ps.resultLabel}>{r.label}</Text>
                <Text style={ps.resultVal}>{r.val}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Compartilhar */}
        {result && (
          <View style={ps.card}>
            <Text style={ps.cardTit}>🎬 Compartilhar resultado</Text>
            <Text style={ps.cardSub}>Mostre para o mercado quanto você vale.</Text>
            <TouchableOpacity style={ps.shareBtn} onPress={handleShare}>
              <Text style={ps.shareBtnTxt}>Compartilhar →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ações — 🆕 Nova análise agora tem interstitial */}
        <View style={ps.card}>
          {[
            { icon:'🔄', label:'Nova análise',      color:'rgba(245,168,32,0.15)', onPress: handleNovaAnalise },
            { icon:'💼', label:'Ver vagas',          color:'rgba(23,200,232,0.15)', onPress: () => router.push('/(tabs)/vagas') },
            { icon:'🎯', label:'Treinar negociação', color:'rgba(29,190,117,0.15)', onPress: () => router.push('/(tabs)/negociacao') },
            { icon:'📈', label:'Ver tracker',        color:'rgba(245,168,32,0.10)', onPress: () => router.push('/(tabs)/tracker') },
          ].map((row, i) => (
            <TouchableOpacity key={row.label} style={[ps.settRow, i > 0 && ps.settBorder]} onPress={row.onPress}>
              <View style={ps.settLeft}>
                <View style={[ps.settIcon, {backgroundColor:row.color}]}>
                  <Text style={ps.settEmoji}>{row.icon}</Text>
                </View>
                <Text style={ps.settName}>{row.label}</Text>
              </View>
              <Text style={ps.settArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA cadastro — 🆕 com interstitial */}
        <View style={[ps.card, ps.ctaCard]}>
          <Text style={ps.ctaCardTitle}>Salve seu histórico 📊</Text>
          <Text style={ps.ctaCardSub}>Crie uma conta grátis para guardar suas análises e receber alertas de mercado.</Text>
          <TouchableOpacity style={ps.ctaCardBtn} onPress={handleCriarConta}>
            <Text style={ps.ctaCardBtnTxt}>Criar conta grátis →</Text>
          </TouchableOpacity>
        </View>

        <View style={{height:24}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ps = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.dark },
  header:       { padding:20, paddingBottom:16, borderBottomWidth:0.5, borderBottomColor:'rgba(255,255,255,0.07)' },
  avatarRow:    { flexDirection:'row', alignItems:'center', gap:14, marginBottom:14 },
  avatar:       { width:60, height:60, borderRadius:30, backgroundColor:'rgba(245,168,32,0.2)', borderWidth:2, borderColor:COLORS.primary, alignItems:'center', justifyContent:'center' },
  avatarTxt:    { fontSize:22, fontWeight:'900', color:COLORS.primary },
  info:         { flex:1 },
  name:         { fontSize:20, fontWeight:'800', color:'#fff', letterSpacing:-0.3 },
  loginLink:    { fontSize:13, color:COLORS.primary, fontWeight:'700', marginTop:4 },
  tagRow:       { flexDirection:'row', flexWrap:'wrap', gap:7 },
  tag:          { backgroundColor:'rgba(255,255,255,0.07)', borderRadius:999, paddingHorizontal:12, paddingVertical:5 },
  tagTxt:       { fontSize:11, fontWeight:'600', color:'rgba(255,255,255,0.45)' },
  card:         { marginHorizontal:20, marginTop:14, backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.07)', borderRadius:24, padding:18 },
  cardEye:      { fontSize:10, fontWeight:'700', color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 },
  cardTit:      { fontSize:16, fontWeight:'800', color:'#fff', letterSpacing:-0.3, marginBottom:5 },
  cardSub:      { fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:20, marginBottom:14 },
  resultMain:   { flexDirection:'row', alignItems:'center', gap:14, marginBottom:14 },
  resultPct:    { fontSize:44, fontWeight:'900', letterSpacing:-1.5, lineHeight:48 },
  resultDesc:   { fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:6 },
  pillGreen:    { alignSelf:'flex-start', backgroundColor:'rgba(29,190,117,0.15)', borderRadius:999, paddingHorizontal:10, paddingVertical:3 },
  pillGreenTxt: { fontSize:11, fontWeight:'700', color:COLORS.success },
  pillRed:      { alignSelf:'flex-start', backgroundColor:'rgba(226,75,74,0.15)', borderRadius:999, paddingHorizontal:10, paddingVertical:3 },
  pillRedTxt:   { fontSize:11, fontWeight:'700', color:COLORS.danger },
  green:        { color:COLORS.success },
  red:          { color:COLORS.danger },
  resultRow:    { flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderTopWidth:0.5, borderTopColor:'rgba(255,255,255,0.06)' },
  resultLabel:  { fontSize:13, color:'rgba(255,255,255,0.4)' },
  resultVal:    { fontSize:13, fontWeight:'700', color:'#fff' },
  shareBtn:     { backgroundColor:COLORS.primary, borderRadius:28, height:44, alignItems:'center', justifyContent:'center' },
  shareBtnTxt:  { color:COLORS.dark, fontSize:14, fontWeight:'800' },
  settRow:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:12 },
  settBorder:   { borderTopWidth:0.5, borderTopColor:'rgba(255,255,255,0.06)' },
  settLeft:     { flexDirection:'row', alignItems:'center', gap:12 },
  settIcon:     { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  settEmoji:    { fontSize:16 },
  settName:     { fontSize:14, fontWeight:'600', color:'#fff' },
  settArrow:    { fontSize:20, color:'rgba(255,255,255,0.15)' },
  ctaCard:      { backgroundColor:'rgba(245,168,32,0.08)', borderColor:'rgba(245,168,32,0.2)' },
  ctaCardTitle: { fontSize:16, fontWeight:'800', color:'#fff', letterSpacing:-0.3, marginBottom:5 },
  ctaCardSub:   { fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:20, marginBottom:14 },
  ctaCardBtn:   { backgroundColor:COLORS.primary, borderRadius:28, height:44, alignItems:'center', justifyContent:'center' },
  ctaCardBtnTxt:{ color:COLORS.dark, fontSize:14, fontWeight:'800' },
});
