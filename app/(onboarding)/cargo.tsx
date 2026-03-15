import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { COLORS } from '../../lib/constants';

const CAREERS = [
  { area: 'Tecnologia', items: ['Desenvolvedor(a) Frontend Junior','Desenvolvedor(a) Frontend Pleno','Desenvolvedor(a) Frontend Senior','Desenvolvedor(a) Backend Junior','Desenvolvedor(a) Backend Pleno','Desenvolvedor(a) Backend Senior','Desenvolvedor(a) Full Stack Pleno','Desenvolvedor(a) Full Stack Senior','Desenvolvedor(a) Mobile','Engenheiro(a) de Software','Tech Lead','Arquiteto(a) de Software','DevOps Engineer','SRE','Engenheiro(a) de Dados Pleno','Engenheiro(a) de Dados Senior','Analista de Dados','Cientista de Dados','Analista de BI','QA Engineer','Scrum Master','Agile Coach','Product Manager (PM)','Product Owner (PO)','CTO','Head de Tecnologia'] },
  { area: 'Design & UX', items: ['Designer UX/UI Junior','Designer UX/UI Pleno','Designer UX/UI Senior','UX Researcher','Motion Designer','Designer Gráfico','Head de Design','Web Designer'] },
  { area: 'Marketing', items: ['Analista de Marketing','Analista de Marketing Digital','Growth Hacker','Especialista em SEO','Especialista em Mídia Paga','Social Media Manager','Copywriter','Gerente de Marketing','CMO'] },
  { area: 'Vendas & Comercial', items: ['SDR','BDR','Executivo(a) de Contas (AE)','Key Account Manager','Gerente de Vendas','Diretor(a) Comercial','CSO','Closer','Inside Sales'] },
  { area: 'Operações & CS', items: ['Analista de Customer Success','Customer Success Manager','Analista de Operações','Gerente de Operações','COO','Gerente de Projetos (PMO)'] },
  { area: 'Finanças', items: ['Analista Financeiro Pleno','Analista Financeiro Senior','Controller','CFO','Contador(a)','Analista de FP&A','Analista de Investimentos'] },
  { area: 'RH & People', items: ['Analista de RH','HRBP','People Analytics','Gerente de RH','CHRO'] },
  { area: 'Jurídico', items: ['Advogado(a) Trabalhista','Advogado(a) Tributário(a)','Analista de Compliance','DPO'] },
  { area: 'Saúde', items: ['Médico(a) Clínico(a) Geral','Médico(a) Especialista','Enfermeiro(a)','Psicólogo(a)','Fisioterapeuta','Nutricionista','Dentista'] },
  { area: 'Educação', items: ['Professor(a) Educação Básica','Professor(a) Ensino Superior','Designer Instrucional'] },
  { area: 'Engenharia', items: ['Engenheiro(a) Civil','Engenheiro(a) Mecânico(a)','Engenheiro(a) Elétrico(a)','Engenheiro(a) de Produção'] },
];

const QUICK_PICKS = [
  { label:'Dev Backend Pleno',  cargo:'Desenvolvedor(a) Backend Pleno',  area:'Tecnologia' },
  { label:'Dev Frontend Pleno', cargo:'Desenvolvedor(a) Frontend Pleno', area:'Tecnologia' },
  { label:'Product Manager',    cargo:'Product Manager (PM)',             area:'Tecnologia' },
  { label:'Analista de Dados',  cargo:'Analista de Dados',               area:'Tecnologia' },
  { label:'Designer UX/UI',     cargo:'Designer UX/UI Pleno',            area:'Design & UX' },
  { label:'Analista de Mkt',    cargo:'Analista de Marketing Digital',    area:'Marketing' },
];

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function CargoScreen() {
  const [query, setQuery]     = useState('');
  const [focused, setFocused] = useState(false);
  const setCargo = useOnboardingStore(s => s.setCargo);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = norm(query);
    const hits: { cargo: string; area: string }[] = [];
    CAREERS.forEach(a => {
      a.items.forEach(item => {
        if (norm(item).includes(q)) hits.push({ cargo: item, area: a.area });
      });
    });
    return hits.slice(0, 15);
  }, [query]);

  function pick(cargo: string, area: string) {
    setCargo(cargo, area);
    router.push('/(onboarding)/localizacao');
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={s.topbar}>
        <View style={s.logoRow}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={s.logoImg}
            resizeMode="contain"
          />
          <Text style={s.logoName}>Quanto Ganha!</Text>
        </View>
        <Text style={s.stepLabel}>1 de 3</Text>
      </View>

      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: '33%' }]} />
      </View>

      <View style={s.content}>
        <View style={s.badge}><Text style={s.badgeText}>💼 CARGO</Text></View>

        <Text style={s.title} numberOfLines={1} adjustsFontSizeToFit>
          Qual é o seu cargo?
        </Text>
        <Text style={s.subtitle}>
          Vamos buscar os dados de mercado para a sua profissão.
        </Text>

        <View style={[s.inputWrap, focused && s.inputFocused]}>
          <Text style={s.inputIcon}>🔍</Text>
          <TextInput
            style={s.input}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Digite ou escolha seu cargo..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={s.clearBtn}>
              <Text style={s.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {results.length > 0 ? (
          <View style={s.dropdown}>
            <FlatList
              data={results}
              keyExtractor={i => i.cargo}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.dropItem} onPress={() => pick(item.cargo, item.area)}>
                  <Text style={s.dropItemText}>{item.cargo}</Text>
                  <Text style={s.dropItemArea}>{item.area}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={s.separator} />}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
              style={{ maxHeight: 240 }}
            />
            {query.trim().length > 2 && (
              <TouchableOpacity style={s.useTyped} onPress={() => pick(query.trim(), 'Outro')}>
                <Text style={s.useTypedText}>+ Usar "{query.trim()}"</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          query.length === 0 && (
            <View style={s.quickSection}>
              <Text style={s.quickTitle}>Mais buscados</Text>
              <View style={s.quickWrap}>
                {QUICK_PICKS.map(q => (
                  <TouchableOpacity key={q.cargo} style={s.quickChip} onPress={() => pick(q.cargo, q.area)}>
                    <Text style={s.quickChipText}>{q.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.dark },
  topbar:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingTop:12, paddingBottom:10 },
  logoRow:      { flexDirection:'row', alignItems:'center', gap:8 },
  logoImg:      { width:32, height:32, borderRadius:8 },
  logoName:     { fontSize:15, fontWeight:'700', color:'#fff' },
  stepLabel:    { fontSize:12, fontWeight:'600', color:'rgba(255,255,255,0.35)' },
  progressBg:   { height:3, backgroundColor:'rgba(255,255,255,0.08)' },
  progressFill: { height:3, backgroundColor:COLORS.primary, borderRadius:2 },
  content:      { flex:1, paddingHorizontal:20, paddingTop:22 },
  badge:        { alignSelf:'flex-start', backgroundColor:'rgba(245,168,32,0.15)', borderRadius:999, paddingHorizontal:12, paddingVertical:5, marginBottom:14 },
  badgeText:    { color:COLORS.primary, fontSize:11, fontWeight:'700', letterSpacing:0.6 },
  title:        { fontSize:28, fontWeight:'800', color:'#fff', letterSpacing:-0.6, marginBottom:6 },
  subtitle:     { fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:20, marginBottom:22 },
  inputWrap:    { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:'rgba(255,255,255,0.12)', borderRadius:14, paddingHorizontal:14, paddingVertical:12, backgroundColor:'rgba(255,255,255,0.04)', gap:9 },
  inputFocused: { borderColor:COLORS.secondary, backgroundColor:'rgba(23,200,232,0.05)' },
  inputIcon:    { fontSize:15 },
  input:        { flex:1, fontSize:15, color:'#fff' },
  clearBtn:     { padding:4 },
  clearText:    { fontSize:14, color:'rgba(255,255,255,0.3)' },
  dropdown:     { marginTop:6, borderWidth:1.5, borderColor:'rgba(255,255,255,0.10)', borderRadius:16, overflow:'hidden', backgroundColor:COLORS.surface },
  dropItem:     { paddingHorizontal:16, paddingVertical:12 },
  dropItemText: { fontSize:14, fontWeight:'600', color:'#fff' },
  dropItemArea: { fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 },
  separator:    { height:0.5, backgroundColor:'rgba(255,255,255,0.07)', marginHorizontal:16 },
  useTyped:     { paddingHorizontal:16, paddingVertical:11, borderTopWidth:0.5, borderTopColor:'rgba(255,255,255,0.07)' },
  useTypedText: { fontSize:14, color:COLORS.primary, fontWeight:'700' },
  quickSection: { marginTop:22 },
  quickTitle:   { fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 },
  quickWrap:    { flexDirection:'row', flexWrap:'wrap', gap:8 },
  quickChip:    { paddingHorizontal:14, paddingVertical:8, borderWidth:1.5, borderColor:'rgba(255,255,255,0.12)', borderRadius:999, backgroundColor:'rgba(255,255,255,0.04)' },
  quickChipText:{ fontSize:13, color:'rgba(255,255,255,0.65)', fontWeight:'600' },
});
