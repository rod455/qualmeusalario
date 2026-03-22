import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Image,
  PanResponder, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { COLORS } from '../../lib/constants';
import { useInterstitial } from '../../lib/useInterstitial';

const CIDADES = [
  {nome:'São Paulo',           uf:'SP', mult:1.00},
  {nome:'Rio de Janeiro',      uf:'RJ', mult:0.87},
  {nome:'Brasília',            uf:'DF', mult:0.96},
  {nome:'Belo Horizonte',      uf:'MG', mult:0.80},
  {nome:'Curitiba',            uf:'PR', mult:0.82},
  {nome:'Porto Alegre',        uf:'RS', mult:0.80},
  {nome:'Florianópolis',       uf:'SC', mult:0.83},
  {nome:'Salvador',            uf:'BA', mult:0.72},
  {nome:'Fortaleza',           uf:'CE', mult:0.68},
  {nome:'Recife',              uf:'PE', mult:0.70},
  {nome:'Manaus',              uf:'AM', mult:0.65},
  {nome:'Goiânia',             uf:'GO', mult:0.72},
  {nome:'Campinas',            uf:'SP', mult:0.92},
  {nome:'São José dos Campos', uf:'SP', mult:0.88},
  {nome:'Uberlândia',          uf:'MG', mult:0.72},
  {nome:'Natal',               uf:'RN', mult:0.65},
  {nome:'Maceió',              uf:'AL', mult:0.60},
  {nome:'João Pessoa',         uf:'PB', mult:0.63},
  {nome:'Teresina',            uf:'PI', mult:0.60},
  {nome:'Campo Grande',        uf:'MS', mult:0.68},
];

const MODELS = ['presencial','hibrido','remoto'];
const MODEL_LABEL: Record<string,string> = { presencial:'Presencial', hibrido:'Híbrido', remoto:'Remoto' };
const MODEL_ICON:  Record<string,string>  = { presencial:'🏢', hibrido:'🔄', remoto:'🏠' };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const MAX_EXP = 20;
const TRACK_WIDTH = 280;

export default function LocalizacaoScreen() {
  const { setCidade, setWorkModel, setExp, workModel } = useOnboardingStore();
  const [query, setQuery]       = useState('');
  const [focused, setFocused]   = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [years, setYears]       = useState<number | null>(null);

  // 🆕 Interstitial entre tela 2 e tela 3
  const { showAdThenDo } = useInterstitial(['salario', 'emprego', 'carreira', 'mercado trabalho']);

  const sliderX = useState(new Animated.Value(0))[0];
  const [sliderVal, setSliderVal] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = norm(query);
    return CIDADES.filter(c => norm(c.nome).includes(q)).slice(0, 10);
  }, [query]);

  const pickCidade = (c: any) => {
    setSelected(c);
    setCidade(c);
    setQuery(`${c.nome}, ${c.uf}`);
    setFocused(false);
  };

  const updateYears = (val: number) => {
    const clamped = Math.max(0, Math.min(MAX_EXP, val));
    setSliderVal(clamped);
    setYears(clamped);
    setExp(clamped);
    sliderX.setValue((clamped / MAX_EXP) * TRACK_WIDTH);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {},
    onPanResponderMove: (evt, gestureState) => {
      const newX = Math.max(0, Math.min(TRACK_WIDTH, gestureState.moveX - 48));
      const newVal = Math.round((newX / TRACK_WIDTH) * MAX_EXP);
      updateYears(newVal);
    },
    onPanResponderRelease: () => {},
  });

  const changeYears = (delta: number) => {
    const current = years ?? 0;
    updateYears(current + delta);
  };

  const displayYears = years ?? 0;
  const yearsLabel = years === null ? 'Toque para informar'
    : displayYears === 0 ? 'Menos de 1 ano'
    : displayYears === MAX_EXP ? `${MAX_EXP}+ anos`
    : `${displayYears} ${displayYears === 1 ? 'ano' : 'anos'}`;

  const canContinue = !!selected && years !== null;
  const thumbPos = (displayYears / MAX_EXP) * 100;

  // 🆕 Continuar com interstitial
  const handleContinue = () => {
    if (!canContinue) return;
    showAdThenDo(() => {
      router.push('/(onboarding)/salario');
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={s.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={s.logoRow}>
          <Image source={require('../../assets/images/icon.png')} style={s.logoImg} resizeMode="contain" />
          <Text style={s.logoName}>Quanto Ganha!</Text>
        </View>
        <Text style={s.step}>2 de 3</Text>
      </View>
      <View style={s.progBg}><View style={[s.progFill, {width:'66%'}]} /></View>

      <ScrollView keyboardShouldPersistTaps="handled" style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <View style={s.badge}><Text style={s.badgeTxt}>📍 LOCALIZAÇÃO</Text></View>
          <Text style={s.title}>Onde você{'\n'}trabalha?</Text>
          <Text style={s.sub}>Afeta o benchmark salarial da sua região.</Text>

          <Text style={s.label}>Cidade</Text>
          <View style={[s.inputWrap, focused && s.inputFocus]}>
            <Text style={s.inputIcon}>📍</Text>
            <TextInput
              style={s.input}
              value={query}
              onChangeText={t => { setQuery(t); setSelected(null); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="Buscar cidade..."
              placeholderTextColor="rgba(255,255,255,0.25)"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setSelected(null); }}>
                <Text style={s.clearTxt}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {results.length > 0 && focused && (
            <View style={s.dropdown}>
              {results.map((c, i) => (
                <TouchableOpacity key={c.nome} onPress={() => pickCidade(c)}>
                  <View style={[s.dropItem, i > 0 && s.dropSep]}>
                    <Text style={s.dropTxt}>{c.nome}, {c.uf}</Text>
                    <Text style={s.dropSub}>{(c.mult * 100).toFixed(0)}% de SP</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[s.label, {marginTop:24}]}>Modelo de trabalho</Text>
          <View style={s.modelRow}>
            {MODELS.map(m => (
              <TouchableOpacity
                key={m}
                style={[s.modelBtn, workModel === m && s.modelActive]}
                onPress={() => setWorkModel(m)}
              >
                <Text style={s.modelIcon}>{MODEL_ICON[m]}</Text>
                <Text style={[s.modelTxt, workModel === m && s.modelActiveTxt]}>{MODEL_LABEL[m]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.expHeader}>
            <Text style={s.label}>Anos de experiência</Text>
            {years === null && <View style={s.expRequired}><Text style={s.expRequiredTxt}>obrigatório</Text></View>}
          </View>

          <View style={[s.stepperCard, years === null && s.stepperCardEmpty]}>
            <TouchableOpacity style={[s.stepperBtn, displayYears <= 0 && s.stepperBtnOff]} onPress={() => changeYears(-1)} disabled={displayYears <= 0}>
              <Text style={[s.stepperBtnTxt, displayYears <= 0 && s.stepperBtnTxtOff]}>−</Text>
            </TouchableOpacity>
            <View style={s.stepperCenter}>
              {years === null
                ? <Text style={s.stepperPlaceholder}>?</Text>
                : <Text style={s.stepperNum}>{displayYears === MAX_EXP ? `${MAX_EXP}+` : displayYears}</Text>
              }
              <Text style={[s.stepperLabel, years === null && s.stepperLabelEmpty]}>{yearsLabel}</Text>
            </View>
            <TouchableOpacity style={[s.stepperBtn, displayYears >= MAX_EXP && s.stepperBtnOff]} onPress={() => changeYears(1)} disabled={displayYears >= MAX_EXP}>
              <Text style={[s.stepperBtnTxt, displayYears >= MAX_EXP && s.stepperBtnTxtOff]}>+</Text>
            </TouchableOpacity>
          </View>

          {years !== null && (
            <View style={s.sliderWrap}>
              <View style={s.sliderTrack} {...panResponder.panHandlers}>
                <View style={[s.sliderFill, {width:`${thumbPos}%`}]} />
                <View style={[s.sliderThumb, {left:`${thumbPos}%`, marginLeft:-10}]} />
              </View>
              <View style={s.sliderLabels}>
                {['0','5','10','15','20+'].map(l => (
                  <Text key={l} style={s.sliderLbl}>{l}</Text>
                ))}
              </View>
            </View>
          )}

          <View style={{height:24}} />
        </View>
      </ScrollView>

      <View style={s.ctaWrap}>
        {!canContinue && (
          <Text style={s.ctaHint}>
            {!selected ? '📍 Selecione uma cidade' : '⏱ Informe seus anos de experiência'}
          </Text>
        )}
        {/* 🆕 Continuar agora com interstitial */}
        <TouchableOpacity
          style={[s.cta, !canContinue && s.ctaDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={s.ctaTxt}>Continuar →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex:1, backgroundColor:COLORS.dark },
  topbar:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingTop:12, paddingBottom:10 },
  backBtn:       { width:32, height:32, borderRadius:16, backgroundColor:'rgba(255,255,255,0.07)', alignItems:'center', justifyContent:'center' },
  backTxt:       { fontSize:20, color:'rgba(255,255,255,0.6)', lineHeight:24 },
  logoRow:       { flexDirection:'row', alignItems:'center', gap:6 },
  logoImg:       { width:28, height:28, borderRadius:7 },
  logoName:      { fontSize:13, fontWeight:'700', color:'#fff' },
  step:          { fontSize:12, fontWeight:'600', color:'rgba(255,255,255,0.35)' },
  progBg:        { height:3, backgroundColor:'rgba(255,255,255,0.08)' },
  progFill:      { height:3, backgroundColor:COLORS.primary, borderRadius:2 },
  scroll:        { flex:1 },
  content:       { paddingHorizontal:20, paddingTop:22 },
  badge:         { alignSelf:'flex-start', backgroundColor:'rgba(245,168,32,0.15)', borderRadius:999, paddingHorizontal:12, paddingVertical:5, marginBottom:14 },
  badgeTxt:      { color:COLORS.primary, fontSize:11, fontWeight:'700', letterSpacing:0.6 },
  title:         { fontSize:28, fontWeight:'800', color:'#fff', lineHeight:34, letterSpacing:-0.6, marginBottom:6 },
  sub:           { fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:22 },
  label:         { fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 },
  inputWrap:     { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:'rgba(255,255,255,0.12)', borderRadius:14, paddingHorizontal:14, paddingVertical:12, backgroundColor:'rgba(255,255,255,0.04)', gap:9 },
  inputFocus:    { borderColor:COLORS.secondary },
  inputIcon:     { fontSize:15 },
  input:         { flex:1, fontSize:15, color:'#fff' },
  clearTxt:      { fontSize:13, color:'rgba(255,255,255,0.3)', paddingHorizontal:4 },
  dropdown:      { marginTop:4, borderWidth:1.5, borderColor:'rgba(255,255,255,0.10)', borderRadius:14, overflow:'hidden', backgroundColor:COLORS.surface },
  dropItem:      { paddingHorizontal:16, paddingVertical:12 },
  dropSep:       { borderTopWidth:0.5, borderTopColor:'rgba(255,255,255,0.07)' },
  dropTxt:       { fontSize:14, fontWeight:'600', color:'#fff' },
  dropSub:       { fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 },
  modelRow:      { flexDirection:'row', gap:10 },
  modelBtn:      { flex:1, paddingVertical:14, borderWidth:1.5, borderColor:'rgba(255,255,255,0.12)', borderRadius:16, alignItems:'center', gap:5, backgroundColor:'rgba(255,255,255,0.03)' },
  modelActive:   { backgroundColor:'rgba(245,168,32,0.12)', borderColor:COLORS.primary },
  modelIcon:     { fontSize:18 },
  modelTxt:      { fontSize:12, fontWeight:'600', color:'rgba(255,255,255,0.4)' },
  modelActiveTxt:{ color:COLORS.primary },
  expHeader:     { flexDirection:'row', alignItems:'center', gap:10, marginTop:24, marginBottom:10 },
  expRequired:   { backgroundColor:'rgba(226,75,74,0.15)', borderRadius:999, paddingHorizontal:10, paddingVertical:3 },
  expRequiredTxt:{ fontSize:10, fontWeight:'700', color:COLORS.danger, textTransform:'uppercase', letterSpacing:0.5 },
  stepperCard:   { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.surface, borderWidth:1.5, borderColor:'rgba(255,255,255,0.08)', borderRadius:18, overflow:'hidden' },
  stepperCardEmpty:{ borderColor:'rgba(226,75,74,0.3)' },
  stepperBtn:    { width:64, height:56, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(255,255,255,0.04)' },
  stepperBtnOff: { opacity:0.2 },
  stepperBtnTxt: { fontSize:26, fontWeight:'300', color:COLORS.primary, lineHeight:30 },
  stepperBtnTxtOff:{ color:'rgba(255,255,255,0.3)' },
  stepperCenter: { flex:1, alignItems:'center', justifyContent:'center', paddingVertical:10 },
  stepperNum:    { fontSize:32, fontWeight:'900', color:'#fff', letterSpacing:-1 },
  stepperPlaceholder:{ fontSize:32, fontWeight:'900', color:'rgba(255,255,255,0.15)', letterSpacing:-1 },
  stepperLabel:  { fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 },
  stepperLabelEmpty:{ color:'rgba(226,75,74,0.6)', fontStyle:'italic' },
  sliderWrap:    { marginTop:14 },
  sliderTrack:   { height:20, justifyContent:'center', paddingHorizontal:10 },
  sliderFill:    { position:'absolute', left:10, height:4, backgroundColor:COLORS.primary, borderRadius:2 },
  sliderThumb:   { position:'absolute', width:20, height:20, borderRadius:10, backgroundColor:COLORS.primary, top:0, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.3, shadowRadius:3, elevation:4 },
  sliderLabels:  { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:10, marginTop:6 },
  sliderLbl:     { fontSize:10, color:'rgba(255,255,255,0.25)' },
  ctaWrap:       { padding:16, paddingBottom:24, gap:8 },
  ctaHint:       { textAlign:'center', fontSize:12, color:'rgba(226,75,74,0.8)' },
  cta:           { backgroundColor:COLORS.primary, borderRadius:28, height:52, alignItems:'center', justifyContent:'center' },
  ctaDisabled:   { opacity:0.35 },
  ctaTxt:        { color:COLORS.dark, fontSize:16, fontWeight:'800', letterSpacing:-0.3 },
});
