// app/negociacao.tsx
// Treinar negociação com IA (Claude) — sistema de moedas + dificuldade + feedback

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SUPABASE_URL, SUPABASE_ANON_KEY, ADMOB } from '../lib/constants';
import AdBanner from '../components/AdBanner';
import { useCoinStore } from '../store/useCoinStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import {
  RewardedAd, RewardedAdEventType, AdEventType, TestIds,
} from 'react-native-google-mobile-ads';

const IS_DEV = __DEV__;
const REWARDED_ID = IS_DEV
  ? TestIds.REWARDED
  : Platform.OS === 'ios' ? ADMOB.REWARDED_IOS : ADMOB.REWARDED_ANDROID;

type Message = { role: 'user' | 'assistant' | 'system'; content: string };
type Difficulty = 'facil' | 'medio' | 'dificil';

const DIFF_COST: Record<Difficulty, number> = { facil: 1, medio: 3, dificil: 5 };
const DIFF_LABEL: Record<Difficulty, string> = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
const DIFF_DESC: Record<Difficulty, string> = {
  facil: 'Gestor receptivo, aberto a ouvir',
  medio: 'Gestor neutro, precisa de bons argumentos',
  dificil: 'Gestor difícil, muito cético e exigente',
};
const DIFF_ICON: Record<Difficulty, string> = { facil: '😊', medio: '😐', dificil: '😠' };

const MAX_TURNS = 6;

function getSystemPrompt(area: string | null, cargo: string, difficulty: Difficulty): string {
  const diffContext = {
    facil: 'Seja relativamente aberto e receptivo aos argumentos do funcionário. Faça perguntas, mas demonstre abertura.',
    medio: 'Seja neutro. Exija argumentos sólidos com dados. Não ceda facilmente mas reconheça bons pontos.',
    dificil: 'Seja muito cético e exigente. Questione tudo. Cite restrições orçamentárias. Só ceda com argumentos excepcionais.',
  };

  return `Você é um diretor/gestor da área de ${area ?? 'negócios'} em uma empresa brasileira. Um funcionário do cargo de ${cargo} vai tentar negociar uma promoção ou aumento salarial com você.

Regras da simulação:
- ${diffContext[difficulty]}
- Responda SEMPRE em português brasileiro
- Mantenha respostas curtas (2-4 frases)
- Aja de forma realista como um gestor brasileiro
- Após ${MAX_TURNS} turnos de conversa, encerre a simulação naturalmente
- NÃO quebre o personagem em nenhum momento
- Comece se apresentando brevemente e perguntando o motivo da reunião`;
}

function getFeedbackPrompt(messages: Message[], difficulty: Difficulty): string {
  const conversation = messages
    .filter(m => m.role !== 'system')
    .map(m => `${m.role === 'user' ? 'Funcionário' : 'Gestor'}: ${m.content}`)
    .join('\n');

  return `Analise esta simulação de negociação salarial (nível ${DIFF_LABEL[difficulty]}) e dê feedback construtivo ao funcionário.

Conversa:
${conversation}

Forneça:
1. Nota geral (0-10)
2. Pontos fortes do funcionário
3. Pontos a melhorar
4. Dica prática para a próxima negociação real

Responda em português brasileiro, de forma direta e motivadora. Use no máximo 150 palavras.`;
}

export default function NegociacaoScreen() {
  const { coins, spendCoins, addCoins } = useCoinStore();
  const result = useOnboardingStore(s => s.result);
  const cargo = useOnboardingStore(s => s.cargo);
  const area = useOnboardingStore(s => s.area);

  const [phase, setPhase] = useState<'select' | 'chat' | 'feedback'>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('facil');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [adReady, setAdReady] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const adRef = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);
  const listenersRef = useRef<(() => void)[]>([]);
  const rewardCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadRewardedAd();
    return () => { listenersRef.current.forEach(fn => fn()); };
  }, []);

  function loadRewardedAd() {
    try {
      const ad = RewardedAd.createForAdRequest(REWARDED_ID, {
        keywords: ['carreira', 'negociacao', 'salario'],
      });
      adRef.current = ad;

      const u1 = ad.addAdEventListener(RewardedAdEventType.LOADED, () => setAdReady(true));
      const u2 = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        if (rewardCallbackRef.current) {
          rewardCallbackRef.current();
          rewardCallbackRef.current = null;
        }
      });
      const u3 = ad.addAdEventListener(AdEventType.CLOSED, () => {
        setAdReady(false);
        if (rewardCallbackRef.current) {
          rewardCallbackRef.current();
          rewardCallbackRef.current = null;
        }
        setTimeout(() => loadRewardedAd(), 1000);
      });
      const u4 = ad.addAdEventListener(AdEventType.ERROR, () => {
        setAdReady(false);
        setTimeout(() => loadRewardedAd(), 5000);
      });

      listenersRef.current = [u1, u2, u3, u4];
      ad.load();
    } catch {}
  }

  function showRewardedAd(callback: () => void) {
    if (adReady && adRef.current) {
      rewardCallbackRef.current = callback;
      try { adRef.current.show(); } catch { callback(); }
    } else {
      callback();
    }
  }

  async function callClaude(msgs: Message[]): Promise<string> {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/claude-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          system: msgs[0]?.content ?? '',
          messages: msgs.slice(1).map(m => ({ role: m.role, content: m.content })),
          max_tokens: 300,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.text ?? 'Desculpe, não consegui processar sua mensagem.';
    } catch {
      return 'Desculpe, houve um erro na conexão. Tente novamente.';
    }
  }

  async function startSimulation(diff: Difficulty) {
    const cost = DIFF_COST[diff];
    if (coins < cost) {
      Alert.alert('Moedas insuficientes', `Você precisa de ${cost} moedas. Assista um anúncio para ganhar mais.`);
      return;
    }

    if (!spendCoins(cost)) return;

    setDifficulty(diff);
    setPhase('chat');
    setTurnCount(0);
    setLoading(true);

    const sysMsg: Message = { role: 'system', content: getSystemPrompt(area, cargo || 'Profissional', diff) };
    const initialMsgs: Message[] = [sysMsg];

    const response = await callClaude(initialMsgs);
    const assistantMsg: Message = { role: 'assistant', content: response };

    setMessages([sysMsg, assistantMsg]);
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    setTurnCount(prev => prev + 1);

    const response = await callClaude(newMsgs);
    const assistantMsg: Message = { role: 'assistant', content: response };
    const updatedMsgs = [...newMsgs, assistantMsg];
    setMessages(updatedMsgs);
    setLoading(false);

    if (turnCount + 1 >= MAX_TURNS) {
      setTimeout(() => {
        Alert.alert(
          'Simulação encerrada',
          'Assista um anúncio para receber feedback personalizado!',
          [{ text: 'Ver feedback', onPress: () => requestFeedback(updatedMsgs) }]
        );
      }, 500);
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function requestFeedback(msgs: Message[]) {
    showRewardedAd(async () => {
      setPhase('feedback');
      setLoading(true);

      const feedbackPrompt = getFeedbackPrompt(msgs, difficulty);
      const res = await callClaude([
        { role: 'system', content: 'Você é um coach de carreira especializado em negociação salarial no Brasil.' },
        { role: 'user', content: feedbackPrompt },
      ]);
      setFeedback(res);
      setLoading(false);
    });
  }

  function handleGetCoins() {
    showRewardedAd(() => {
      addCoins(3);
      Alert.alert('Moedas recebidas!', 'Você ganhou 3 moedas.');
    });
  }

  // ─── TELA DE SELEÇÃO ───
  if (phase === 'select') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
        <AdBanner />

        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={s.backTxt}>← Início</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>🎯 Treinar Negociação</Text>
          <Text style={s.headerSub}>Pratique pedir aumento com uma IA que simula seu gestor</Text>
        </View>

        <ScrollView contentContainerStyle={s.selectContent} showsVerticalScrollIndicator={false}>
          {/* Moedas */}
          <View style={s.coinBar}>
            <Text style={s.coinIcon}>🪙</Text>
            <Text style={s.coinCount}>{coins} moedas</Text>
            <TouchableOpacity style={s.coinBtn} onPress={handleGetCoins}>
              <Text style={s.coinBtnTxt}>{adReady ? '🎬 +3 moedas' : '⏳ Carregando...'}</Text>
            </TouchableOpacity>
          </View>

          {!cargo && (
            <View style={s.warningCard}>
              <Text style={s.warningTxt}>📊 Faça sua análise salarial primeiro para personalizar a simulação.</Text>
              <TouchableOpacity style={s.warningBtn} onPress={() => router.push('/(onboarding)/cargo')}>
                <Text style={s.warningBtnTxt}>Fazer análise →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Níveis */}
          {(['facil', 'medio', 'dificil'] as Difficulty[]).map(diff => (
            <TouchableOpacity
              key={diff}
              style={[s.diffCard, coins < DIFF_COST[diff] && s.diffCardDisabled]}
              onPress={() => startSimulation(diff)}
              disabled={coins < DIFF_COST[diff]}
            >
              <View style={s.diffLeft}>
                <Text style={s.diffIcon}>{DIFF_ICON[diff]}</Text>
                <View>
                  <Text style={s.diffTitle}>{DIFF_LABEL[diff]}</Text>
                  <Text style={s.diffDesc}>{DIFF_DESC[diff]}</Text>
                </View>
              </View>
              <View style={s.diffCost}>
                <Text style={s.diffCostTxt}>🪙 {DIFF_COST[diff]}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Convite conta */}
          <TouchableOpacity style={s.accountCard} onPress={() => router.push('/cadastro')}>
            <Text style={s.accountTitle}>🎁 Crie sua conta e ganhe 5 moedas!</Text>
            <Text style={s.accountSub}>Cadastro grátis, sem cartão de crédito</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── TELA DE FEEDBACK ───
  if (phase === 'feedback') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
        <AdBanner />

        <View style={s.header}>
          <TouchableOpacity onPress={() => setPhase('select')}>
            <Text style={s.backTxt}>← Nova simulação</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>📝 Seu Feedback</Text>
        </View>

        <ScrollView contentContainerStyle={s.feedbackContent}>
          {loading ? (
            <Text style={s.loadingTxt}>Analisando sua negociação...</Text>
          ) : (
            <View style={s.feedbackCard}>
              <Text style={s.feedbackText}>{feedback}</Text>
            </View>
          )}

          <TouchableOpacity style={s.retryBtn} onPress={() => setPhase('select')}>
            <Text style={s.retryBtnTxt}>Tentar novamente</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── TELA DE CHAT ───
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <AdBanner />

      <View style={s.chatHeader}>
        <TouchableOpacity onPress={() => { setPhase('select'); setMessages([]); }}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>
        <View style={s.chatHeaderRight}>
          <Text style={s.chatDiff}>{DIFF_ICON[difficulty]} {DIFF_LABEL[difficulty]}</Text>
          <Text style={s.chatTurns}>{turnCount}/{MAX_TURNS} turnos</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={s.chatBody} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={s.chatScroll}
          contentContainerStyle={s.chatMessages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.filter(m => m.role !== 'system').map((m, i) => (
            <View key={i} style={[s.msgBubble, m.role === 'user' ? s.msgUser : s.msgAssistant]}>
              <Text style={s.msgRole}>{m.role === 'user' ? 'Você' : '👔 Gestor'}</Text>
              <Text style={s.msgText}>{m.content}</Text>
            </View>
          ))}
          {loading && (
            <View style={[s.msgBubble, s.msgAssistant]}>
              <Text style={s.msgRole}>👔 Gestor</Text>
              <Text style={s.msgTyping}>Digitando...</Text>
            </View>
          )}
        </ScrollView>

        {turnCount < MAX_TURNS ? (
          <View style={s.inputRow}>
            <TextInput
              style={s.chatInput}
              value={input}
              onChangeText={setInput}
              placeholder="Faça seu argumento..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              multiline
              editable={!loading}
            />
            <TouchableOpacity style={[s.sendBtn, !input.trim() && s.sendBtnOff]} onPress={sendMessage} disabled={!input.trim() || loading}>
              <Text style={s.sendBtnTxt}>→</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.feedbackBtn} onPress={() => requestFeedback(messages)}>
            <Text style={s.feedbackBtnTxt}>🎬 Ver feedback da simulação</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.dark },
  header:         { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  backTxt:        { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
  headerTitle:    { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:      { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  selectContent:  { paddingHorizontal: 20, paddingBottom: 30, gap: 12 },
  coinBar:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, gap: 10 },
  coinIcon:       { fontSize: 22 },
  coinCount:      { fontSize: 16, fontWeight: '800', color: '#fff', flex: 1 },
  coinBtn:        { backgroundColor: 'rgba(245,168,32,0.15)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  coinBtnTxt:     { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  warningCard:    { backgroundColor: 'rgba(245,168,32,0.08)', borderWidth: 1, borderColor: 'rgba(245,168,32,0.2)', borderRadius: 16, padding: 14 },
  warningTxt:     { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20, marginBottom: 10 },
  warningBtn:     { alignSelf: 'flex-start', backgroundColor: COLORS.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  warningBtnTxt:  { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  diffCard:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 18, padding: 16 },
  diffCardDisabled: { opacity: 0.4 },
  diffLeft:       { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  diffIcon:       { fontSize: 32 },
  diffTitle:      { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 2 },
  diffDesc:       { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 16 },
  diffCost:       { backgroundColor: 'rgba(245,168,32,0.15)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  diffCostTxt:    { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  accountCard:    { backgroundColor: 'rgba(29,190,117,0.1)', borderWidth: 1, borderColor: 'rgba(29,190,117,0.2)', borderRadius: 16, padding: 16, alignItems: 'center' },
  accountTitle:   { fontSize: 15, fontWeight: '800', color: COLORS.success, marginBottom: 4 },
  accountSub:     { fontSize: 12, color: 'rgba(255,255,255,0.4)' },

  // Chat
  chatHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  chatHeaderRight:{ alignItems: 'flex-end' },
  chatDiff:       { fontSize: 13, fontWeight: '700', color: '#fff' },
  chatTurns:      { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  chatBody:       { flex: 1 },
  chatScroll:     { flex: 1 },
  chatMessages:   { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  msgBubble:      { maxWidth: '82%', borderRadius: 16, padding: 12 },
  msgUser:        { alignSelf: 'flex-end', backgroundColor: 'rgba(245,168,32,0.15)', borderBottomRightRadius: 4 },
  msgAssistant:   { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderBottomLeftRadius: 4 },
  msgRole:        { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  msgText:        { fontSize: 14, color: '#fff', lineHeight: 20 },
  msgTyping:      { fontSize: 14, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },
  inputRow:       { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingBottom: 16, gap: 8 },
  chatInput:      { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 100 },
  sendBtn:        { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff:     { opacity: 0.3 },
  sendBtnTxt:     { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  feedbackBtn:    { marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.primary, borderRadius: 28, height: 52, alignItems: 'center', justifyContent: 'center' },
  feedbackBtnTxt: { color: COLORS.dark, fontSize: 15, fontWeight: '900' },

  // Feedback
  feedbackContent:{ paddingHorizontal: 20, paddingBottom: 30, gap: 16 },
  loadingTxt:     { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 },
  feedbackCard:   { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 20 },
  feedbackText:   { fontSize: 14, color: '#fff', lineHeight: 22 },
  retryBtn:       { backgroundColor: COLORS.primary, borderRadius: 28, height: 52, alignItems: 'center', justifyContent: 'center' },
  retryBtnTxt:    { color: COLORS.dark, fontSize: 15, fontWeight: '900' },
});
