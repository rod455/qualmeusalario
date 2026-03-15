import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Pressable, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { COLORS } from '../../lib/constants';

// ─── Dados de cargos ──────────────────────────────────────────────────────────
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
  { label:'Dev Backend Pleno', cargo:'Desenvolvedor(a) Backend Pleno', area:'Tecnologia' },
  { label:'Dev Frontend Pleno', cargo:'Desenvolvedor(a) Frontend Pleno', area:'Tecnologia' },
  { label:'Product Manager', cargo:'Product Manager (PM)', area:'Tecnologia' },
  { label:'Analista de Dados', cargo:'Analista de Dados', area:'Tecnologia' },
  { label:'Designer UX/UI', cargo:'Designer UX/UI Pleno', area:'Design & UX' },
  { label:'Analista de Mkt', cargo:'Analista de Marketing Digital', area:'Marketing' },
];

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function CargoScreen() {
  const [query, setQuery]   = useState('');
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
      <StatusBar barStyle="dark-content" />

      {/* Topbar */}
      <View style={s.topbar}>
        <View style={s.logoRow}>
          <View style={s.logoIcon}><Text style={s.logoIconText}>$</Text></View>
          <Text style={s.logoName}>Qual Meu Salário?</Text>
        </View>
        <Text style={s.stepLabel}>1 de 3</Text>
      </View>

      {/* Progress */}
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: '33%' }]} />
      </View>

      {/* Content */}
      <View style={s.content}>
        <View style={s.badge}><Text style={s.badgeText}>💼 CARGO</Text></View>
        <Text style={s.title}>Qual é o{'\n'}seu cargo?</Text>
        <Text style={s.subtitle}>
          Vamos buscar os dados de mercado para a sua profissão.
        </Text>

        {/* Input */}
        <View style={[s.inputWrap, focused && s.inputFocused]}>
          <TextInput
            style={s.input}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Digite ou escolha seu cargo..."
            placeholderTextColor="#c7c7cc"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={s.clearBtn}>
              <Text style={s.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Autocomplete results */}
        {results.length > 0 ? (
          <View style={s.dropdown}>
            <FlatList
              data={results}
              keyExtractor={i => i.cargo}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.dropItem}
                  onPress={() => pick(item.cargo, item.area)}
                >
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
              <TouchableOpacity
                style={s.useTyped}
                onPress={() => pick(query.trim(), 'Outro')}
              >
                <Text style={s.useTypedText}>+ Usar "{query.trim()}"</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* Quick picks */
          query.length === 0 && (
            <View style={s.quickSection}>
              <Text style={s.quickTitle}>Mais buscados</Text>
              <View style={s.quickWrap}>
                {QUICK_PICKS.map(q => (
                  <TouchableOpacity
                    key={q.cargo}
                    style={s.quickChip}
                    onPress={() => pick(q.cargo, q.area)}
                  >
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
  safe:         { flex:1, backgroundColor:'#fff' },
  topbar:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:22, paddingTop:16, paddingBottom:12 },
  logoRow:      { flexDirection:'row', alignItems:'center', gap:9 },
  logoIcon:     { width:30, height:30, backgroundColor:COLORS.primary, borderRadius:8, alignItems:'center', justifyContent:'center' },
  logoIconText: { color:'#fff', fontWeight:'800', fontSize:14 },
  logoName:     { fontSize:14, fontWeight:'700', color:'#1a1a1a' },
  stepLabel:    { fontSize:12, fontWeight:'600', color:'#aeaeb2' },
  progressBg:   { height:3, backgroundColor:'#f2f2f7' },
  progressFill: { height:3, backgroundColor:COLORS.primary },
  content:      { flex:1, paddingHorizontal:24, paddingTop:28 },
  badge:        { alignSelf:'flex-start', backgroundColor:COLORS.primaryBg, borderRadius:20, paddingHorizontal:12, paddingVertical:5, marginBottom:16 },
  badgeText:    { color:COLORS.primaryDark, fontSize:12, fontWeight:'700', letterSpacing:0.5 },
  title:        { fontSize:26, fontWeight:'800', color:'#1a1a1a', lineHeight:32, letterSpacing:-0.5, marginBottom:6 },
  subtitle:     { fontSize:15, color:'#8e8e93', lineHeight:22, marginBottom:24 },
  inputWrap:    { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:'#e5e5ea', borderRadius:14, paddingHorizontal:14, paddingVertical:12, backgroundColor:'#fff' },
  inputFocused: { borderColor:COLORS.primary },
  input:        { flex:1, fontSize:16, color:'#1a1a1a' },
  clearBtn:     { padding:4 },
  clearText:    { fontSize:16, color:'#c7c7cc' },
  dropdown:     { marginTop:4, borderWidth:1.5, borderColor:'#e5e5ea', borderRadius:14, overflow:'hidden', backgroundColor:'#fff' },
  dropItem:     { paddingHorizontal:16, paddingVertical:12 },
  dropItemText: { fontSize:14, color:'#1a1a1a' },
  dropItemArea: { fontSize:11, color:'#aeaeb2', marginTop:2 },
  separator:    { height:0.5, backgroundColor:'#f2f2f7', marginHorizontal:16 },
  useTyped:     { paddingHorizontal:16, paddingVertical:11, borderTopWidth:0.5, borderTopColor:'#f2f2f7' },
  useTypedText: { fontSize:14, color:COLORS.primary, fontWeight:'600' },
  quickSection: { marginTop:24 },
  quickTitle:   { fontSize:12, fontWeight:'700', color:'#aeaeb2', textTransform:'uppercase', letterSpacing:0.5, marginBottom:12 },
  quickWrap:    { flexDirection:'row', flexWrap:'wrap', gap:8 },
  quickChip:    { paddingHorizontal:14, paddingVertical:8, borderWidth:1.5, borderColor:'#e5e5ea', borderRadius:20 },
  quickChipText:{ fontSize:13, color:'#3a3a3c', fontWeight:'500' },
});
