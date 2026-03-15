import {
  View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { fmtBRL } from '../../lib/salary';
import { COLORS } from '../../lib/constants';

export default function TrackerScreen() {
  const result = useOnboardingStore(s => s.result);

  const history = [
    { mes:'Nov/24', diff:-20 },
    { mes:'Dez/24', diff:-19 },
    { mes:'Jan/25', diff:-18 },
    { mes:'Fev/25', diff:-18 },
    { mes:'Mar/25', diff: result?.diff ?? -18 },
  ];
  const maxAbs = Math.max(...history.map(h => Math.abs(h.diff)));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <ScrollView>
        <View style={s.header}>
          <Text style={s.eyebrow}>Tracker Salarial</Text>
          <Text style={s.title}>Sua evolução</Text>
        </View>

        {/* Saúde salarial */}
        <View style={s.card}>
          <Text style={s.cardLabel}>SAÚDE SALARIAL</Text>
          <View style={s.gaugeRow}>
            <Text style={[s.gaugeNum, (result?.diff ?? 0) >= 0 ? s.green : s.red]}>
              {result?.diff ?? '—'}%
            </Text>
            <Text style={s.gaugeDesc}>
              {(result?.diff ?? 0) >= 0 ? 'acima do mercado 🟢' : 'abaixo do mercado 🔴'}
            </Text>
          </View>
          {result && (
            <View style={s.diffRow}>
              <View style={s.diffItem}>
                <Text style={s.diffAmt}>{fmtBRL(result.diffMes)}</Text>
                <Text style={s.diffPer}>diferença / mês</Text>
              </View>
              <View style={s.diffDiv} />
              <View style={s.diffItem}>
                <Text style={s.diffAmt}>{fmtBRL(result.diffAno)}</Text>
                <Text style={s.diffPer}>diferença / ano</Text>
              </View>
            </View>
          )}
        </View>

        {/* Histórico */}
        <View style={s.card}>
          <Text style={s.cardLabel}>HISTÓRICO 5 MESES</Text>
          {history.map((h, i) => (
            <View key={i} style={s.histRow}>
              <Text style={s.histMes}>{h.mes}</Text>
              <View style={s.histBarWrap}>
                <View style={[s.histBar, {
                  width: `${(Math.abs(h.diff) / maxAbs) * 80}%`,
                  backgroundColor: h.diff >= 0 ? COLORS.success : COLORS.danger,
                }]} />
              </View>
              <Text style={[s.histPct, h.diff >= 0 ? s.green : s.red]}>
                {h.diff >= 0 ? '+' : ''}{h.diff}%
              </Text>
            </View>
          ))}
        </View>

        {/* Projeção */}
        <View style={[s.card, s.projecaoCard]}>
          <Text style={[s.cardLabel, { color:COLORS.primary }]}>📈 PROJEÇÃO 12 MESES</Text>
          <Text style={s.projecaoTxt}>
            Se o mercado continuar crescendo, em 12 meses a defasagem pode chegar a{' '}
            <Text style={s.red}>{Math.round((result?.diff ?? -18) - 6)}%</Text>.
          </Text>
          <Text style={s.projecaoSub}>Crie uma conta para receber alertas mensais automáticos.</Text>
          <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/(tabs)/perfil')}>
            <Text style={s.ctaBtnTxt}>Ativar alertas →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.dark },
  header:       { padding:20, paddingBottom:8 },
  eyebrow:      { fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:0.5 },
  title:        { fontSize:22, fontWeight:'800', color:'#fff', letterSpacing:-0.3, marginTop:4 },
  card:         { margin:16, marginTop:8, backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.07)', borderRadius:18, padding:16 },
  cardLabel:    { fontSize:10, fontWeight:'700', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 },
  gaugeRow:     { flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 },
  gaugeNum:     { fontSize:40, fontWeight:'900', letterSpacing:-1 },
  gaugeDesc:    { fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:20 },
  green:        { color:COLORS.success },
  red:          { color:COLORS.danger },
  diffRow:      { flexDirection:'row', borderTopWidth:0.5, borderTopColor:'rgba(255,255,255,0.08)', paddingTop:12 },
  diffItem:     { flex:1, alignItems:'center' },
  diffDiv:      { width:1, backgroundColor:'rgba(255,255,255,0.08)' },
  diffAmt:      { fontSize:16, fontWeight:'800', color:'#fff' },
  diffPer:      { fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 },
  histRow:      { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  histMes:      { width:56, fontSize:12, color:'rgba(255,255,255,0.45)' },
  histBarWrap:  { flex:1, height:6, backgroundColor:'rgba(255,255,255,0.07)', borderRadius:3 },
  histBar:      { height:6, borderRadius:3 },
  histPct:      { width:40, fontSize:12, fontWeight:'700', textAlign:'right' },
  projecaoCard: { backgroundColor:'rgba(245,168,32,0.06)', borderColor:'rgba(245,168,32,0.15)' },
  projecaoTxt:  { fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:20 },
  projecaoSub:  { fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:8, marginBottom:14 },
  ctaBtn:       { backgroundColor:COLORS.primary, borderRadius:28, padding:12, alignItems:'center' },
  ctaBtnTxt:    { color:COLORS.dark, fontSize:13, fontWeight:'800' },
});
