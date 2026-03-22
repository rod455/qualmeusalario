import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';

export default function LandingScreen() {
  const logoAnim  = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim   = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(logoAnim,  { toValue:1, duration:500, useNativeDriver:true }),
      Animated.timing(titleAnim, { toValue:1, duration:500, useNativeDriver:true }),
      Animated.timing(ctaAnim,   { toValue:1, duration:500, useNativeDriver:true }),
      Animated.timing(statsAnim, { toValue:1, duration:500, useNativeDriver:true }),
    ]).start();
  }, []);

  const fadeUp = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[24,0] }) }],
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <View style={s.container}>
        <Animated.View style={[s.logoWrap, fadeUp(logoAnim)]}>
          <Image source={require('../assets/images/icon.png')} style={s.logoImg} resizeMode="contain" />
          <Text style={s.logoName}>Quanto Ganha!</Text>
        </Animated.View>

        <Animated.View style={[s.headlineWrap, fadeUp(titleAnim)]}>
          <Text style={s.headline}>
            Você está ganhando{'\n'}
            <Text style={s.headlineAccent}>o que merece?</Text>
          </Text>
          <Text style={s.sub}>
            Compare seu salário com a média do mercado em segundos.{'\n'}
            Dados reais do CAGED. 100% grátis.
          </Text>
          <View style={s.badges}>
            {['Sem cadastro', 'Dados do CAGED', '90+ cargos'].map(b => (
              <View key={b} style={s.badge}>
                <Text style={s.badgeTick}>✓</Text>
                <Text style={s.badgeTxt}>{b}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[s.ctaWrap, fadeUp(ctaAnim)]}>
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() => router.push('/(onboarding)/cargo')}
            activeOpacity={0.85}
          >
            <Text style={s.ctaTxt}>Descobrir se meu salário está competitivo →</Text>
          </TouchableOpacity>
          <Text style={s.ctaHint}>Leva menos de 1 minuto</Text>
        </Animated.View>

        <Animated.View style={[s.statsRow, fadeUp(statsAnim)]}>
          {[
            { num:'2.4M', label:'registros CAGED' },
            { num:'90+',  label:'cargos cobertos'  },
            { num:'50+',  label:'cidades no Brasil' },
          ].map((st, i) => (
            <View key={st.label} style={[s.statItem, i > 0 && s.statBorder]}>
              <Text style={s.statNum}>{st.num}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex:1, backgroundColor:COLORS.dark },
  container:     { flex:1, paddingHorizontal:24, justifyContent:'center', gap:32 },
  logoWrap:      { flexDirection:'row', alignItems:'center', gap:10, justifyContent:'center' },
  logoImg:       { width:44, height:44, borderRadius:12 },
  logoName:      { fontSize:20, fontWeight:'800', color:'#fff', letterSpacing:-0.4 },
  headlineWrap:  { alignItems:'center', gap:14 },
  headline:      { fontSize:34, fontWeight:'900', color:'#fff', textAlign:'center', lineHeight:42, letterSpacing:-1 },
  headlineAccent:{ color:COLORS.primary },
  sub:           { fontSize:14, color:'rgba(255,255,255,0.5)', textAlign:'center', lineHeight:22 },
  badges:        { flexDirection:'row', flexWrap:'wrap', gap:8, justifyContent:'center' },
  badge:         { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(255,255,255,0.06)', borderRadius:999, paddingHorizontal:12, paddingVertical:6 },
  badgeTick:     { fontSize:12, color:COLORS.success, fontWeight:'700' },
  badgeTxt:      { fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:'600' },
  ctaWrap:       { gap:10, alignItems:'center' },
  ctaBtn:        { width:'100%', backgroundColor:COLORS.primary, borderRadius:28, paddingVertical:16, paddingHorizontal:20, alignItems:'center' },
  ctaTxt:        { color:COLORS.dark, fontSize:15, fontWeight:'900', letterSpacing:-0.3, textAlign:'center' },
  ctaHint:       { fontSize:12, color:'rgba(255,255,255,0.3)' },
  statsRow:      { flexDirection:'row', backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.07)', borderRadius:20, overflow:'hidden' },
  statItem:      { flex:1, alignItems:'center', paddingVertical:18, paddingHorizontal:8 },
  statBorder:    { borderLeftWidth:1, borderLeftColor:'rgba(255,255,255,0.07)' },
  statNum:       { fontSize:24, fontWeight:'900', color:COLORS.primary, letterSpacing:-0.5 },
  statLabel:     { fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:4, textAlign:'center' },
});
