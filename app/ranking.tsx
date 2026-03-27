// app/ranking.tsx
// Ranking salarial filtrado por Área e Senioridade
// Interstitial ao voltar para home

import { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import AdBanner from '../components/AdBanner';
import { useInterstitial } from '../lib/useInterstitial';
import { BASE_SALARIES } from '../lib/salary';

// ─── Áreas ──────────────────────────────────────────────────────────────────

const AREAS = [
  'Todas', 'Tecnologia', 'Design & UX', 'Marketing', 'Vendas & Comercial',
  'Finanças', 'RH & People', 'Engenharia', 'Saúde', 'Educação', 'Jurídico', 'Operações',
] as const;

type Area = typeof AREAS[number];

const AREA_KEYWORDS: Record<Exclude<Area, 'Todas'>, string[]> = {
  'Tecnologia': [
    'Desenvolvedor', 'Engenheiro de Software', 'Engenheiro(a) de Software',
    'Tech Lead', 'Arquiteto', 'DevOps', 'SRE',
    'Engenheiro(a) de Dados', 'Engenheiro de Dados',
    'Analista de Dados', 'Cientista', 'Analista de BI',
    'QA', 'Scrum', 'Agile', 'Product',
    'CTO', 'Head de Tecnologia',
  ],
  'Design & UX': [
    'Designer UX', 'Designer Gráfico', 'UX Researcher', 'Motion Designer',
    'Web Designer', 'Head de Design',
  ],
  'Marketing': [
    'Marketing', 'Growth', 'SEO', 'Mídia Paga', 'Social Media',
    'Copywriter', 'CMO',
  ],
  'Vendas & Comercial': [
    'SDR', 'BDR', 'Executivo', 'Key Account', 'Gerente de Vendas',
    'Diretor(a) Comercial', 'Diretor Comercial', 'CSO', 'Closer',
    'Inside Sales', 'Customer Success',
  ],
  'Finanças': [
    'Financeiro', 'Controller', 'CFO', 'Contador', 'FP&A', 'Investimentos',
  ],
  'RH & People': [
    'Analista de RH', 'HRBP', 'People', 'Gerente de RH', 'CHRO',
  ],
  'Engenharia': [
    'Engenheiro(a) Civil', 'Engenheiro Civil',
    'Mecânico', 'Elétrico', 'Produção', 'Químico', 'Ambiental',
  ],
  'Saúde': [
    'Médico', 'Enfermeiro', 'Psicólogo', 'Fisioterapeuta', 'Nutricionista', 'Dentista',
  ],
  'Educação': [
    'Professor', 'Designer Instrucional',
  ],
  'Jurídico': [
    'Advogado', 'Compliance', 'DPO',
  ],
  'Operações': [
    'Analista de Operações', 'Gerente de Operações', 'COO', 'Gerente de Projetos',
  ],
};

function getArea(cargo: string): Area {
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS) as [Exclude<Area, 'Todas'>, string[]][]) {
    for (const kw of keywords) {
      if (cargo.includes(kw)) return area;
    }
  }
  return 'Todas';
}

// ─── Senioridade ────────────────────────────────────────────────────────────

const SENIORIDADES = ['Todos', 'Junior', 'Pleno', 'Senior', 'C-Level'] as const;
type Senioridade = typeof SENIORIDADES[number];

const C_LEVEL_KEYWORDS = ['CTO', 'CFO', 'CMO', 'COO', 'CSO', 'CHRO', 'Head', 'Diretor', 'Gerente'];

function getSenioridade(cargo: string): Senioridade | null {
  if (/Junior|Jr\b/i.test(cargo)) return 'Junior';
  if (/Pleno/i.test(cargo)) return 'Pleno';
  if (/Senior|Sr\b/i.test(cargo)) return 'Senior';
  for (const kw of C_LEVEL_KEYWORDS) {
    if (cargo.includes(kw)) return 'C-Level';
  }
  return null; // show only when filter is "Todos"
}

// ─── Dados pré-processados ──────────────────────────────────────────────────

const allCargos = Object.entries(BASE_SALARIES).map(([cargo, salario]) => ({
  cargo,
  salario,
  area: getArea(cargo),
  senioridade: getSenioridade(cargo),
}));

// ─── Componente ─────────────────────────────────────────────────────────────

export default function RankingScreen() {
  const [selectedArea, setSelectedArea] = useState<Area>('Todas');
  const [selectedSenioridade, setSelectedSenioridade] = useState<Senioridade>('Todos');
  const adShownRef = useRef(false);
  const { showAdThenDo } = useInterstitial(['carreira', 'salario', 'emprego']);

  const data = useMemo(() => {
    let filtered = allCargos;

    if (selectedArea !== 'Todas') {
      filtered = filtered.filter(c => c.area === selectedArea);
    }

    if (selectedSenioridade !== 'Todos') {
      filtered = filtered.filter(c => c.senioridade === selectedSenioridade);
    }

    return filtered.sort((a, b) => b.salario - a.salario);
  }, [selectedArea, selectedSenioridade]);

  function handleBack() {
    if (!adShownRef.current) {
      adShownRef.current = true;
      showAdThenDo(() => router.replace('/'));
    } else {
      router.replace('/');
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <AdBanner />

      <View style={s.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={s.backTxt}>← Início</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🏆 Ranking Salarial</Text>
        <Text style={s.headerSub}>Dados do CAGED — Atualizado 2025</Text>
      </View>

      {/* Área filter */}
      <View style={s.filterSection}>
        <Text style={s.filterLabel}>Área</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {AREAS.map(area => {
            const active = selectedArea === area;
            return (
              <TouchableOpacity
                key={area}
                style={[s.chip, active && s.chipActive]}
                onPress={() => setSelectedArea(area)}
              >
                <Text style={[s.chipTxt, active && s.chipTxtActive]}>{area}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Senioridade filter */}
      <View style={s.filterSection}>
        <Text style={s.filterLabel}>Senioridade</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {SENIORIDADES.map(sen => {
            const active = selectedSenioridade === sen;
            return (
              <TouchableOpacity
                key={sen}
                style={[s.chip, active && s.chipActive]}
                onPress={() => setSelectedSenioridade(sen)}
              >
                <Text style={[s.chipTxt, active && s.chipTxtActive]}>{sen}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista */}
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {data.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={s.emptyTxt}>Nenhum cargo encontrado para os filtros selecionados.</Text>
          </View>
        )}
        {data.map((item, i) => {
          const isTop3 = i < 3;
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
          return (
            <View key={item.cargo} style={[s.rankCard, isTop3 && s.rankCardTop]}>
              <View style={s.rankLeft}>
                <Text style={[s.rankNum, isTop3 && s.rankNumTop]}>
                  {medal || `${i + 1}º`}
                </Text>
                <View style={s.rankInfo}>
                  <Text style={s.rankCargo} numberOfLines={1}>{item.cargo.split('(')[0].trim()}</Text>
                  <Text style={s.rankSalario}>R$ {item.salario.toLocaleString('pt-BR')}/mês</Text>
                </View>
              </View>
            </View>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.dark },
  header:          { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backTxt:         { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
  headerTitle:     { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:       { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },

  // Filter rows
  filterSection:   { paddingLeft: 20, marginBottom: 4 },
  filterLabel:     { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  chipRow:         { gap: 8, paddingRight: 20, paddingBottom: 8 },
  chip:            {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipActive:      {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  chipTxt:         { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  chipTxtActive:   { color: '#0B1838' },

  // Ranking list
  list:            { paddingHorizontal: 16, paddingTop: 4, gap: 8 },
  rankCard:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 14 },
  rankCardTop:     { borderColor: 'rgba(245,168,32,0.2)', backgroundColor: 'rgba(245,168,32,0.06)' },
  rankLeft:        { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rankNum:         { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.3)', width: 32, textAlign: 'center' },
  rankNumTop:      { fontSize: 20, color: '#fff' },
  rankInfo:        { flex: 1 },
  rankCargo:       { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  rankSalario:     { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  emptyWrap:       { padding: 32, alignItems: 'center' },
  emptyTxt:        { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
});
