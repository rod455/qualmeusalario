// app/(tabs)/vagas.tsx
// Tela de vagas — rewarded para destravar cada vaga
// Fix: retry mais agressivo, fallback auto-unlock, melhor UX

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  FlatList, Linking, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, ADZUNA_APP_ID, ADZUNA_APP_KEY, ADMOB } from '../../lib/constants';
import AdBanner from '../../components/AdBanner';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const IS_DEV = __DEV__;
const REWARDED_ID = IS_DEV
  ? TestIds.REWARDED
  : Platform.OS === 'ios'
    ? ADMOB.REWARDED_VAGAS_IOS
    : ADMOB.REWARDED_VAGAS_ANDROID;

type Vaga = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
};

export default function VagasScreen() {
  const result = useOnboardingStore(s => s.result);
  const [vagas, setVagas]           = useState<Vaga[]>([]);
  const [loading, setLoading]       = useState(true);
  const [unlocked, setUnlocked]     = useState<Set<string>>(new Set());
  const [adReady, setAdReady]       = useState(false);
  const [adLoading, setAdLoading]   = useState(true);
  const pendingIdRef                = useRef<string | null>(null);
  const adRef                       = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);
  const listenersRef                = useRef<(() => void)[]>([]);
  const retryCountRef               = useRef(0);
  const retryTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fetchVagas(); }, []);
  useEffect(() => {
    createAndLoadAd();
    return () => {
      cleanupListeners();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  function cleanupListeners() {
    listenersRef.current.forEach(fn => fn());
    listenersRef.current = [];
  }

  function createAndLoadAd() {
    cleanupListeners();
    setAdLoading(true);

    try {
      const ad = RewardedAd.createForAdRequest(REWARDED_ID, {
        keywords: ['vaga emprego', 'salario', 'carreira', 'trabalho remoto'],
      });
      adRef.current = ad;

      const u1 = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setAdReady(true);
        setAdLoading(false);
        retryCountRef.current = 0; // Reset retry count on success
      });

      const u2 = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        if (pendingIdRef.current) {
          setUnlocked(prev => new Set(prev).add(pendingIdRef.current!));
          pendingIdRef.current = null;
        }
      });

      const u3 = ad.addAdEventListener(AdEventType.CLOSED, () => {
        setAdReady(false);
        setAdLoading(true);
        // Se tinha um pending que não recebeu reward (fechou antes), destrava mesmo assim
        if (pendingIdRef.current) {
          setUnlocked(prev => new Set(prev).add(pendingIdRef.current!));
          pendingIdRef.current = null;
        }
        // Recarregar para próximo uso
        retryTimerRef.current = setTimeout(() => createAndLoadAd(), 500);
      });

      const u4 = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Rewarded ad error:', error);
        setAdReady(false);
        retryCountRef.current += 1;

        // Retry com backoff: 2s, 4s, 8s, 16s...
        const delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 30000);

        // Após 5 falhas seguidas, para de tentar e libera unlock grátis
        if (retryCountRef.current >= 5) {
          setAdLoading(false);
          console.log('Ad failed 5x, enabling free unlock');
        } else {
          retryTimerRef.current = setTimeout(() => {
            try { createAndLoadAd(); } catch {}
          }, delay);
        }
      });

      listenersRef.current = [u1, u2, u3, u4];
      ad.load();
    } catch (e) {
      console.log('Failed to create rewarded ad:', e);
      setAdLoading(false);
    }
  }

  async function fetchVagas() {
    setLoading(true);
    try {
      const cargo = result?.cargo?.split('(')[0]?.trim() ?? 'desenvolvedor';
      const query = encodeURIComponent(cargo);

      // Tentar com salary_min=1 para priorizar vagas com salário
      let url = `https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=20&what=${query}&salary_min=1&sort_by=salary&content-type=application/json`;
      let res = await fetch(url);
      let data = await res.json();

      // Fallback sem filtro de salário
      if (!data.results || data.results.length === 0) {
        url = `https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=20&what=${query}&content-type=application/json`;
        res = await fetch(url);
        data = await res.json();
      }

      if (data.results) {
        setVagas(data.results.map((r: any, i: number) => ({
          id: r.id?.toString() ?? `vaga-${i}`,
          title: r.title ?? 'Vaga sem título',
          company: r.company?.display_name ?? 'Empresa confidencial',
          location: r.location?.display_name ?? 'Brasil',
          salary_min: r.salary_min ? Math.round(r.salary_min) : undefined,
          salary_max: r.salary_max ? Math.round(r.salary_max) : undefined,
          url: r.redirect_url ?? '',
        })));
      }
    } catch (e) {
      console.log('Erro ao buscar vagas:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleUnlock(vagaId: string) {
    if (unlocked.has(vagaId)) return;

    if (adReady && adRef.current) {
      // Ad pronto — exibe
      pendingIdRef.current = vagaId;
      try {
        adRef.current.show();
      } catch {
        // Falhou ao exibir — destrava grátis
        setUnlocked(prev => new Set(prev).add(vagaId));
        pendingIdRef.current = null;
        createAndLoadAd();
      }
    } else if (retryCountRef.current >= 5) {
      // Ad falhou muitas vezes — destrava grátis (sem ad)
      setUnlocked(prev => new Set(prev).add(vagaId));
    } else {
      // Ad carregando — mostra feedback com opção de destravar grátis
      Alert.alert(
        'Anúncio carregando...',
        'O anúncio ainda está sendo preparado. Deseja tentar novamente ou destravar esta vaga gratuitamente?',
        [
          { text: 'Tentar novamente', style: 'cancel' },
          {
            text: 'Destravar grátis',
            onPress: () => setUnlocked(prev => new Set(prev).add(vagaId)),
          },
        ]
      );
    }
  }

  const fmtSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salário não informado';
    const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`;
    if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `A partir de ${fmt(min)}`;
    return `Até ${fmt(max!)}`;
  };

  const renderVaga = useCallback(({ item }: { item: Vaga }) => {
    const isUnlocked = unlocked.has(item.id);

    return (
      <View style={vs.card}>
        <View style={vs.cardContent}>
          <Text style={[vs.cardTitle, !isUnlocked && vs.blurred]} numberOfLines={isUnlocked ? 3 : 1}>
            {isUnlocked ? item.title : '██████ ████ ██████'}
          </Text>
          <Text style={[vs.cardCompany, !isUnlocked && vs.blurred]}>
            {isUnlocked ? item.company : '██████ ███████'}
          </Text>
          <View style={vs.cardMeta}>
            <Text style={[vs.cardLocation, !isUnlocked && vs.blurred]}>
              📍 {isUnlocked ? item.location : '████ ██'}
            </Text>
            <Text style={[vs.cardSalary, !isUnlocked && vs.blurredSalary]}>
              💰 {isUnlocked ? fmtSalary(item.salary_min, item.salary_max) : 'R$ █████ – █████'}
            </Text>
          </View>
        </View>

        {isUnlocked ? (
          <TouchableOpacity style={vs.btnOpen} onPress={() => item.url && Linking.openURL(item.url)}>
            <Text style={vs.btnOpenTxt}>Ver vaga completa →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={vs.btnUnlock} onPress={() => handleUnlock(item.id)}>
            <Text style={vs.btnUnlockTxt}>
              {adReady ? '🎬  Assistir anúncio para destravar' :
               retryCountRef.current >= 5 ? '🔓  Destravar vaga' :
               '⏳  Carregando anúncio...'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [unlocked, adReady]);

  return (
    <SafeAreaView style={vs.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <AdBanner />

      <View style={vs.header}>
        <Text style={vs.headerTitle}>💼 Vagas para você</Text>
        <Text style={vs.headerSub}>
          {result ? `Baseado em: ${result.cargo.split('(')[0].trim()}` : 'Vagas disponíveis no mercado'}
        </Text>
        {adLoading && !adReady && retryCountRef.current < 5 && (
          <Text style={vs.adStatus}>⏳ Preparando anúncios...</Text>
        )}
      </View>

      {loading ? (
        <View style={vs.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={vs.loadingTxt}>Buscando vagas...</Text>
        </View>
      ) : vagas.length === 0 ? (
        <View style={vs.emptyWrap}>
          <Text style={vs.emptyEmoji}>🔍</Text>
          <Text style={vs.emptyTitle}>Nenhuma vaga encontrada</Text>
          <Text style={vs.emptyTxt}>Tente novamente mais tarde — novas vagas são adicionadas diariamente.</Text>
        </View>
      ) : (
        <FlatList
          data={vagas}
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
  safe:          { flex:1, backgroundColor:COLORS.dark },
  header:        { paddingHorizontal:20, paddingTop:16, paddingBottom:12 },
  headerTitle:   { fontSize:22, fontWeight:'900', color:'#fff', letterSpacing:-0.5 },
  headerSub:     { fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:4 },
  adStatus:      { fontSize:11, color:COLORS.primary, marginTop:6 },
  loadingWrap:   { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  loadingTxt:    { fontSize:14, color:'rgba(255,255,255,0.4)' },
  emptyWrap:     { flex:1, alignItems:'center', justifyContent:'center', padding:32, gap:12 },
  emptyEmoji:    { fontSize:48 },
  emptyTitle:    { fontSize:20, fontWeight:'800', color:'#fff' },
  emptyTxt:      { fontSize:14, color:'rgba(255,255,255,0.4)', textAlign:'center', lineHeight:22 },
  list:          { paddingHorizontal:16, paddingBottom:20, gap:12 },
  card:          { backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.07)', borderRadius:20, overflow:'hidden' },
  cardContent:   { padding:16 },
  cardTitle:     { fontSize:16, fontWeight:'800', color:'#fff', marginBottom:4, lineHeight:22 },
  cardCompany:   { fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:10 },
  cardMeta:      { gap:4 },
  cardLocation:  { fontSize:12, color:'rgba(255,255,255,0.4)' },
  cardSalary:    { fontSize:13, fontWeight:'700', color:COLORS.primary },
  blurred:       { color:'rgba(255,255,255,0.15)' },
  blurredSalary: { color:'rgba(255,255,255,0.15)' },
  btnOpen:       { backgroundColor:'rgba(23,200,232,0.12)', borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.05)', paddingVertical:14, alignItems:'center' },
  btnOpenTxt:    { color:COLORS.secondary, fontSize:14, fontWeight:'700' },
  btnUnlock:     { backgroundColor:'rgba(245,168,32,0.12)', borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.05)', paddingVertical:14, alignItems:'center' },
  btnUnlockTxt:  { color:COLORS.primary, fontSize:14, fontWeight:'700' },
});
