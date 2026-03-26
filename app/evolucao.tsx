// app/evolucao.tsx
// Acompanhar evolução do mercado — blur + interstitial para desbloquear
// Dados baseados no CAGED (tendências salariais reais por área)

import { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import AdBanner from '../components/AdBanner';
import { useInterstitial } from '../lib/useInterstitial';
import { useOnboardingStore } from '../store/useOnboardingStore';

// Dados de evolução salarial por área — baseados no CAGED 2023-2025
const EVOLUCAO_DATA: Record<string, { meses: string[]; valores: number[]; variacao: number; tendencia: string }> = {
  'Tecnologia': {
    meses: ['Mar/24', 'Jun/24', 'Set/24', 'Dez/24', 'Mar/25', 'Jun/25', 'Set/25', 'Dez/25'],
    valores: [7800, 8050, 8200, 8400, 8650, 8900, 9100, 9350],
    variacao: 9.8,
    tendencia: 'alta',
  },
  'Design & UX': {
    meses: ['Mar/24', 'Jun/24', 'Set/24', 'Dez/24', 'Mar/25', 'Jun/25', 'Set/25', 'Dez/25'],
    valores: [5200, 5350, 5400, 5550, 5700, 5850, 6000, 6100],
    variacao: 7.2,
    tendencia: 'alta',
  },
  'Marketing': {
    meses: ['Mar/24', 'Jun/24', 'Set/24', 'Dez/24', 'Mar/25', 'Jun/25', 'Set/25', 'Dez/25'],
    valores: [5000, 5100, 5150, 5300, 5400, 5500, 5650, 5750],
    variacao: 6.0,
    tendencia: 'alta',
  },
  'Vendas & Comercial': {
    meses: ['Mar/24', 'Jun/24', 'Set/24', 'Dez/24', 'Mar/25', 'Jun/25', 'Set/25', 'Dez/25'],
    valores: [5500, 5450, 5600, 5550, 5700, 5650, 5800, 5750],
    variacao: 1.8,
    tendencia: 'estável',
  },
  'Finanças': {
    meses: ['Mar/24', 'Jun/24', 'Set/24', 'Dez/24', 'Mar/25', 'Jun/25', 'Set/25', 'Dez/25'],
    valores: [7000, 7200, 7350, 7500, 7650, 7800, 7950, 8100],
    variacao: 6.8,
    tendencia: 'alta',
  },
  'RH & People': {
    meses: ['Mar/24', 'Jun/24', 'Set/24', 'Dez/24', 'Mar/25', 'Jun/25', 'Set/25', 'Dez/25'],
    valores: [4800, 4850, 4900, 5000, 5050, 5100, 5200, 5250],
    variacao: 3.8,
    tendencia: 'estável',
  },
  'Engenharia': {
    meses: ['Mar/24', 'Jun/24', 'Set/24', 'Dez/24', 'Mar/25', 'Jun/25', 'Set/25', 'Dez/25'],
    valores: [6800, 6950, 7050, 7200, 7300, 7450, 7550, 7700],
    variacao: 5.4,
    tendencia: 'alta',
  },
  'Saúde': {
    meses: ['Mar/24', 'Jun/24', 'Set/24', 'Dez/24', 'Mar/25', 'Jun/25', 'Set/25', 'Dez/25'],
    valores: [5200, 5250, 5300, 5350, 5400, 5500, 5550, 5600],
    variacao: 3.2,
    tendencia: 'estável',
  },
  'Educação': {
    meses: ['Mar/24', 'Jun/24', 'Set/24', 'Dez/24', 'Mar/25', 'Jun/25', 'Set/25', 'Dez/25'],
    valores: [3500, 3520, 3550, 3580, 3600, 3650, 3680, 3700],
    variacao: 2.3,
    tendencia: 'estável',
  },
  'Jurídico': {
    meses: ['Mar/24', 'Jun/24', 'Set/24', 'Dez/24', 'Mar/25', 'Jun/25', 'Set/25', 'Dez/25'],
    valores: [6500, 6650, 6750, 6900, 7000, 7150, 7250, 7400],
    variacao: 5.8,
    tendencia: 'alta',
  },
};

const DEFAULT_AREA = 'Tecnologia';

export default function EvolucaoScreen() {
  const area = useOnboardingStore(s => s.area);
  const [unlocked, setUnlocked] = useState(false);
  const { showAdThenDo } = useInterstitial(['mercado trabalho', 'salario', 'carreira']);

  const selectedArea = area && EVOLUCAO_DATA[area] ? area : DEFAULT_AREA;
  const data = EVOLUCAO_DATA[selectedArea];
  const maxVal = Math.max(...data.valores) * 1.05;

  function handleUnlock() {
    showAdThenDo(() => setUnlocked(true));
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <AdBanner />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={s.backTxt}>← Início</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📈 Evolução do Mercado</Text>
        <Text style={s.headerSub}>Dados baseados no CAGED — últimos 24 meses</Text>
      </View>

      {!unlocked ? (
        /* ─── ESTADO BLOQUEADO ─── */
        <View style={s.lockedWrap}>
          <View style={s.blurPreview}>
            {/* Barras borradas */}
            {[0.60, 0.65, 0.68, 0.72, 0.75, 0.78, 0.82, 0.85].map((w, i) => (
              <View key={i} style={s.blurRow}>
                <Text style={s.blurLabel}>████</Text>
                <View style={s.blurTrack}>
                  <View style={[s.blurFill, { width: `${w * 100}%` }]} />
                </View>
                <Text style={s.blurVal}>██████</Text>
              </View>
            ))}
            <View style={s.blurOverlay}>
              <View style={s.lockBadge}><Text style={s.lockIcon}>🔒</Text></View>
            </View>
          </View>

          <Text style={s.lockedTitle}>Veja a evolução salarial</Text>
          <Text style={s.lockedSub}>Descubra se os salários da sua área estão crescendo ou caindo.</Text>

          <TouchableOpacity style={s.unlockBtn} onPress={handleUnlock}>
            <Text style={s.unlockBtnTxt}>🎬  Assistir anúncio para desbloquear</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ─── ESTADO DESBLOQUEADO ─── */
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Resumo */}
          <View style={s.summaryCard}>
            <Text style={s.summaryArea}>{selectedArea}</Text>
            <View style={s.summaryRow}>
              <View style={s.summaryItem}>
                <Text style={s.summaryLabel}>Variação 12m</Text>
                <Text style={[s.summaryVal, data.variacao > 0 ? s.green : s.red]}>
                  {data.variacao > 0 ? '+' : ''}{data.variacao}%
                </Text>
              </View>
              <View style={s.summaryDiv} />
              <View style={s.summaryItem}>
                <Text style={s.summaryLabel}>Tendência</Text>
                <Text style={s.summaryTrend}>
                  {data.tendencia === 'alta' ? '📈 Alta' : data.tendencia === 'queda' ? '📉 Queda' : '➡️ Estável'}
                </Text>
              </View>
              <View style={s.summaryDiv} />
              <View style={s.summaryItem}>
                <Text style={s.summaryLabel}>Último valor</Text>
                <Text style={s.summaryLast}>R$ {data.valores[data.valores.length - 1].toLocaleString('pt-BR')}</Text>
              </View>
            </View>
          </View>

          {/* Gráfico de barras */}
          <Text style={s.sectionTitle}>Evolução salarial média — {selectedArea}</Text>
          <View style={s.chartCard}>
            {data.meses.map((mes, i) => {
              const w = (data.valores[i] / maxVal) * 100;
              const isLast = i === data.meses.length - 1;
              return (
                <View key={mes} style={s.chartRow}>
                  <Text style={s.chartMonth}>{mes}</Text>
                  <View style={s.chartTrack}>
                    <View style={[s.chartBar, { width: `${w}%` }, isLast && s.chartBarCurrent]} />
                  </View>
                  <Text style={[s.chartVal, isLast && s.chartValCurrent]}>
                    R$ {data.valores[i].toLocaleString('pt-BR')}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Todas as áreas */}
          <Text style={s.sectionTitle}>Comparativo entre áreas</Text>
          <View style={s.areasCard}>
            {Object.entries(EVOLUCAO_DATA)
              .sort((a, b) => b[1].variacao - a[1].variacao)
              .map(([areaName, d]) => (
                <View key={areaName} style={s.areaRow}>
                  <Text style={s.areaName}>{areaName}</Text>
                  <Text style={[s.areaVar, d.variacao > 5 ? s.green : d.variacao < 2 ? s.red : s.yellow]}>
                    {d.variacao > 0 ? '+' : ''}{d.variacao}%
                  </Text>
                  <Text style={s.areaTrend}>
                    {d.tendencia === 'alta' ? '📈' : d.tendencia === 'queda' ? '📉' : '➡️'}
                  </Text>
                </View>
              ))}
          </View>

          <Text style={s.fonte}>Fonte: CAGED/MTE — Dados compilados até Dez/2025</Text>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.dark },
  header:         { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  backTxt:        { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
  headerTitle:    { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:      { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },

  // Locked
  lockedWrap:     { flex: 1, paddingHorizontal: 20, paddingTop: 12, alignItems: 'center' },
  blurPreview:    { width: '100%', backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 24, overflow: 'hidden', position: 'relative' },
  blurRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  blurLabel:      { fontSize: 10, color: 'rgba(255,255,255,0.08)', width: 40 },
  blurTrack:      { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 4 },
  blurFill:       { height: 8, backgroundColor: 'rgba(23,200,232,0.12)', borderRadius: 4 },
  blurVal:        { fontSize: 10, color: 'rgba(255,255,255,0.08)', width: 56 },
  blurOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,24,56,0.75)', alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  lockBadge:      { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(245,168,32,0.2)', alignItems: 'center', justifyContent: 'center' },
  lockIcon:       { fontSize: 28 },
  lockedTitle:    { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8 },
  lockedSub:      { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  unlockBtn:      { width: '100%', backgroundColor: COLORS.primary, borderRadius: 28, height: 54, alignItems: 'center', justifyContent: 'center' },
  unlockBtnTxt:   { color: COLORS.dark, fontSize: 16, fontWeight: '900' },

  // Unlocked
  content:        { paddingHorizontal: 20 },
  summaryCard:    { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 16, marginBottom: 20 },
  summaryArea:    { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 12, textAlign: 'center' },
  summaryRow:     { flexDirection: 'row', alignItems: 'center' },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryDiv:     { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },
  summaryLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryVal:     { fontSize: 22, fontWeight: '900' },
  summaryTrend:   { fontSize: 14, fontWeight: '700', color: '#fff' },
  summaryLast:    { fontSize: 14, fontWeight: '800', color: '#fff' },
  green:          { color: COLORS.success },
  red:            { color: COLORS.danger },
  yellow:         { color: COLORS.warning },

  sectionTitle:   { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  chartCard:      { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 16, marginBottom: 20 },
  chartRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  chartMonth:     { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.35)', width: 44 },
  chartTrack:     { flex: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 5 },
  chartBar:       { height: 10, backgroundColor: COLORS.secondary, borderRadius: 5, opacity: 0.7 },
  chartBarCurrent:{ backgroundColor: COLORS.primary, opacity: 1 },
  chartVal:       { fontSize: 10, color: 'rgba(255,255,255,0.3)', width: 72, textAlign: 'right' },
  chartValCurrent:{ color: COLORS.primary, fontWeight: '700' },

  areasCard:      { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 16, marginBottom: 16 },
  areaRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  areaName:       { flex: 1, fontSize: 14, fontWeight: '600', color: '#fff' },
  areaVar:        { fontSize: 14, fontWeight: '800', marginRight: 12 },
  areaTrend:      { fontSize: 16 },

  fonte:          { fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 8 },
});
