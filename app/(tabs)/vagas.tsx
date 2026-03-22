import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  FlatList, Linking, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, ADZUNA_APP_ID, ADZUNA_APP_KEY, ADMOB } from '../../lib/constants';
import AdBanner from '../../components/AdBanner';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import {
  RewardedAd,
  RewardedAdEventType,
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
  const [pendingId, setPendingId]   = useState<string | null>(null);
  const rewardedRef = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);
  const [adReady, setAdReady]       = useState(false);

  // Carregar vagas da Adzuna
  useEffect(() => {
    fetchVagas();
  }, []);

  // Preparar rewarded ad
  useEffect(() => {
    loadRewardedAd();
  }, []);

  function loadRewardedAd() {
    try {
      const ad = RewardedAd.createForAdRequest(REWARDED_ID, {
        keywords: ['vaga emprego', 'salario', 'carreira', 'trabalho remoto'],
      });
      rewardedRef.current = ad;

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setAdReady(true);
      });

      const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        // Destravar a vaga pendente
        if (pendingId) {
          setUnlocked(prev => new Set(prev).add(pendingId));
          setPendingId(null);
        }
        // Recarregar para próximo uso
        setAdReady(false);
        setTimeout(() => {
          try { rewardedRef.current?.load(); } catch {}
        }, 1000);
      });

      ad.load();

      return () => {
        unsubLoaded();
        unsubEarned();
      };
    } catch {
      // Se não conseguir criar o ad, tudo funciona sem
    }
  }

  async function fetchVagas() {
    setLoading(true);
    try {
      const cargo = result?.cargo?.split('(')[0]?.trim() ?? 'desenvolvedor';
      const query = encodeURIComponent(cargo);
      const url = `https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=15&what=${query}&content-type=application/json`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.results) {
        const mapped: Vaga[] = data.results.map((r: any, i: number) => ({
          id: r.id?.toString() ?? `vaga-${i}`,
          title: r.title ?? 'Vaga sem título',
          company: r.company?.display_name ?? 'Empresa confidencial',
          location: r.location?.display_name ?? 'Brasil',
          salary_min: r.salary_min,
          salary_max: r.salary_max,
          url: r.redirect_url ?? '',
        }));
        setVagas(mapped);
      }
    } catch (e) {
      console.log('Erro ao buscar vagas:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleUnlock(vagaId: string) {
    if (unlocked.has(vagaId)) return;

    setPendingId(vagaId);
    if (adReady && rewardedRef.current) {
      try {
        rewardedRef.current.show();
      } catch {
        // Se falhar, destrava direto
        setUnlocked(prev => new Set(prev).add(vagaId));
        setPendingId(null);
      }
    } else {
      // Ad não carregou — destrava direto (não bloqueia o usuário)
      setUnlocked(prev => new Set(prev).add(vagaId));
      setPendingId(null);
    }
  }

  function handleOpenVaga(url: string) {
    if (url) Linking.openURL(url);
  }

  const fmtSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salário não informado';
    if (min && max) return `R$ ${min.toLocaleString('pt-BR')} – ${max.toLocaleString('pt-BR')}`;
    if (min) return `A partir de R$ ${min.toLocaleString('pt-BR')}`;
    return `Até R$ ${max!.toLocaleString('pt-BR')}`;
  };

  const renderVaga = useCallback(({ item }: { item: Vaga }) => {
    const isUnlocked = unlocked.has(item.id);

    return (
      <View style={vs.card}>
        {/* Conteúdo — borrado se não destravado */}
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
            <Text style={[vs.cardSalary, !isUnlocked && vs.blurred]}>
              💰 {isUnlocked ? fmtSalary(item.salary_min, item.salary_max) : '██████ ████'}
            </Text>
          </View>
        </View>

        {/* Botão: destravar ou ver vaga */}
        {isUnlocked ? (
          <TouchableOpacity style={vs.btnOpen} onPress={() => handleOpenVaga(item.url)}>
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

      {/* Header */}
      <View style={vs.header}>
        <Text style={vs.headerTitle}>💼 Vagas para você</Text>
        <Text style={vs.headerSub}>
          {result ? `Baseado em: ${result.cargo.split('(')[0].trim()}` : 'Vagas disponíveis no mercado'}
        </Text>
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
  list:         { paddingHorizontal:20, paddingBottom:24 },
  loadingWrap:  { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  loadingTxt:   { fontSize:14, color:'rgba(255,255,255,0.4)' },
  emptyWrap:    { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:32, gap:8 },
  emptyEmoji:   { fontSize:48 },
  emptyTitle:   { fontSize:20, fontWeight:'800', color:'#fff' },
  emptySub:     { fontSize:14, color:'rgba(255,255,255,0.4)', textAlign:'center', lineHeight:22 },

  // Card de vaga
  card:         { backgroundColor:COLORS.surface, borderWidth:1, borderColor:'rgba(255,255,255,0.07)', borderRadius:20, padding:16, overflow:'hidden' },
  cardContent:  { marginBottom:14 },
  cardTitle:    { fontSize:16, fontWeight:'800', color:'#fff', letterSpacing:-0.3, marginBottom:4 },
  cardCompany:  { fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:'600', marginBottom:10 },
  cardMeta:     { gap:4 },
  cardLocation: { fontSize:12, color:'rgba(255,255,255,0.4)' },
  cardSalary:   { fontSize:13, fontWeight:'700', color:COLORS.success },

  // Estado borrado (texto substituído por blocos █)
  blurred:      { color:'rgba(255,255,255,0.08)' },

  // Botão destravar
  btnUnlock:    { backgroundColor:'rgba(245,168,32,0.12)', borderWidth:1.5, borderColor:'rgba(245,168,32,0.3)', borderRadius:14, paddingVertical:12, alignItems:'center' },
  btnUnlockTxt: { color:COLORS.primary, fontSize:13, fontWeight:'800' },

  // Botão ver vaga (destravada)
  btnOpen:      { backgroundColor:COLORS.primary, borderRadius:14, paddingVertical:12, alignItems:'center' },
  btnOpenTxt:   { color:COLORS.dark, fontSize:13, fontWeight:'800' },
});
