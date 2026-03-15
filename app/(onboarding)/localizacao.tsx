import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { COLORS } from '../../lib/constants';

const CIDADES = [
  {nome:'São Paulo',         uf:'SP', mult:1.00},
  {nome:'Rio de Janeiro',    uf:'RJ', mult:0.87},
  {nome:'Brasília',          uf:'DF', mult:0.96},
  {nome:'Belo Horizonte',    uf:'MG', mult:0.80},
  {nome:'Curitiba',          uf:'PR', mult:0.82},
  {nome:'Porto Alegre',      uf:'RS', mult:0.80},
  {nome:'Florianópolis',     uf:'SC', mult:0.83},
  {nome:'Salvador',          uf:'BA', mult:0.72},
  {nome:'Fortaleza',         uf:'CE', mult:0.68},
  {nome:'Recife',            uf:'PE', mult:0.70},
  {nome:'Manaus',            uf:'AM', mult:0.65},
  {nome:'Goiânia',           uf:'GO', mult:0.72},
  {nome:'Campinas',          uf:'SP', mult:0.92},
  {nome:'São José dos Campos',uf:'SP',mult:0.88},
  {nome:'Uberlândia',        uf:'MG', mult:0.72},
  {nome:'Natal',             uf:'RN', mult:0.65},
  {nome:'Maceió',            uf:'AL', mult:0.60},
  {nome:'João Pessoa',       uf:'PB', mult:0.63},
  {nome:'Teresina',          uf:'PI', mult:0.60},
  {nome:'Campo Grande',      uf:'MS', mult:0.68},
];

const NOMAD = { nome:'Nomad Digital ✈️', uf:'', mult:1.20, nomad:true };
const MODELS = ['presencial','hibrido','remoto'];
const MODEL_LABEL: Record<string,string> = { presencial:'Presencial', hibrido:'Híbrido', remoto:'Remoto' };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

export default function LocalizacaoScreen() {
  const { setCidade, setWorkModel, setExp, workModel, exp } = useOnboardingStore();
  const [query, setQuery]     = useState('');
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState<typeof CIDADES[0] | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = norm(query);
    const hits: any[] = [];
    if ('nomad'.includes(q) || 'digital'.includes(q)) hits.push(NOMAD);
    CIDADES.filter(c => norm(c.nome).includes(q)).slice(0,10).forEach(c => hits.push(c));
    return hits;
  }, [query]);

  const pickCidade = (c: any) => {
    setSelected(c);
    setCidade(c);
    setQuery(c.nomad ? 'Nomad Digital ✈️' : `${c.nome}, ${c.uf}`);
    setFocused(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={s.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.logoName}>Quanto Ganha!</Text>
        <Text style={s.step}>2 de 3</Text>
      </View>
      <View style={s.progBg}><View style={[s.progFill, {width:'66%'}]} /></View>

      <ScrollView keyboardShouldPersistTaps="handled" style={s.scroll}>
        <View style={s.content}>
          <View style={s.badge}><Text style={s.badgeTxt}>📍 LOCALIZAÇÃO</Text></View>
          <Text style={s.title}>Onde você{'\n'}trabalha?</Text>
          <Text style={s.sub}>Afeta o benchmark salarial da sua região.</Text>

          <Text style={s.label}>Cidade</Text>
          <View style={[s.inputWrap, focused && s.inputFocus]}>
            <TextInput
              style={s.input}
              value={query}
              onChangeText={t => { setQuery(t); setSelected(null); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="Buscar cidade..."
              placeholderTextColor="rgba(255,255,255,0.25)"
            />
          </View>

          {!query && (
            <TouchableOpacity style={s.nomadBtn} onPress={() => pickCidade(NOMAD)}>
              <Text style={s.nomadTxt}>✈️  Trabalho como Nomad Digital</Text>
            </TouchableOpacity>
          )}

          {results.length > 0 && focused && (
            <View style={s.dropdown}>
              {results.map((c: any, i: number) => (
                <TouchableOpacity key={c.nomad ? 'nomad' : c.nome} onPress={() => pickCidade(c)}>
                  <View style={[s.dropItem, i > 0 && s.dropSep]}>
                    <Text style={s.dropTxt}>{c.nomad ? '✈️ Nomad Digital' : `${c.nome}, ${c.uf}`}</Text>
                    {!c.nomad && <Text style={s.dropSub}>{(c.mult * 100).toFixed(0)}% de SP</Text>}
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
                <Text style={[s.modelTxt, workModel === m && s.modelActiveTxt]}>{MODEL_LABEL[m]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, {marginTop:24}]}>Anos de experiência</Text>
          <View style={s.expRow}>
            {[0,1,2,3,5,7,10,15].map(n => (
              <TouchableOpacity
                key={n}
                style={[s.expBtn, exp === n && s.expActive]}
                onPress={() => setExp(n)}
              >
                <Text style={[s.expTxt, exp === n && s.expActiveTxt]}>{n === 0 ? '<1' : n}+</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={s.ctaWrap}>
        <TouchableOpacity
          style={[s.cta, !selected && s.ctaDisabled]}
          onPress={() => selected && router.push('/(onboarding)/salario')}
          disabled={!selected}
        >
          <Text style={s.ctaTxt}>Continuar →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        {flex:1, backgroundColor:COLORS.dark},
  topbar:      {flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:22, paddingTop:16, paddingBottom:12},
  backBtn:     {padding:4},
  backTxt:     {fontSize:24, color:'rgba(255,255,255,0.5)'},
  logoName:    {fontSize:14, fontWeight:'700', color:'#fff'},
  step:        {fontSize:12, fontWeight:'600', color:'rgba(255,255,255,0.35)'},
  progBg:      {height:3, backgroundColor:'rgba(255,255,255,0.08)'},
  progFill:    {height:3, backgroundColor:COLORS.primary},
  scroll:      {flex:1},
  content:     {paddingHorizontal:24, paddingTop:28, paddingBottom:24},
  badge:       {alignSelf:'flex-start', backgroundColor:'rgba(245,168,32,0.15)', borderRadius:20, paddingHorizontal:12, paddingVertical:5, marginBottom:16},
  badgeTxt:    {color:COLORS.primary, fontSize:12, fontWeight:'700', letterSpacing:0.5},
  title:       {fontSize:26, fontWeight:'800', color:'#fff', lineHeight:32, letterSpacing:-0.5, marginBottom:6},
  sub:         {fontSize:15, color:'rgba(255,255,255,0.45)', lineHeight:22, marginBottom:24},
  label:       {fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8},
  inputWrap:   {flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:'rgba(255,255,255,0.12)', borderRadius:14, paddingHorizontal:14, paddingVertical:12},
  inputFocus:  {borderColor:COLORS.secondary},
  input:       {flex:1, fontSize:16, color:'#fff'},
  nomadBtn:    {marginTop:8, padding:12, borderWidth:1.5, borderColor:COLORS.primary, borderRadius:12, backgroundColor:'rgba(245,168,32,0.1)'},
  nomadTxt:    {fontSize:14, fontWeight:'600', color:COLORS.primary},
  dropdown:    {marginTop:4, borderWidth:1.5, borderColor:'rgba(255,255,255,0.12)', borderRadius:14, overflow:'hidden', backgroundColor:'#0F2048'},
  dropItem:    {paddingHorizontal:16, paddingVertical:12},
  dropSep:     {borderTopWidth:0.5, borderTopColor:'rgba(255,255,255,0.08)'},
  dropTxt:     {fontSize:14, color:'#fff'},
  dropSub:     {fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2},
  modelRow:    {flexDirection:'row', gap:8},
  modelBtn:    {flex:1, paddingVertical:10, borderWidth:1.5, borderColor:'rgba(255,255,255,0.12)', borderRadius:12, alignItems:'center'},
  modelActive: {backgroundColor:'rgba(245,168,32,0.15)', borderColor:COLORS.primary},
  modelTxt:    {fontSize:13, fontWeight:'600', color:'rgba(255,255,255,0.45)'},
  modelActiveTxt:{color:COLORS.primary},
  expRow:      {flexDirection:'row', flexWrap:'wrap', gap:8},
  expBtn:      {width:56, paddingVertical:9, borderWidth:1.5, borderColor:'rgba(255,255,255,0.12)', borderRadius:10, alignItems:'center'},
  expActive:   {backgroundColor:'rgba(245,168,32,0.15)', borderColor:COLORS.primary},
  expTxt:      {fontSize:13, fontWeight:'600', color:'rgba(255,255,255,0.45)'},
  expActiveTxt:{color:COLORS.primary},
  ctaWrap:     {padding:20, paddingBottom:24},
  cta:         {backgroundColor:COLORS.primary, borderRadius:28, padding:17, alignItems:'center'},
  ctaDisabled: {opacity:0.35},
  ctaTxt:      {color:COLORS.dark, fontSize:17, fontWeight:'800', letterSpacing:-0.2},
});
