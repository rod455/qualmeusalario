import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Linking, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { fmtBRL } from '../../lib/salary';
import { COLORS, ADZUNA_APP_ID, ADZUNA_APP_KEY } from '../../lib/constants';

type Vaga = {
  id: string; titulo: string; empresa: string; cidade: string;
  modelo: 'remoto'|'hibrido'|'presencial'; salario: number;
  link: string; tempo: string; descricao: string; diffVsSal: number;
};

const MODEL_LABEL = { remoto:'Remoto 🏠', hibrido:'Híbrido 🔄', presencial:'Presencial 🏢' };
const FILTERS = ['todas','remoto','hibrido','presencial'];

const MOCK: Vaga[] = [
  {id:'1',titulo:'Desenvolvedor(a) Pleno — Backend Node.js',empresa:'Nubank',cidade:'São Paulo, SP',modelo:'remoto',salario:11500,link:'https://boards.greenhouse.io/nubank',tempo:'2h',descricao:'Vaga 100% remota. Node.js, TypeScript e AWS.',diffVsSal:0},
  {id:'2',titulo:'Software Engineer — Full Stack',empresa:'iFood',cidade:'São Paulo, SP',modelo:'hibrido',salario:10800,link:'https://careers.ifood.com/jobs',tempo:'5h',descricao:'Stack: React, Python, Kafka. 50M usuários.',diffVsSal:0},
  {id:'3',titulo:'Backend Developer — Java/Spring',empresa:'BTG Pactual',cidade:'São Paulo, SP',modelo:'hibrido',salario:12000,link:'https://btgpactual.gupy.io',tempo:'3d',descricao:'Java 17, Spring Boot, Kafka.',diffVsSal:0},
  {id:'4',titulo:'Dev Pleno — React Native',empresa:'PicPay',cidade:'São Paulo, SP',modelo:'remoto',salario:10500,link:'https://picpay.gupy.io',tempo:'6h',descricao:'+30M usuários. React Native, Redux.',diffVsSal:0},
  {id:'5',titulo:'Engenheiro(a) de Dados Pleno',empresa:'Mercado Livre',cidade:'São Paulo, SP',modelo:'hibrido',salario:13000,link:'https://jobs.mercadolibre.com/jobs',tempo:'12h',descricao:'Python, Spark, BigQuery, Airflow.',diffVsSal:0},
];

function timeDiff(d?: string) {
  if (!d) return 'Recente';
  const h = Math.round((Date.now() - new Date(d).getTime()) / 3.6e6);
  if (h < 1) return 'Agora'; if (h < 24) return `${h}h`;
  const days = Math.round(h/24); if (days < 7) return `${days}d`;
  return `${Math.round(days/7)}sem`;
}

export default function VagasScreen() {
  const result  = useOnboardingStore(s => s.result);
  const [vagas, setVagas]     = useState<Vaga[]>([]);
  const [filter, setFilter]   = useState('todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchVagas(); }, []);

  async function fetchVagas() {
    const cargo  = result?.cargo?.split('(')[0]?.trim() ?? 'Desenvolvedor';
    const cidade = result?.cidade?.nome ?? 'São Paulo';
    const mySal  = result?.my?.total ?? 0;
    try {
      const q   = encodeURIComponent(cargo.split(' ').slice(0,3).join(' '));
      const loc = encodeURIComponent(cidade.split(',')[0]);
      const url = `https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=15&what=${q}&where=${loc}&sort_by=date&content-type=application/json`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        const items: Vaga[] = (data.results ?? []).map((j: any, i: number) => {
          const tl = (j.title ?? '').toLowerCase();
          const lo = (j.location?.display_name ?? '').toLowerCase();
          const modelo: Vaga['modelo'] = tl.includes('remot')||lo.includes('remot') ? 'remoto'
            : tl.includes('hibri') ? 'hibrido' : 'presencial';
          const salario = j.salary_min ? Math.round((j.salary_min+(j.salary_max??j.salary_min))/2) : 0;
          return { id:j.id??String(i), titulo:j.title, empresa:j.company?.display_name??'Empresa',
            cidade:j.location?.display_name??cidade, modelo, salario,
            link:j.redirect_url??'#', tempo:timeDiff(j.created),
            descricao:(j.description??'').replace(/<[^>]+>/g,'').slice(0,100)+'…',
            diffVsSal:mySal>0&&salario>0?salario-mySal:0 };
        });
        setVagas(items.length ? items : MOCK.map(v=>({...v,diffVsSal:mySal>0?v.salario-mySal:0})));
      } else throw new Error();
    } catch {
      setVagas(MOCK.map(v=>({...v,diffVsSal:(result?.my?.total??0)>0?v.salario-(result?.my?.total??0):0})));
    } finally { setLoading(false); }
  }

  const filtered = filter === 'todas' ? vagas : vagas.filter(v => v.modelo === filter);

  const renderVaga = ({ item: v }: { item: Vaga }) => {
    const modelColor = v.modelo==='remoto'
      ? {bg:'rgba(245,168,32,0.12)',tx:COLORS.primary}
      : v.modelo==='hibrido'
      ? {bg:'rgba(23,200,232,0.12)',tx:COLORS.secondary}
      : {bg:'rgba(255,255,255,0.07)',tx:'rgba(255,255,255,0.5)'};
    return (
      <View style={vs.card}>
        <View style={vs.cardTop}>
          <Text style={vs.titulo} numberOfLines={2}>{v.titulo}</Text>
          <View style={[vs.chip, {backgroundColor:modelColor.bg}]}>
            <Text style={[vs.chipTxt, {color:modelColor.tx}]}>{MODEL_LABEL[v.modelo]}</Text>
          </View>
        </View>
        <Text style={vs.empresa}>🏢 {v.empresa} · {v.cidade}</Text>
        {v.descricao ? <Text style={vs.desc} numberOfLines={2}>{v.descricao}</Text> : null}
        <View style={vs.salRow}>
          {v.salario > 0 ? (
            <>
              <Text style={vs.sal}>{fmtBRL(v.salario)}</Text>
              {v.diffVsSal !== 0 && (
                <View style={[vs.diff, v.diffVsSal>0 ? vs.diffGreen : vs.diffRed]}>
                  <Text style={[vs.diffTxt, v.diffVsSal>0 ? {color:COLORS.success} : {color:COLORS.danger}]}>
                    {v.diffVsSal>0?'+':''}{fmtBRL(Math.abs(v.diffVsSal))} vs você
                  </Text>
                </View>
              )}
            </>
          ) : <Text style={vs.salCombinar}>Salário a combinar</Text>}
        </View>
        <Text style={vs.tempo}>🕐 {v.tempo}</Text>
        <TouchableOpacity style={vs.linkBtn} onPress={() => Linking.openURL(v.link)}>
          <Text style={vs.linkTxt}>Ver vaga →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={vs.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <View style={vs.header}>
        <Text style={vs.eyebrow}>Vagas compatíveis</Text>
        <Text style={vs.title}>
          {loading ? 'Buscando vagas...' : `Vagas para ${result?.cargo?.split('(')[0]?.trim() ?? 'você'}`}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={vs.filters}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[vs.filterBtn, filter===f && vs.filterActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[vs.filterTxt, filter===f && vs.filterActiveTxt]}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={vs.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={vs.loaderTxt}>Buscando vagas no mercado...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={v => v.id}
          renderItem={renderVaga}
          contentContainerStyle={vs.list}
          ListEmptyComponent={<View style={vs.empty}><Text style={vs.emptyTxt}>Nenhuma vaga para esse filtro</Text></View>}
          ListFooterComponent={
            <TouchableOpacity style={vs.alertBtn} onPress={() => router.push('/(tabs)/perfil')}>
              <Text style={vs.alertTxt}>🔔 Ativar alertas de vagas →</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const vs = StyleSheet.create({
  safe:          { flex:1, backgroundColor:COLORS.dark },
  header:        { paddingHorizontal:20, paddingTop:16, paddingBottom:4 },
  eyebrow:       { fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 },
  title:         { fontSize:20, fontWeight:'800', color:'#fff', letterSpacing:-0.3 },
  filters:       { marginTop:12, marginBottom:4 },
  filterBtn:     { paddingHorizontal:14, paddingVertical:6, borderWidth:1, borderColor:'rgba(255,255,255,0.1)', borderRadius:20, marginRight:8, backgroundColor:'rgba(255,255,255,0.04)' },
  filterActive:  { backgroundColor:'rgba(245,168,32,0.15)', borderColor:COLORS.primary },
  filterTxt:     { fontSize:12, fontWeight:'600', color:'rgba(255,255,255,0.4)' },
  filterActiveTxt:{ color:COLORS.primary },
  list:          { padding:16, gap:10 },
  loader:        { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  loaderTxt:     { fontSize:14, color:'rgba(255,255,255,0.4)' },
  empty:         { padding:40, alignItems:'center' },
  emptyTxt:      { fontSize:14, color:'rgba(255,255,255,0.3)' },
  card:          { backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.07)', borderRadius:16, padding:14 },
  cardTop:       { flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 },
  titulo:        { flex:1, fontSize:14, fontWeight:'700', color:'#fff', lineHeight:20 },
  chip:          { paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  chipTxt:       { fontSize:10, fontWeight:'700' },
  empresa:       { fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:6 },
  desc:          { fontSize:12, color:'rgba(255,255,255,0.35)', lineHeight:18, marginBottom:8 },
  salRow:        { flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 },
  sal:           { fontSize:16, fontWeight:'800', color:COLORS.primary },
  salCombinar:   { fontSize:13, color:'rgba(255,255,255,0.35)' },
  diff:          { paddingHorizontal:8, paddingVertical:2, borderRadius:10 },
  diffGreen:     { backgroundColor:'rgba(29,190,117,0.12)' },
  diffRed:       { backgroundColor:'rgba(226,75,74,0.12)' },
  diffTxt:       { fontSize:11, fontWeight:'600' },
  tempo:         { fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:8 },
  linkBtn:       { backgroundColor:COLORS.primary, borderRadius:28, padding:9, alignItems:'center' },
  linkTxt:       { color:COLORS.dark, fontSize:13, fontWeight:'700' },
  alertBtn:      { margin:4, padding:14, backgroundColor:'rgba(245,168,32,0.12)', borderRadius:12, alignItems:'center' },
  alertTxt:      { color:COLORS.primary, fontSize:14, fontWeight:'700' },
});
