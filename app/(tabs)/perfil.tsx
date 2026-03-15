import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Share, StyleSheet, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { fmtBRL } from '../../lib/salary';
import { COLORS } from '../../lib/constants';
import { getSession, signOut } from '../../lib/supabase';

export default function PerfilScreen() {
  const result = useOnboardingStore(s => s.result);
  const reset  = useOnboardingStore(s => s.reset);
  const [session, setSession] = useState<any>(null);

  useEffect(() => { getSession().then(s => setSession(s)); }, []);

  const name     = session?.user?.user_metadata?.full_name ?? session?.user?.email?.split('@')[0] ?? 'Visitante';
  const email    = session?.user?.email ?? '';
  const initials = name.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase() || '?';
  const ab       = (result?.diff ?? 0) >= 0;

  const shareResult = async () => {
    if (!result) return;
    const dir  = ab ? 'acima' : 'abaixo';
    await Share.share({
      message: `Meu salário está ${Math.abs(result.diff)}% ${dir} do mercado para ${result.cargo.split('(')[0].trim()} em ${result.cidade.nome}.\n\nCalcula o seu → quantoganha.vercel.app`,
    });
  };

  return (
    <SafeAreaView style={ps.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <ScrollView>

        {/* Header */}
        <View style={ps.header}>
          <View style={ps.avatarRow}>
            <View style={ps.avatar}><Text style={ps.avatarTxt}>{initials}</Text></View>
            <View style={ps.info}>
              <Text style={ps.name}>{name}</Text>
              {email ? <Text style={ps.email}>{email}</Text> : (
                <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
                  <Text style={ps.loginLink}>Criar conta / Entrar →</Text>
                </TouchableOpacity>
              )}
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

        {/* Resultado atual */}
        {result && (
          <View style={ps.card}>
            <Text style={ps.cardEye}>SUA ANÁLISE ATUAL</Text>
            <View style={ps.resultMain}>
              <Text style={[ps.resultPct, ab ? ps.green : ps.red]}>
                {ab ? '+' : '−'}{Math.abs(result.diff)}%
              </Text>
              <Text style={ps.resultDesc}>{ab ? 'acima' : 'abaixo'} do mercado</Text>
            </View>
            {[
              { label:'Seu pacote mensal',     val:fmtBRL(result.my.total),  color:{} },
              { label:'Média do mercado',       val:fmtBRL(result.mkt.total), color:ps.green },
              { label:'Diferença / mês',        val:fmtBRL(result.diffMes),   color:ab ? ps.green : ps.red },
              { label:'Diferença acumulada / ano', val:fmtBRL(result.diffAno), color:ab ? ps.green : ps.red },
            ].map(r => (
              <View key={r.label} style={ps.resultRow}>
                <Text style={ps.resultLabel}>{r.label}</Text>
                <Text style={[ps.resultVal, r.color]}>{r.val}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Compartilhar */}
        {result && (
          <View style={ps.card}>
            <Text style={ps.cardTit}>🎬 Compartilhar resultado</Text>
            <Text style={ps.cardSub}>Todo mundo quer saber se está ganhando pouco.</Text>
            <TouchableOpacity style={ps.shareBtn} onPress={shareResult}>
              <Text style={ps.shareBtnTxt}>Compartilhar →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Configurações */}
        <View style={ps.card}>
          {[
            { icon:'🔄', title:'Nova análise', onPress: () => { reset(); router.replace('/(onboarding)/cargo'); } },
            { icon:'💼', title:'Ver vagas',    onPress: () => router.push('/(tabs)/vagas') },
            { icon:'🎯', title:'Negociar',     onPress: () => router.push('/(tabs)/negociacao') },
          ].map((row, i) => (
            <TouchableOpacity key={row.title} style={[ps.settRow, i > 0 && ps.settBorder]} onPress={row.onPress}>
              <View style={ps.settLeft}>
                <View style={ps.settIcon}><Text>{row.icon}</Text></View>
                <Text style={ps.settName}>{row.title}</Text>
              </View>
              <Text style={ps.settArrow}>›</Text>
            </TouchableOpacity>
          ))}

          {session ? (
            <TouchableOpacity
              style={[ps.settRow, ps.settBorder]}
              onPress={async () => { await signOut(); setSession(null); }}
            >
              <View style={ps.settLeft}>
                <View style={[ps.settIcon, { backgroundColor:'rgba(226,75,74,0.15)' }]}><Text>🚪</Text></View>
                <Text style={[ps.settName, { color:COLORS.danger }]}>Sair da conta</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[ps.settRow, ps.settBorder]} onPress={() => {}}>
              <View style={ps.settLeft}>
                <View style={[ps.settIcon, { backgroundColor:'rgba(245,168,32,0.15)' }]}><Text>👤</Text></View>
                <Text style={[ps.settName, { color:COLORS.primary }]}>Criar conta grátis</Text>
              </View>
              <Text style={ps.settArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const ps = StyleSheet.create({
  safe:       { flex:1, backgroundColor:COLORS.dark },
  header:     { padding:20, paddingBottom:16, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.07)' },
  avatarRow:  { flexDirection:'row', alignItems:'center', gap:16, marginBottom:14 },
  avatar:     { width:60, height:60, borderRadius:30, backgroundColor:COLORS.primary, alignItems:'center', justifyContent:'center' },
  avatarTxt:  { fontSize:20, fontWeight:'800', color:COLORS.dark },
  info:       { flex:1 },
  name:       { fontSize:20, fontWeight:'800', color:'#fff', letterSpacing:-0.3 },
  email:      { fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:3 },
  loginLink:  { fontSize:13, color:COLORS.primary, fontWeight:'600', marginTop:3 },
  tagRow:     { flexDirection:'row', flexWrap:'wrap', gap:7 },
  tag:        { backgroundColor:'rgba(255,255,255,0.07)', borderRadius:20, paddingHorizontal:10, paddingVertical:4 },
  tagTxt:     { fontSize:11, fontWeight:'600', color:'rgba(255,255,255,0.5)' },
  card:       { margin:16, marginTop:8, backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.07)', borderRadius:18, padding:16 },
  cardEye:    { fontSize:10, fontWeight:'700', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 },
  cardTit:    { fontSize:15, fontWeight:'800', color:'#fff', letterSpacing:-0.2, marginBottom:4 },
  cardSub:    { fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:20, marginBottom:12 },
  resultMain: { flexDirection:'row', alignItems:'flex-end', gap:10, marginBottom:12 },
  resultPct:  { fontSize:38, fontWeight:'900', letterSpacing:-1, lineHeight:42 },
  resultDesc: { fontSize:13, color:'rgba(255,255,255,0.45)', paddingBottom:4 },
  resultRow:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:8, borderTopWidth:0.5, borderTopColor:'rgba(255,255,255,0.06)' },
  resultLabel:{ fontSize:12, color:'rgba(255,255,255,0.4)' },
  resultVal:  { fontSize:13, fontWeight:'700', color:'rgba(255,255,255,0.8)' },
  green:      { color:COLORS.success },
  red:        { color:COLORS.danger },
  shareBtn:   { backgroundColor:COLORS.primary, borderRadius:28, padding:13, alignItems:'center' },
  shareBtnTxt:{ color:COLORS.dark, fontSize:14, fontWeight:'700' },
  settRow:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:12 },
  settBorder: { borderTopWidth:0.5, borderTopColor:'rgba(255,255,255,0.06)' },
  settLeft:   { flexDirection:'row', alignItems:'center', gap:12 },
  settIcon:   { width:32, height:32, borderRadius:9, backgroundColor:'rgba(245,168,32,0.15)', alignItems:'center', justifyContent:'center' },
  settName:   { fontSize:14, fontWeight:'600', color:'#fff' },
  settArrow:  { fontSize:18, color:'rgba(255,255,255,0.2)' },
});
