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
    ? ADMOB.REWARDED_IOS
    : ADMOB.REWARDED_ANDROID;

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
  const pendingIdRef                = useRef<string | null>(null);
  const adRef                       = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);
  const listenersRef                = useRef<(() => void)[]>([]);

  useEffect(() => { fetchVagas(); }, []);
  useEffect(() => { createAndLoadAd(); return () => cleanupListeners(); }, []);

  function cleanupListeners() {
    listenersRef.current.forEach(fn => fn());
    listenersRef.current = [];
  }

  function createAndLoadAd() {
    cleanupListeners();
    try {
      const ad = RewardedAd.createForAdRequest(REWARDED_ID, {
        keywords: ['vaga emprego', 'salario', 'carreira', 'trabalho remoto'],
      });
      adRef.current = ad;

      const u1 = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setAdReady(true);
      });

      const u2 = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        if (pendingIdRef.current) {
          setUnlocked(prev => new Set(prev).add(pendingIdRef.current!));
          pendingIdRef.current = null;
        }
      });

      const u3 = ad.addAdEventListener(AdEventType.CLOSED, () => {
        setAdReady(false);
        // Recarregar para próximo uso
        setTimeout(() => createAndLoadAd(), 500);
      });

      const u4 = ad.addAdEventListener(AdEventType.ERROR, () => {
        setAdReady(false);
        // Retry após 5s
        setTimeout(() => { try { ad.load(); } catch {} }, 5000);
      });

      listenersRef.current = [u1, u2, u3, u4];
      ad.load();
    } catch (e) {
      console.log('Failed to create rewarded ad:', e);
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
      pendingIdRef.current = vagaId;
      try {
        adRef.current.show();
      } catch {
        Alert.alert('Erro', 'Não foi possível exibir o anúncio. Tente novamente.');
        pendingIdRef.current = null;
      }
    } else {
      // NÃO destrava — avisa que o ad está carregando
      Alert.alert(
        'Aguarde...',
        'O anúncio está sendo carregado. Tente novamente em alguns segundos.',
        [{ text: 'OK' }]
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
            <Text style={vs.btnUnlockTxt}>🎬  Assistir anúncio para destravar</Text>
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
        {!adReady && <Text style={vs.adStatus}>⏳ Preparando anúncios...</Text>}
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
          <Text style={vs.emptySub}>Tente fazer uma análise primeiro para buscar vagas do seu cargo.</Text>
        </View>
      ) : (
        <FlatList
          data={vagas}
          keyExtractor={item => item.id}
          renderItem={renderVaga}
          contentContainerStyle={vs.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const vs = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.dark },
  header:       { paddingHorizontal:20, paddingTop:16, paddingBottom:12 },
  headerTitle:  { fontSize:22, fontWeight:'900', color:'#fff', letterSpacing:-0.5 },
  headerSub:    { fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:4 },
  adStatus:     { fontSize:11, color:'rgba(245,168,32,0.6)', marginTop:4 },
  list:         { paddingHorizontal:20, paddingBottom:24 },
  loadingWrap:  { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  loadingTxt:   { fontSize:14, color:'rgba(255,255,255,0.4)' },
  emptyWrap:    { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:32, gap:8 },
  emptyEmoji:   { fontSize:48 },
  emptyTitle:   { fontSize:20, fontWeight:'800', color:'#fff' },
  emptySub:     { fontSize:14, color:'rgba(255,255,255,0.4)', textAlign:'center', lineHeight:22 },

  card:         { backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.07)', borderRadius:20, padding:16, overflow:'hidden' },
  cardContent:  { marginBottom:14 },
  cardTitle:    { fontSize:16, fontWeight:'800', color:'#fff', letterSpacing:-0.3, marginBottom:4 },
  cardCompany:  { fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:'600', marginBottom:10 },
  cardMeta:     { gap:4 },
  cardLocation: { fontSize:12, color:'rgba(255,255,255,0.4)' },
  cardSalary:   { fontSize:13, fontWeight:'700', color:COLORS.success },

  blurred:       { color:'rgba(255,255,255,0.08)' },
  blurredSalary: { color:'rgba(255,255,255,0.08)' },

  btnUnlock:    { backgroundColor:'rgba(245,168,32,0.12)', borderWidth:1.5, borderColor:'rgba(245,168,32,0.3)', borderRadius:14, paddingVertical:12, alignItems:'center' },
  btnUnlockTxt: { color:COLORS.primary, fontSize:13, fontWeight:'800' },

  btnOpen:      { backgroundColor:COLORS.primary, borderRadius:14, paddingVertical:12, alignItems:'center' },
  btnOpenTxt:   { color:COLORS.dark, fontSize:13, fontWeight:'800' },
});
