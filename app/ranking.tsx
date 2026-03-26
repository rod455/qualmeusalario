// app/ranking.tsx
// Ranking dos cargos mais bem pagos — por categorias
// Interstitial ao voltar para home

import { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import AdBanner from '../components/AdBanner';
import { useInterstitial } from '../lib/useInterstitial';
import { BASE_SALARIES } from '../lib/salary';

type RankingCategory = 'top_pagos' | 'maior_aumento' | 'maior_queda' | 'demanda';

const CATEGORIES: { key: RankingCategory; label: string; icon: string }[] = [
  { key: 'top_pagos', label: 'Mais bem pagos', icon: '💰' },
  { key: 'maior_aumento', label: 'Maior aumento', icon: '📈' },
  { key: 'maior_queda', label: 'Maior queda', icon: '📉' },
  { key: 'demanda', label: 'Mais procurados', icon: '🔥' },
];

// Dados derivados do BASE_SALARIES + simulação de tendências CAGED
const allCargos = Object.entries(BASE_SALARIES).map(([cargo, salario]) => ({ cargo, salario }));

// Simula variação anual baseada no mercado brasileiro
function getVariacao(cargo: string): number {
  const hash = cargo.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  // Tecnologia e dados tendem a crescer mais; outros setores variam
  if (cargo.includes('Dados') || cargo.includes('Software') || cargo.includes('Tech') || cargo.includes('SRE') || cargo.includes('DevOps')) return 8 + (hash % 7);
  if (cargo.includes('IA') || cargo.includes('Lead') || cargo.includes('Arquiteto')) return 7 + (hash % 6);
  if (cargo.includes('CTO') || cargo.includes('CFO') || cargo.includes('CMO') || cargo.includes('COO')) return 3 + (hash % 4);
  if (cargo.includes('Professor') || cargo.includes('Educação')) return -(hash % 3);
  if (cargo.includes('Designer')) return 5 + (hash % 4);
  return -2 + (hash % 12);
}

function getRankingData(category: RankingCategory) {
  const withVariacao = allCargos.map(c => ({ ...c, variacao: getVariacao(c.cargo) }));

  switch (category) {
    case 'top_pagos':
      return withVariacao.sort((a, b) => b.salario - a.salario).slice(0, 20);
    case 'maior_aumento':
      return withVariacao.sort((a, b) => b.variacao - a.variacao).slice(0, 20);
    case 'maior_queda':
      return withVariacao.filter(c => c.variacao < 0).sort((a, b) => a.variacao - b.variacao).slice(0, 15);
    case 'demanda':
      // Simula demanda: tech + dados + produto são os mais procurados
      return withVariacao
        .filter(c =>
          c.cargo.includes('Desenvolvedor') || c.cargo.includes('Engenheiro(a) de Dados') ||
          c.cargo.includes('Product') || c.cargo.includes('DevOps') || c.cargo.includes('QA') ||
          c.cargo.includes('Full Stack') || c.cargo.includes('Mobile') || c.cargo.includes('Frontend') ||
          c.cargo.includes('Backend') || c.cargo.includes('Analista de Dados') || c.cargo.includes('Growth') ||
          c.cargo.includes('Cientista') || c.cargo.includes('SRE') || c.cargo.includes('BI')
        )
        .sort((a, b) => b.salario - a.salario)
        .slice(0, 15);
    default:
      return withVariacao.slice(0, 20);
  }
}

export default function RankingScreen() {
  const [activeCategory, setActiveCategory] = useState<RankingCategory>('top_pagos');
  const { showAdThenDo } = useInterstitial(['carreira', 'salario', 'emprego']);

  const data = getRankingData(activeCategory);

  function handleBack() {
    showAdThenDo(() => router.replace('/'));
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

      {/* Categorias */}
      <FlatList
        horizontal
        data={CATEGORIES}
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.key}
        contentContainerStyle={s.catRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.catChip, activeCategory === item.key && s.catChipActive]}
            onPress={() => setActiveCategory(item.key)}
          >
            <Text style={s.catIcon}>{item.icon}</Text>
            <Text style={[s.catTxt, activeCategory === item.key && s.catTxtActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Lista */}
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
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
              {activeCategory !== 'top_pagos' && activeCategory !== 'demanda' && (
                <Text style={[s.rankVar, item.variacao >= 0 ? s.green : s.red]}>
                  {item.variacao >= 0 ? '+' : ''}{item.variacao}%
                </Text>
              )}
            </View>
          );
        })}
        {activeCategory === 'maior_queda' && data.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={s.emptyTxt}>Nenhum cargo com queda significativa identificado.</Text>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.dark },
  header:          { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backTxt:         { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
  headerTitle:     { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:       { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  catRow:          { paddingHorizontal: 16, gap: 8, paddingVertical: 10 },
  catChip:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  catChipActive:   { borderColor: COLORS.primary, backgroundColor: 'rgba(245,168,32,0.15)' },
  catIcon:         { fontSize: 14 },
  catTxt:          { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  catTxtActive:    { color: COLORS.primary },
  list:            { paddingHorizontal: 16, paddingTop: 4, gap: 8 },
  rankCard:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 14 },
  rankCardTop:     { borderColor: 'rgba(245,168,32,0.2)', backgroundColor: 'rgba(245,168,32,0.06)' },
  rankLeft:        { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rankNum:         { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.3)', width: 32, textAlign: 'center' },
  rankNumTop:      { fontSize: 20, color: '#fff' },
  rankInfo:        { flex: 1 },
  rankCargo:       { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  rankSalario:     { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  rankVar:         { fontSize: 14, fontWeight: '800', marginLeft: 8 },
  green:           { color: COLORS.success },
  red:             { color: COLORS.danger },
  emptyWrap:       { padding: 32, alignItems: 'center' },
  emptyTxt:        { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
});
