// app/compartilhar.tsx
// Compartilhar resultado — interstitial + card chamativo + opções de privacidade

import { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity, Share, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import AdBanner from '../components/AdBanner';
import { useInterstitial } from '../lib/useInterstitial';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { fmtBRL } from '../lib/salary';

export default function CompartilharScreen() {
  const result = useOnboardingStore(s => s.result);
  const [showCargo, setShowCargo]    = useState(true);
  const [showSalario, setShowSalario] = useState(false);
  const [unlocked, setUnlocked]       = useState(false);
  const { showAdThenDo } = useInterstitial(['salario', 'carreira', 'compartilhar']);

  // Se não tem resultado, pede para fazer análise
  if (!result) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
        <AdBanner />
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={s.backTxt}>← Início</Text>
          </TouchableOpacity>
        </View>
        <View style={s.emptyWrap}>
          <Text style={s.emptyEmoji}>🎬</Text>
          <Text style={s.emptyTitle}>Nada para compartilhar</Text>
          <Text style={s.emptyTxt}>Faça sua análise salarial primeiro.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(onboarding)/cargo')}>
            <Text style={s.emptyBtnTxt}>Fazer análise →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ab = result.diff >= 0;
  const pctText = `${Math.abs(result.diff)}%`;
  const dirText = ab ? 'ACIMA' : 'ABAIXO';
  const dirColor = ab ? COLORS.success : COLORS.danger;

  function handleUnlock() {
    showAdThenDo(() => setUnlocked(true));
  }

  async function handleShare() {
    let msg = `Descobri que meu salário está ${pctText} ${dirText.toLowerCase()} da média do mercado!`;
    if (showCargo) msg += `\nCargo: ${result.cargo.split('(')[0].trim()}`;
    if (showSalario) msg += `\nSalário: ${fmtBRL(result.my.total)}/mês`;
    msg += `\n\nDescubra o seu → quantoganha.com.br`;
    await Share.share({ message: msg });
  }

  if (!unlocked) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
        <AdBanner />
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={s.backTxt}>← Início</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>🎬 Compartilhar</Text>
        </View>
        <View style={s.lockedWrap}>
          <Text style={s.lockedIcon}>🎬</Text>
          <Text style={s.lockedTitle}>Compartilhe seu resultado</Text>
          <Text style={s.lockedSub}>Assista um anúncio para gerar seu card de compartilhamento personalizado.</Text>
          <TouchableOpacity style={s.unlockBtn} onPress={handleUnlock}>
            <Text style={s.unlockBtnTxt}>🎬  Desbloquear card</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <AdBanner />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={s.backTxt}>← Início</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🎬 Seu Card</Text>
      </View>

      <View style={s.cardWrap}>
        {/* Card chamativo */}
        <View style={[s.shareCard, { borderColor: dirColor + '40' }]}>
          <View style={[s.cardBadge, { backgroundColor: dirColor + '20' }]}>
            <Text style={[s.cardBadgeTxt, { color: dirColor }]}>Quanto Ganha!</Text>
          </View>

          <Text style={[s.cardPct, { color: dirColor }]}>{pctText}</Text>
          <Text style={[s.cardDir, { color: dirColor }]}>{dirText} DO MERCADO</Text>

          {showCargo && (
            <Text style={s.cardCargo}>{result.cargo.split('(')[0].trim()}</Text>
          )}
          {showSalario && (
            <Text style={s.cardSalario}>{fmtBRL(result.my.total)}/mês</Text>
          )}

          <View style={s.cardFooter}>
            <Text style={s.cardFooterTxt}>Dados do CAGED • quantoganha.com.br</Text>
          </View>
        </View>
      </View>

      {/* Opções de privacidade */}
      <View style={s.optionsSection}>
        <View style={s.optionRow}>
          <Text style={s.optionLabel}>Mostrar cargo</Text>
          <Switch value={showCargo} onValueChange={setShowCargo} trackColor={{ false: '#333', true: COLORS.primary + '60' }} thumbColor={showCargo ? COLORS.primary : '#999'} />
        </View>
        <View style={s.optionRow}>
          <Text style={s.optionLabel}>Mostrar salário</Text>
          <Switch value={showSalario} onValueChange={setShowSalario} trackColor={{ false: '#333', true: COLORS.primary + '60' }} thumbColor={showSalario ? COLORS.primary : '#999'} />
        </View>
      </View>

      <View style={s.ctaWrap}>
        <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
          <Text style={s.shareBtnTxt}>📤  Compartilhar agora</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.dark },
  header:        { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  backTxt:       { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
  headerTitle:   { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },

  // Empty
  emptyWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  emptyTxt:      { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  emptyBtn:      { backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  emptyBtnTxt:   { color: COLORS.dark, fontWeight: '800', fontSize: 15 },

  // Locked
  lockedWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  lockedIcon:    { fontSize: 56, marginBottom: 16 },
  lockedTitle:   { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8 },
  lockedSub:     { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  unlockBtn:     { width: '100%', backgroundColor: COLORS.primary, borderRadius: 28, height: 54, alignItems: 'center', justifyContent: 'center' },
  unlockBtnTxt:  { color: COLORS.dark, fontSize: 16, fontWeight: '900' },

  // Card
  cardWrap:      { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  shareCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardBadge:     { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginBottom: 20 },
  cardBadgeTxt:  { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  cardPct:       { fontSize: 72, fontWeight: '900', letterSpacing: -3, lineHeight: 78 },
  cardDir:       { fontSize: 16, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  cardCargo:     { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardSalario:   { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  cardFooter:    { marginTop: 16, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)', width: '100%', alignItems: 'center' },
  cardFooterTxt: { fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5 },

  // Options
  optionsSection:{ paddingHorizontal: 24, gap: 8, marginBottom: 12 },
  optionRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  optionLabel:   { fontSize: 14, fontWeight: '600', color: '#fff' },

  // CTA
  ctaWrap:       { paddingHorizontal: 24, paddingBottom: 24 },
  shareBtn:      { backgroundColor: COLORS.primary, borderRadius: 28, height: 54, alignItems: 'center', justifyContent: 'center' },
  shareBtnTxt:   { color: COLORS.dark, fontSize: 16, fontWeight: '900' },
});
