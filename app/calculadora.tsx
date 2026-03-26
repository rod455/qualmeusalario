// app/calculadora.tsx
// Calculadora de salário líquido — CLT brasileiro
// Interstitial para ver resultado

import { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import AdBanner from '../components/AdBanner';
import { useInterstitial } from '../lib/useInterstitial';

// ─── Tabela INSS 2025 (progressiva) ───
function calcINSS(bruto: number): number {
  const faixas = [
    { teto: 1518.00, aliq: 0.075 },
    { teto: 2793.88, aliq: 0.09 },
    { teto: 4190.83, aliq: 0.12 },
    { teto: 8157.41, aliq: 0.14 },
  ];

  let inss = 0;
  let anterior = 0;

  for (const f of faixas) {
    const base = Math.min(bruto, f.teto) - anterior;
    if (base <= 0) break;
    inss += base * f.aliq;
    anterior = f.teto;
  }

  return inss;
}

// ─── Tabela IRRF 2025 ───
function calcIRRF(baseIR: number): number {
  // Desconto simplificado mensal
  const descSimplificado = 564.80;
  const base = Math.max(0, baseIR - descSimplificado);

  const faixas = [
    { teto: 2259.20, aliq: 0, deducao: 0 },
    { teto: 2826.65, aliq: 0.075, deducao: 169.44 },
    { teto: 3751.05, aliq: 0.15, deducao: 381.44 },
    { teto: 4664.68, aliq: 0.225, deducao: 662.77 },
    { teto: Infinity, aliq: 0.275, deducao: 896.00 },
  ];

  for (const f of faixas) {
    if (base <= f.teto) {
      const ir = base * f.aliq - f.deducao;
      return Math.max(0, ir);
    }
  }

  return 0;
}

function calcLiquido(bruto: number, dependentes: number) {
  const inss = calcINSS(bruto);
  const deducaoDep = dependentes * 189.59; // Dedução por dependente 2025
  const baseIR = bruto - inss - deducaoDep;
  const irrf = calcIRRF(baseIR);
  const liquido = bruto - inss - irrf;

  return {
    bruto,
    inss: Math.round(inss * 100) / 100,
    irrf: Math.round(irrf * 100) / 100,
    liquido: Math.round(liquido * 100) / 100,
    aliqEfetiva: bruto > 0 ? Math.round(((inss + irrf) / bruto) * 1000) / 10 : 0,
  };
}

const fmt = (n: number) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CalculadoraScreen() {
  const [salarioStr, setSalarioStr] = useState('');
  const [dependentes, setDependentes] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const { showAdThenDo } = useInterstitial(['salario', 'emprego', 'CLT', 'calculadora']);

  const salario = parseFloat(salarioStr.replace(/\D/g, '')) || 0;
  const resultado = calcLiquido(salario, dependentes);

  function handleCalcular() {
    if (salario <= 0) return;
    showAdThenDo(() => setShowResult(true));
  }

  function handleReset() {
    setShowResult(false);
    setSalarioStr('');
    setDependentes(0);
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <AdBanner />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={s.backTxt}>← Início</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>💰 Calculadora CLT</Text>
        <Text style={s.headerSub}>Descubra seu salário líquido (INSS + IRRF 2025)</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {!showResult ? (
          /* ─── FORMULÁRIO ─── */
          <>
            <Text style={s.label}>Salário bruto mensal</Text>
            <View style={s.inputRow}>
              <Text style={s.prefix}>R$</Text>
              <TextInput
                style={s.input}
                value={salarioStr}
                onChangeText={t => setSalarioStr(t.replace(/\D/g, ''))}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="numeric"
              />
            </View>

            <Text style={[s.label, { marginTop: 20 }]}>Dependentes</Text>
            <View style={s.stepperRow}>
              <TouchableOpacity
                style={[s.stepperBtn, dependentes <= 0 && s.stepperBtnOff]}
                onPress={() => setDependentes(Math.max(0, dependentes - 1))}
                disabled={dependentes <= 0}
              >
                <Text style={s.stepperBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={s.stepperVal}>{dependentes}</Text>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setDependentes(dependentes + 1)}
              >
                <Text style={s.stepperBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.calcBtn, salario <= 0 && s.calcBtnDisabled]}
              onPress={handleCalcular}
              disabled={salario <= 0}
            >
              <Text style={s.calcBtnTxt}>Calcular salário líquido</Text>
            </TouchableOpacity>

            <View style={s.infoBox}>
              <Text style={s.infoTitle}>ℹ️ Como funciona</Text>
              <Text style={s.infoText}>Calculamos INSS (progressivo) e IRRF (com desconto simplificado) com base nas tabelas oficiais de 2025.</Text>
            </View>
          </>
        ) : (
          /* ─── RESULTADO ─── */
          <>
            <View style={s.resultCard}>
              <Text style={s.resultLabel}>SALÁRIO LÍQUIDO</Text>
              <Text style={s.resultVal}>{fmt(resultado.liquido)}</Text>
              <Text style={s.resultSub}>
                Alíquota efetiva: {resultado.aliqEfetiva}%
              </Text>
            </View>

            <View style={s.breakdownCard}>
              <View style={s.breakdownRow}>
                <Text style={s.breakdownLabel}>Salário bruto</Text>
                <Text style={s.breakdownVal}>{fmt(resultado.bruto)}</Text>
              </View>
              <View style={s.breakdownDivider} />
              <View style={s.breakdownRow}>
                <Text style={s.breakdownLabel}>INSS</Text>
                <Text style={[s.breakdownVal, s.red]}>- {fmt(resultado.inss)}</Text>
              </View>
              <View style={s.breakdownRow}>
                <Text style={s.breakdownLabel}>IRRF</Text>
                <Text style={[s.breakdownVal, s.red]}>- {fmt(resultado.irrf)}</Text>
              </View>
              <View style={s.breakdownDivider} />
              <View style={s.breakdownRow}>
                <Text style={s.breakdownLabelBold}>Total descontos</Text>
                <Text style={[s.breakdownValBold, s.red]}>- {fmt(resultado.inss + resultado.irrf)}</Text>
              </View>
              <View style={s.breakdownRow}>
                <Text style={s.breakdownLabelBold}>Líquido</Text>
                <Text style={[s.breakdownValBold, s.green]}>{fmt(resultado.liquido)}</Text>
              </View>
            </View>

            {/* Barra visual */}
            <View style={s.barCard}>
              <View style={s.barLabels}>
                <Text style={s.barLabelGreen}>Líquido ({Math.round((resultado.liquido / resultado.bruto) * 100)}%)</Text>
                <Text style={s.barLabelRed}>Descontos ({Math.round(resultado.aliqEfetiva)}%)</Text>
              </View>
              <View style={s.barTrack}>
                <View style={[s.barFillGreen, { width: `${(resultado.liquido / resultado.bruto) * 100}%` }]} />
              </View>
            </View>

            {dependentes > 0 && (
              <View style={s.depInfo}>
                <Text style={s.depInfoTxt}>
                  {dependentes} dependente{dependentes > 1 ? 's' : ''} = {fmt(dependentes * 189.59)} de dedução no IR
                </Text>
              </View>
            )}

            <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
              <Text style={s.resetBtnTxt}>Calcular outro valor</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.dark },
  header:          { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  backTxt:         { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
  headerTitle:     { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:       { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  content:         { paddingHorizontal: 20, paddingTop: 8 },

  // Form
  label:           { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  inputRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  prefix:          { fontSize: 18, fontWeight: '800', color: 'rgba(255,255,255,0.4)' },
  input:           { flex: 1, fontSize: 28, fontWeight: '800', color: '#fff', padding: 0 },
  stepperRow:      { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn:      { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  stepperBtnOff:   { opacity: 0.3 },
  stepperBtnTxt:   { fontSize: 24, fontWeight: '400', color: COLORS.primary },
  stepperVal:      { fontSize: 28, fontWeight: '900', color: '#fff', minWidth: 40, textAlign: 'center' },
  calcBtn:         { backgroundColor: COLORS.primary, borderRadius: 28, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  calcBtnDisabled: { opacity: 0.35 },
  calcBtnTxt:      { color: COLORS.dark, fontSize: 16, fontWeight: '900' },
  infoBox:         { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginTop: 20 },
  infoTitle:       { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 6 },
  infoText:        { fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 20 },

  // Result
  resultCard:      { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: 'rgba(29,190,117,0.3)', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 16 },
  resultLabel:     { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  resultVal:       { fontSize: 38, fontWeight: '900', color: COLORS.success, letterSpacing: -1.5 },
  resultSub:       { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 },
  breakdownCard:   { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 16, marginBottom: 16 },
  breakdownRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  breakdownLabel:  { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  breakdownVal:    { fontSize: 14, fontWeight: '700', color: '#fff' },
  breakdownLabelBold: { fontSize: 14, fontWeight: '700', color: '#fff' },
  breakdownValBold:   { fontSize: 16, fontWeight: '900' },
  breakdownDivider:   { height: 0.5, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 },
  red:             { color: COLORS.danger },
  green:           { color: COLORS.success },

  barCard:         { backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, marginBottom: 16 },
  barLabels:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barLabelGreen:   { fontSize: 11, fontWeight: '600', color: COLORS.success },
  barLabelRed:     { fontSize: 11, fontWeight: '600', color: COLORS.danger },
  barTrack:        { height: 12, backgroundColor: 'rgba(226,75,74,0.3)', borderRadius: 6, overflow: 'hidden' },
  barFillGreen:    { height: 12, backgroundColor: COLORS.success, borderRadius: 6 },

  depInfo:         { backgroundColor: 'rgba(245,168,32,0.08)', borderRadius: 12, padding: 12, marginBottom: 16 },
  depInfoTxt:      { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  resetBtn:        { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 28, height: 52, alignItems: 'center', justifyContent: 'center' },
  resetBtnTxt:     { color: COLORS.primary, fontSize: 15, fontWeight: '800' },
});
