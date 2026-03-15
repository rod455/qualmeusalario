import {
  View, Text, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { COLORS } from '../lib/constants';

type Props = {
  title?: string;
  subtitle?: string;
  onUnlock?: () => void;
};

export default function LockedOverlay({
  title = 'Crie sua conta grátis',
  subtitle = 'Desbloqueie acesso completo ao seu histórico, vagas e simulador de negociação.',
  onUnlock,
}: Props) {
  return (
    <View style={s.overlay}>
      {/* Ícone de cadeado */}
      <View style={s.iconWrap}>
        <Text style={s.icon}>🔒</Text>
      </View>

      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>

      {/* Benefícios */}
      <View style={s.perks}>
        {[
          { icon:'📊', text:'Histórico de análises salvo' },
          { icon:'🔔', text:'Alertas de variação do mercado' },
          { icon:'🎯', text:'Simulador de negociação com IA' },
          { icon:'💼', text:'Vagas compatíveis com seu perfil' },
        ].map(p => (
          <View key={p.text} style={s.perk}>
            <View style={s.perkIcon}><Text style={s.perkIconTxt}>{p.icon}</Text></View>
            <Text style={s.perkTxt}>{p.text}</Text>
          </View>
        ))}
      </View>

      {/* CTA principal */}
      <TouchableOpacity style={s.cta} onPress={onUnlock} activeOpacity={0.85}>
        <Text style={s.ctaTxt}>Criar conta grátis →</Text>
      </TouchableOpacity>

      <Text style={s.hint}>100% gratuito • Sem cartão de crédito</Text>
    </View>
  );
}

const s = StyleSheet.create({
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(11,24,56,0.97)', zIndex:10, alignItems:'center', justifyContent:'center', paddingHorizontal:28 },
  iconWrap:  { width:72, height:72, borderRadius:20, backgroundColor:'rgba(245,168,32,0.12)', borderWidth:1.5, borderColor:'rgba(245,168,32,0.25)', alignItems:'center', justifyContent:'center', marginBottom:20 },
  icon:      { fontSize:32 },
  title:     { fontSize:24, fontWeight:'900', color:'#fff', textAlign:'center', letterSpacing:-0.5, marginBottom:10 },
  subtitle:  { fontSize:14, color:'rgba(255,255,255,0.45)', textAlign:'center', lineHeight:22, marginBottom:24 },
  perks:     { width:'100%', gap:12, marginBottom:28 },
  perk:      { flexDirection:'row', alignItems:'center', gap:12 },
  perkIcon:  { width:36, height:36, borderRadius:10, backgroundColor:'rgba(255,255,255,0.06)', alignItems:'center', justifyContent:'center', flexShrink:0 },
  perkIconTxt:{ fontSize:16 },
  perkTxt:   { fontSize:14, color:'rgba(255,255,255,0.7)', fontWeight:'500', flex:1 },
  cta:       { width:'100%', backgroundColor:COLORS.primary, borderRadius:28, height:54, alignItems:'center', justifyContent:'center', marginBottom:12 },
  ctaTxt:    { color:COLORS.dark, fontSize:16, fontWeight:'900', letterSpacing:-0.3 },
  hint:      { fontSize:12, color:'rgba(255,255,255,0.25)' },
});
