// app/vagas.tsx
// Tela de vagas — filtros (Area, Salario, Tipo) + interstitial para destravar cada vaga
// v2: expanded card com descricao in-app + sistema de favoritos

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  FlatList, Linking, ActivityIndicator, Alert, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { COLORS, ADZUNA_APP_ID, ADZUNA_APP_KEY } from '../lib/constants';
import AdBanner from '../components/AdBanner';
import { useInterstitial } from '../lib/useInterstitial';
import { useAuth } from '../lib/useAuth';

type Vaga = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
  workType?: string;
  description?: string;
};

type FavVaga = {
  id: string;
  title: string;
  company: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
};

const FAV_KEY = '@qg_favorites';

const AREAS = ['Todas', 'Tecnologia', 'Marketing', 'Vendas', 'Financas', 'RH', 'Design', 'Engenharia', 'Saude'];
const SALARY_RANGES = [
  { label: 'Qualquer', min: 0, max: 999999 },
  { label: 'Ate 5k', min: 0, max: 5000 },
  { label: '5k-10k', min: 5000, max: 10000 },
  { label: '10k-20k', min: 10000, max: 20000 },
  { label: '20k+', min: 20000, max: 999999 },
];
const WORK_TYPES = ['Todos', 'Presencial', 'Remoto', 'Hibrido'];

const AREA_SEARCH_TERMS: Record<string, string> = {
  'Todas': '',
  'Tecnologia': 'desenvolvedor software programador TI',
  'Marketing': 'marketing digital growth',
  'Vendas': 'vendas comercial executivo',
  'Financas': 'financeiro contabil controller',
  'RH': 'recursos humanos recrutamento',
  'Design': 'designer UX UI',
  'Engenharia': 'engenheiro engenharia',
  'Saude': 'medico enfermeiro saude',
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function dedupeVagas(vagas: Vaga[]): Vaga[] {
  const seen = new Set<string>();
  return vagas.filter(v => {
    const key = `${v.title}-${v.company}`.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
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
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  // Favoritos
  const [favorites, setFavorites]     = useState<FavVaga[]>([]);
  const [showFavOnly, setShowFavOnly] = useState(false);

  const { isLoggedIn } = useAuth();
  const { showAdThenDo } = useInterstitial(['vaga emprego', 'salario', 'carreira', 'trabalho remoto']);

  // Carrega favoritos do AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(FAV_KEY).then(raw => {
      if (raw) {
        try { setFavorites(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  // Persiste favoritos
  const persistFavs = useCallback(async (favs: FavVaga[]) => {
    setFavorites(favs);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(favs));
  }, []);

  useEffect(() => { fetchVagas(); }, [selectedArea]);

  async function fetchVagas() {
    setLoading(true);
    try {
      const searchTerm = AREA_SEARCH_TERMS[selectedArea] || 'emprego';
      const query = encodeURIComponent(searchTerm);
      const url = `https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=25&what=${query}`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        console.log('Adzuna API error:', res.status);
        return;
      }

      const data = await res.json();

      if (data.results) {
        const mapped: Vaga[] = data.results.map((r: any, i: number) => ({
          id: r.id?.toString() ?? `vaga-${i}`,
          title: r.title ?? 'Vaga sem titulo',
          company: r.company?.display_name ?? 'Empresa confidencial',
          location: r.location?.display_name ?? 'Brasil',
          salary_min: r.salary_min ? Math.round(r.salary_min) : undefined,
          salary_max: r.salary_max ? Math.round(r.salary_max) : undefined,
          url: r.redirect_url ?? '',
          workType: r.contract_type ?? '',
          description: r.description ? stripHtml(r.description) : '',
        }));
        setVagas(dedupeVagas(mapped));
      }
    } catch (e) {
      console.log('Erro ao buscar vagas:', e);
    } finally {
      setLoading(false);
    }
  }

  const favIds = new Set(favorites.map(f => f.id));

  const filteredVagas = vagas.filter(v => {
    // Filtro de favoritos
    if (showFavOnly && !favIds.has(v.id)) return false;
    // Filtro de salario
    const range = SALARY_RANGES[selectedSalary];
    const sal = v.salary_max ?? v.salary_min ?? 0;
    if (sal > 0 && (sal < range.min || sal > range.max)) return false;
    // Filtro de tipo de trabalho
    if (selectedWork !== 'Todos' && v.workType) {
      const norm = v.workType.toLowerCase();
      if (selectedWork === 'Remoto' && !norm.includes('remot') && !norm.includes('home')) return false;
      if (selectedWork === 'Presencial' && (norm.includes('remot') || norm.includes('home') || norm.includes('hibrid') || norm.includes('hybrid'))) return false;
      if (selectedWork === 'Hibrido' && !norm.includes('hibrid') && !norm.includes('hybrid')) return false;
    }
    return true;
  });

  function handleUnlock(vagaId: string) {
    if (unlocked.has(vagaId)) return;
    showAdThenDo(() => {
      setUnlocked(prev => new Set(prev).add(vagaId));
      setExpandedId(vagaId);
    });
  }

  function handleToggleFav(vaga: Vaga) {
    if (!isLoggedIn) {
      Alert.alert(
        'Conta necessaria',
        'Crie uma conta para salvar favoritos',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Criar conta', onPress: () => router.push('/cadastro') },
        ],
      );
      return;
    }

    const isFav = favIds.has(vaga.id);
    if (isFav) {
      persistFavs(favorites.filter(f => f.id !== vaga.id));
    } else {
      const newFav: FavVaga = {
        id: vaga.id,
        title: vaga.title,
        company: vaga.company,
        salary_min: vaga.salary_min,
        salary_max: vaga.salary_max,
        url: vaga.url,
      };
      persistFavs([...favorites, newFav]);
    }
  }

  const fmtSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'A combinar';
    const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`;
    if (min && max && min !== max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return fmt(min);
    return fmt(max!);
  };

  const renderVaga = useCallback(({ item }: { item: Vaga }) => {
    const isUnlocked = unlocked.has(item.id);
    const isExpanded = expandedId === item.id && isUnlocked;
    const isFav = favIds.has(item.id);

    return (
      <View style={vs.card}>
        {/* Titulo + Salario sempre visiveis */}
        <TouchableOpacity
          style={vs.cardContent}
          activeOpacity={isUnlocked ? 0.7 : 1}
          onPress={() => {
            if (isUnlocked) {
              setExpandedId(isExpanded ? null : item.id);
            }
          }}
        >
          <View style={vs.cardTopRow}>
            <View style={vs.cardTitleWrap}>
              <Text style={vs.cardTitle} numberOfLines={isExpanded ? undefined : 2}>{item.title}</Text>
              <Text style={vs.cardSalary}>{fmtSalary(item.salary_min, item.salary_max)}</Text>
            </View>
            {isUnlocked && (
              <TouchableOpacity
                style={vs.favBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => handleToggleFav(item)}
              >
                <Text style={[vs.favIcon, isFav && vs.favIconActive]}>
                  {isFav ? '\u2B50' : '\u2606'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {isUnlocked && isExpanded ? (
          <View style={vs.expandedSection}>
            <View style={vs.detailRow}>
              <Text style={vs.detailLabel}>Empresa</Text>
              <Text style={vs.detailValue}>{item.company}</Text>
            </View>
            <View style={vs.detailRow}>
              <Text style={vs.detailLabel}>Local</Text>
              <Text style={vs.detailValue}>{item.location}</Text>
            </View>
            <View style={vs.detailRow}>
              <Text style={vs.detailLabel}>Salario</Text>
              <Text style={[vs.detailValue, { color: COLORS.primary }]}>
                {fmtSalary(item.salary_min, item.salary_max)}
              </Text>
            </View>

            {item.description ? (
              <View style={vs.descriptionWrap}>
                <Text style={vs.detailLabel}>Descricao</Text>
                <ScrollView
                  style={vs.descriptionScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={vs.descriptionTxt}>{item.description}</Text>
                </ScrollView>
              </View>
            ) : null}

            <View style={vs.expandedActions}>
              <TouchableOpacity
                style={vs.btnApply}
                onPress={() => {
                  if (!item.url) return;
                  Linking.openURL(item.url).catch(err => console.log('Erro ao abrir link:', err));
                }}
              >
                <Text style={vs.btnApplyTxt}>Se candidatar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isUnlocked && !isExpanded ? (
          <TouchableOpacity
            style={vs.collapsedUnlocked}
            onPress={() => setExpandedId(item.id)}
          >
            <Text style={vs.collapsedCompany}>{item.company}</Text>
            <Text style={vs.collapsedHint}>Toque para ver detalhes</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={vs.btnUnlock} onPress={() => handleUnlock(item.id)}>
            <Text style={vs.btnUnlockTxt}>Assistir anuncio para ver detalhes</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [unlocked, expandedId, favorites]);

  return (
    <SafeAreaView style={vs.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <AdBanner />

      {/* Header com voltar */}
      <View style={vs.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={vs.backTxt}>{'\u2190'} Inicio</Text>
        </TouchableOpacity>
        <Text style={vs.headerTitle}>Vagas que pagam mais</Text>
      </View>

      {/* Filtros */}
      <View style={vs.filtersSection}>
        {/* Toggle favoritos + Area */}
        <FlatList
          horizontal
          data={['Favoritos', ...AREAS]}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          contentContainerStyle={vs.filterRow}
          renderItem={({ item }) => {
            if (item === 'Favoritos') {
              return (
                <TouchableOpacity
                  style={[vs.filterChip, vs.favChip, showFavOnly && vs.favChipActive]}
                  onPress={() => setShowFavOnly(prev => !prev)}
                >
                  <Text style={[vs.filterChipTxt, showFavOnly && vs.favChipTxtActive]}>
                    {'\u2B50'} Favoritos{favorites.length > 0 ? ` (${favorites.length})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                style={[vs.filterChip, selectedArea === item && vs.filterChipActive]}
                onPress={() => { setSelectedArea(item); setShowFavOnly(false); }}
              >
                <Text style={[vs.filterChipTxt, selectedArea === item && vs.filterChipTxtActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
        {/* Salario */}
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
          <Text style={vs.emptyEmoji}>{showFavOnly ? '\u2B50' : '\uD83D\uDD0D'}</Text>
          <Text style={vs.emptyTitle}>
            {showFavOnly ? 'Nenhum favorito ainda' : 'Nenhuma vaga encontrada'}
          </Text>
          <Text style={vs.emptyTxt}>
            {showFavOnly ? 'Destrave vagas e toque no icone de estrela para salvar.' : 'Tente alterar os filtros.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVagas}
          keyExtractor={item => item.id}
          renderItem={renderVaga}
          contentContainerStyle={vs.list}
          showsVerticalScrollIndicator={false}
          extraData={[unlocked, expandedId, favorites]}
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

  favChip:         { borderColor: 'rgba(255,200,50,0.25)', backgroundColor: 'rgba(255,200,50,0.06)' },
  favChipActive:   { borderColor: COLORS.primary, backgroundColor: 'rgba(245,168,32,0.2)' },
  favChipTxtActive:{ color: COLORS.primary, fontWeight: '700' },

  loadingWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:      { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  emptyWrap:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyEmoji:      { fontSize: 48 },
  emptyTitle:      { fontSize: 20, fontWeight: '800', color: '#fff' },
  emptyTxt:        { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

  list:            { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, gap: 10 },

  card:            { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden' },
  cardContent:     { padding: 14 },
  cardTopRow:      { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitleWrap:   { flex: 1 },
  cardTitle:       { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 6, lineHeight: 20 },
  cardSalary:      { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  favBtn:          { marginLeft: 10, paddingTop: 2 },
  favIcon:         { fontSize: 22, color: 'rgba(255,255,255,0.25)' },
  favIconActive:   { color: '#F5A820' },

  /* Expanded card (after unlock) */
  expandedSection: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  detailRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' },
  detailLabel:     { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue:     { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)', flexShrink: 1, textAlign: 'right', maxWidth: '65%' as any },

  descriptionWrap: { marginTop: 10 },
  descriptionScroll: { maxHeight: 180, marginTop: 6, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 12 },
  descriptionTxt:  { fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.6)' },

  expandedActions: { flexDirection: 'row', marginTop: 14, gap: 10 },
  btnApply:        { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  btnApplyTxt:     { color: COLORS.dark, fontSize: 15, fontWeight: '800' },

  /* Collapsed but unlocked — shows company name + tap hint */
  collapsedUnlocked: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collapsedCompany:  { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  collapsedHint:     { fontSize: 11, color: COLORS.secondary, fontWeight: '600' },

  /* Unlock button (before unlock) */
  btnUnlock:       { backgroundColor: 'rgba(245,168,32,0.12)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, alignItems: 'center' },
  btnUnlockTxt:    { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});
