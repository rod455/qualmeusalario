// app/vagas.tsx
// Tela de vagas — filtros (Área, Salário, Tipo) + interstitial para destravar cada vaga

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  FlatList, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, ADZUNA_APP_ID, ADZUNA_APP_KEY } from '../lib/constants';
import AdBanner from '../components/AdBanner';
import { useInterstitial } from '../lib/useInterstitial';

type Vaga = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
  workType?: string;
};

const AREAS = ['Todas', 'Tecnologia', 'Marketing', 'Vendas', 'Finanças', 'RH', 'Design', 'Engenharia', 'Saúde'];
const SALARY_RANGES = [
  { label: 'Qualquer', min: 0, max: 999999 },
  { label: 'Até 5k', min: 0, max: 5000 },
  { label: '5k–10k', min: 5000, max: 10000 },
  { label: '10k–20k', min: 10000, max: 20000 },
  { label: '20k+', min: 20000, max: 999999 },
];
const WORK_TYPES = ['Todos', 'Presencial', 'Remoto', 'Híbrido'];

const AREA_SEARCH_TERMS: Record<string, string> = {
  'Todas': '',
  'Tecnologia': 'desenvolvedor software programador TI',
  'Marketing': 'marketing digital growth',
  'Vendas': 'vendas comercial executivo',
  'Finanças': 'financeiro contábil controller',
  'RH': 'recursos humanos recrutamento',
  'Design': 'designer UX UI',
  'Engenharia': 'engenheiro engenharia',
  'Saúde': 'médico enfermeiro saúde',
};

function dedupeVagas(vagas: Vaga[]): Vaga[] {
  const seen = new Set<string>();
  return vagas.filter(v => {
    const key = v.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function VagasScreen() {
  const [vagas, setVagas]             = useState<Vaga[]>([]);
  const [loading, setLoading]         = useState(true);
  const [unlocked, setUnlocked]       = useState<Set<string>>(new Set());
  const [selectedArea, setSelectedArea]       = useState('Todas');
  const [selectedSalary, setSelectedSalary]   = useState(0);
  const [selectedWork, setSelectedWork]       = useState('Todos');

  const { showAdThenDo } = useInterstitial(['vaga emprego', 'salario', 'carreira', 'trabalho remoto']);

  useEffect(() => { fetchVagas(); }, [selectedArea]);

  async function fetchVagas() {
    setLoading(true);
    try {
      const searchTerm = AREA_SEARCH_TERMS[selectedArea] || 'emprego';
      const query = encodeURIComponent(searchTerm);
      const url = `https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=25&what=${query}&content-type=application/json`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.results) {
        const mapped: Vaga[] = data.results.map((r: any, i: number) => ({
          id: r.id?.toString() ?? `vaga-${i}`,
          title: r.title ?? 'Vaga sem título',
          company: r.company?.display_name ?? 'Empresa confidencial',
          location: r.location?.display_name ?? 'Brasil',
          salary_min: r.salary_min ? Math.round(r.salary_min) : undefined,
          salary_max: r.salary_max ? Math.round(r.salary_max) : undefined,
          url: r.redirect_url ?? '',
        }));
        setVagas(dedupeVagas(mapped));
      }
    } catch (e) {
      console.log('Erro ao buscar vagas:', e);
    } finally {
      setLoading(false);
    }
  }

  const filteredVagas = vagas.filter(v => {
    const range = SALARY_RANGES[selectedSalary];
    const sal = v.salary_max ?? v.salary_min ?? 0;
    if (sal > 0 && (sal < range.min || sal > range.max)) return false;
    return true;
  });

  function handleUnlock(vagaId: string) {
    if (unlocked.has(vagaId)) return;
    showAdThenDo(() => {
      setUnlocked(prev => new Set(prev).add(vagaId));
    });
  }

  const fmtSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'A combinar';
    const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`;
    if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return fmt(min);
    return fmt(max!);
  };

  const renderVaga = useCallback(({ item }: { item: Vaga }) => {
    const isUnlocked = unlocked.has(item.id);

    return (
      <View style={vs.card}>
        {/* Nome + Salário sempre visíveis */}
        <View style={vs.cardContent}>
          <Text style={vs.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={vs.cardSalary}>💰 {fmtSalary(item.salary_min, item.salary_max)}</Text>
        </View>

        {isUnlocked ? (
          <View>
            <View style={vs.unlockDetails}>
              <Text style={vs.detailCompany}>🏢 {item.company}</Text>
              <Text style={vs.detailLocation}>📍 {item.location}</Text>
            </View>
            <TouchableOpacity style={vs.btnOpen} onPress={() => item.url && Linking.openURL(item.url)}>
              <Text style={vs.btnOpenTxt}>Ver vaga completa →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={vs.btnUnlock} onPress={() => handleUnlock(item.id)}>
            <Text style={vs.btnUnlockTxt}>🎬  Assistir anúncio para ver detalhes</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [unlocked]);

  return (
    <SafeAreaView style={vs.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <AdBanner />

      {/* Header com voltar */}
      <View style={vs.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={vs.backTxt}>← Início</Text>
        </TouchableOpacity>
        <Text style={vs.headerTitle}>💼 Vagas que pagam mais</Text>
      </View>

      {/* Filtros */}
      <View style={vs.filtersSection}>
        {/* Área */}
        <FlatList
          horizontal
          data={AREAS}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          contentContainerStyle={vs.filterRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[vs.filterChip, selectedArea === item && vs.filterChipActive]}
              onPress={() => setSelectedArea(item)}
            >
              <Text style={[vs.filterChipTxt, selectedArea === item && vs.filterChipTxtActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
        {/* Salário */}
        <FlatList
          horizontal
          data={SALARY_RANGES}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => `sal-${i}`}
          contentContainerStyle={vs.filterRow}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[vs.filterChip, selectedSalary === index && vs.filterChipActive]}
              onPress={() => setSelectedSalary(index)}
            >
              <Text style={[vs.filterChipTxt, selectedSalary === index && vs.filterChipTxtActive]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
        {/* Tipo de trabalho */}
        <FlatList
          horizontal
          data={WORK_TYPES}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          contentContainerStyle={vs.filterRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[vs.filterChip, selectedWork === item && vs.filterChipActive]}
              onPress={() => setSelectedWork(item)}
            >
              <Text style={[vs.filterChipTxt, selectedWork === item && vs.filterChipTxtActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Lista */}
      {loading ? (
        <View style={vs.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={vs.loadingTxt}>Buscando vagas...</Text>
        </View>
      ) : filteredVagas.length === 0 ? (
        <View style={vs.emptyWrap}>
          <Text style={vs.emptyEmoji}>🔍</Text>
          <Text style={vs.emptyTitle}>Nenhuma vaga encontrada</Text>
          <Text style={vs.emptyTxt}>Tente alterar os filtros.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVagas}
          keyExtractor={item => item.id}
          renderItem={renderVaga}
          contentContainerStyle={vs.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const vs = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.dark },
  header:          { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backTxt:         { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
  headerTitle:     { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  filtersSection:  { paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.07)' },
  filterRow:       { paddingHorizontal: 16, gap: 6, paddingVertical: 4 },
  filterChip:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  filterChipActive:{ borderColor: COLORS.primary, backgroundColor: 'rgba(245,168,32,0.15)' },
  filterChipTxt:   { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  filterChipTxtActive: { color: COLORS.primary },
  loadingWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:      { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  emptyWrap:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyEmoji:      { fontSize: 48 },
  emptyTitle:      { fontSize: 20, fontWeight: '800', color: '#fff' },
  emptyTxt:        { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  list:            { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, gap: 10 },
  card:            { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden' },
  cardContent:     { padding: 14 },
  cardTitle:       { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 6, lineHeight: 20 },
  cardSalary:      { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  unlockDetails:   { paddingHorizontal: 14, paddingBottom: 10, gap: 4 },
  detailCompany:   { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  detailLocation:  { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  btnOpen:         { backgroundColor: 'rgba(23,200,232,0.12)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, alignItems: 'center' },
  btnOpenTxt:      { color: COLORS.secondary, fontSize: 14, fontWeight: '700' },
  btnUnlock:       { backgroundColor: 'rgba(245,168,32,0.12)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, alignItems: 'center' },
  btnUnlockTxt:    { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});
