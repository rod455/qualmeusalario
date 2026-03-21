import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import AdBanner from '../../components/AdBanner';
import { useInterstitial } from '../../lib/useInterstitial';

export default function VagasScreen() {
  const { showAdThenDo } = useInterstitial(['vaga emprego', 'salario', 'carreira', 'trabalho remoto']);

  function handleCTA() {
    showAdThenDo(() => {
      router.push('/(tabs)/perfil');
    });
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Banner ad no topo */}
      <AdBanner />

      <View style={s.container}>
        <View style={s.iconWrap}><Text style={s.icon}>💼</Text></View>
        <Text style={s.title}>Veja vagas compatíveis</Text>
        <Text style={s.sub}>Encontre oportunidades com salário acima da sua análise de mercado, filtradas para o seu cargo.</Text>
        <View style={s.perks}>
          {[
            { icon:'💼', text:'Vagas filtradas para seu cargo' },
            { icon:'💰', text:'Salários acima do seu atual' },
            { icon:'🏠', text:'Filtro por modelo de trabalho' },
            { icon:'🔔', text:'Alertas de novas oportunidades' },
          ].map(p => (
            <View key={p.text} style={s.perk}>
              <View style={s.perkIcon}><Text>{p.icon}</Text></View>
              <Text style={s.perkTxt}>{p.text}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={s.cta} onPress={handleCTA}>
          <Text style={s.ctaTxt}>Criar conta grátis →</Text>
        </TouchableOpacity>
        <Text style={s.hint}>100% gratuito • Sem cartão de crédito</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex:1, backgroundColor:COLORS.dark },
  container: { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:28 },
  iconWrap:  { width:72, height:72, borderRadius:20, backgroundColor:'rgba(245,168,32,0.12)', borderWidth:1.5, borderColor:'rgba(245,168,32,0.25)', alignItems:'center', justifyContent:'center', marginBottom:20 },
  icon:      { fontSize:32 },
  title:     { fontSize:24, fontWeight:'900', color:'#fff', textAlign:'center', letterSpacing:-0.5, marginBottom:10 },
  sub:       { fontSize:14, color:'rgba(255,255,255,0.45)', textAlign:'center', lineHeight:22, marginBottom:24 },
  perks:     { width:'100%', gap:12, marginBottom:28 },
  perk:      { flexDirection:'row', alignItems:'center', gap:12 },
  perkIcon:  { width:36, height:36, borderRadius:10, backgroundColor:'rgba(255,255,255,0.06)', alignItems:'center', justifyContent:'center', flexShrink:0 },
  perkTxt:   { fontSize:14, color:'rgba(255,255,255,0.7)', fontWeight:'500', flex:1 },
  cta:       { width:'100%', backgroundColor:COLORS.primary, borderRadius:28, height:54, alignItems:'center', justifyContent:'center', marginBottom:12 },
  ctaTxt:    { color:COLORS.dark, fontSize:16, fontWeight:'900', letterSpacing:-0.3 },
  hint:      { fontSize:12, color:'rgba(255,255,255,0.25)' },
});
