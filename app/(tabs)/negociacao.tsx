import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { fmtBRL } from '../../lib/salary';
import { COLORS } from '../../lib/constants';

type Level = 'facil' | 'medio' | 'dificil';
type Msg   = { id: string; from: 'rh'|'user'|'typing'; text: string };

const LEVEL_COST: Record<Level, number> = { facil:1, medio:2, dificil:5 };
const LEVELS = [
  { id:'facil'   as Level, label:'😊 Fácil',   cost:1, color:COLORS.success },
  { id:'medio'   as Level, label:'😐 Médio',   cost:2, color:COLORS.warning },
  { id:'dificil' as Level, label:'😤 Difícil', cost:5, color:COLORS.danger  },
];
const FALLBACKS: Record<Level, string[]> = {
  facil:   ['Obrigado por trazer isso. Me conta mais.','Entendo. Quais dados você encontrou?','Faz sentido. Vamos ver o que podemos fazer.'],
  medio:   ['Você tem dados concretos para embasar isso?','Qual seria sua proposta exata?','Vou precisar analisar melhor.'],
  dificil: ['O momento não é o mais favorável agora.','Precisamos equilibrar com o orçamento.','Que outros benefícios você consideraria?'],
};

function getCredits() { return 3; } // TODO: persistir com AsyncStorage

export default function NegociacaoScreen() {
  const result = useOnboardingStore(s => s.result);
  const [level, setLevel]     = useState<Level>('facil');
  const [msgs, setMsgs]       = useState<Msg[]>([]);
  const [input, setInput]     = useState('');
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(getCredits());
  const historyRef = useRef<{role:'user'|'assistant'; content:string}[]>([]);
  const listRef    = useRef<FlatList>(null);

  const addMsg = (from: Msg['from'], text: string) => {
    setMsgs(prev => prev.filter(m => m.from !== 'typing').concat({ id: Date.now().toString(), from, text }));
    setTimeout(() => listRef.current?.scrollToEnd({ animated:true }), 100);
  };

  const callClaude = async (messages: {role:'user'|'assistant'; content:string}[]) => {
    try {
      const pct    = Math.abs(result?.diff ?? 18);
      const mySal  = Math.round(result?.my?.total ?? 0);
      const mktSal = Math.round(result?.mkt?.total ?? 0);
      const cidade = result?.cidade?.nome ?? 'São Paulo';
      const cfg    = LEVELS.find(l => l.id === level)!;
      const system = `Você é um(a) gestor(a) de RH. Cargo: ${result?.cargo?.split('(')[0]?.trim()} em ${cidade}. Salário atual: ${fmtBRL(mySal)}/mês. Mercado: ${fmtBRL(mktSal)}/mês. ${pct}% abaixo. Responda em 2-3 frases no personagem.`;
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:300, messages:[{role:'user',content:system},...messages] }),
      });
      const data = await resp.json();
      return data.content?.[0]?.text ?? '';
    } catch {
      const opts = FALLBACKS[level];
      return opts[Math.floor(Math.random() * opts.length)];
    }
  };

  const startChat = async () => {
    const cost = LEVEL_COST[level];
    if (credits < cost) { alert(`Créditos insuficientes. Você precisa de ${cost}⚡ para este nível.`); return; }
    setCredits(c => c - cost);
    setStarted(true);
    setLoading(true);
    setMsgs([{ id:'typing', from:'typing', text:'' }]);
    historyRef.current = [];
    const reply = await callClaude([]);
    setLoading(false);
    historyRef.current.push({ role:'assistant', content:reply });
    addMsg('rh', reply);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    addMsg('user', text);
    historyRef.current.push({ role:'user', content:text });
    setLoading(true);
    setMsgs(prev => [...prev, { id:'typing', from:'typing', text:'' }]);
    const reply = await callClaude(historyRef.current);
    setLoading(false);
    historyRef.current.push({ role:'assistant', content:reply });
    addMsg('rh', reply);
  };

  const reset = () => { setMsgs([]); setStarted(false); historyRef.current = []; };

  const renderMsg = ({ item }: { item: Msg }) => {
    if (item.from === 'typing') return (
      <View style={[ns.msgRow, ns.rhRow]}>
        <View style={ns.avRH}><Text>👔</Text></View>
        <View style={ns.bubbleRH}><ActivityIndicator size="small" color="rgba(255,255,255,0.4)" /></View>
      </View>
    );
    const isUser = item.from === 'user';
    return (
      <View style={[ns.msgRow, isUser ? ns.userRow : ns.rhRow]}>
        {!isUser && <View style={ns.avRH}><Text>👔</Text></View>}
        <View>
          <Text style={isUser ? ns.nameUser : ns.nameRH}>{isUser ? 'Você' : 'RH'}</Text>
          <View style={isUser ? ns.bubbleUser : ns.bubbleRH}>
            <Text style={isUser ? ns.textUser : ns.textRH}>{item.text}</Text>
          </View>
        </View>
        {isUser && <View style={ns.avUser}><Text>🧑</Text></View>}
      </View>
    );
  };

  return (
    <SafeAreaView style={ns.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <View style={ns.header}>
        <View>
          <Text style={ns.eyebrow}>Simulador de Negociação</Text>
          <Text style={ns.title}>Treine antes da reunião</Text>
        </View>
        <View style={ns.creditsBadge}>
          <Text style={ns.creditsNum}>{credits}</Text>
          <Text style={ns.creditsLabel}>⚡</Text>
        </View>
      </View>

      {/* Níveis */}
      <View style={ns.levelRow}>
        {LEVELS.map(l => (
          <TouchableOpacity
            key={l.id}
            style={[ns.levelBtn, level===l.id && { backgroundColor:l.color+'22', borderColor:l.color }]}
            onPress={() => { setLevel(l.id); if(started) reset(); }}
          >
            <Text style={[ns.levelTxt, level===l.id && { color:l.color }]}>{l.label}</Text>
            <Text style={ns.levelCost}>{l.cost}⚡</Text>
          </TouchableOpacity>
        ))}
      </View>

      {result && (
        <View style={ns.context}>
          <Text style={ns.contextTxt}>
            <Text style={{ color:COLORS.primary }}>{result.cargo.split('(')[0].trim()}</Text>
            {' '}em {result.cidade.nome} · <Text style={{ color:COLORS.danger }}>{Math.abs(result.diff)}% abaixo</Text>
            {' '}· diferença de {fmtBRL(result.diffMes)}/mês
          </Text>
        </View>
      )}

      {!started ? (
        <View style={ns.startWrap}>
          <Text style={ns.startEmoji}>🎯</Text>
          <Text style={ns.startTitle}>Escolha o nível e comece</Text>
          <Text style={ns.startSub}>A IA simula o RH com seus dados reais</Text>
          <TouchableOpacity style={ns.startBtn} onPress={startChat}>
            <Text style={ns.startBtnTxt}>Iniciar simulação →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={m => m.id}
          renderItem={renderMsg}
          contentContainerStyle={ns.chatList}
          onContentSizeChange={() => listRef.current?.scrollToEnd()}
        />
      )}

      {started && (
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined}>
          <View style={ns.inputBar}>
            <TextInput
              style={ns.input}
              value={input}
              onChangeText={setInput}
              placeholder="Digite sua resposta..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              onSubmitEditing={send}
              returnKeyType="send"
              editable={!loading}
            />
            <TouchableOpacity style={[ns.sendBtn, loading && {opacity:0.5}]} onPress={send} disabled={loading}>
              <Text style={ns.sendTxt}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const ns = StyleSheet.create({
  safe:       { flex:1, backgroundColor:COLORS.dark },
  header:     { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', padding:16, paddingBottom:12, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.07)' },
  eyebrow:    { fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:0.5 },
  title:      { fontSize:18, fontWeight:'800', color:'#fff', letterSpacing:-0.3, marginTop:3 },
  creditsBadge:{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(245,168,32,0.15)', borderWidth:1, borderColor:'rgba(245,168,32,0.25)', borderRadius:20, paddingHorizontal:12, paddingVertical:6 },
  creditsNum: { fontSize:15, fontWeight:'800', color:COLORS.primary },
  creditsLabel:{ fontSize:13 },
  levelRow:   { flexDirection:'row', gap:8, paddingHorizontal:16, paddingVertical:12 },
  levelBtn:   { flex:1, paddingVertical:8, borderWidth:1, borderColor:'rgba(255,255,255,0.12)', borderRadius:20, alignItems:'center', backgroundColor:'rgba(255,255,255,0.04)' },
  levelTxt:   { fontSize:12, fontWeight:'600', color:'rgba(255,255,255,0.5)' },
  levelCost:  { fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 },
  context:    { marginHorizontal:16, padding:10, backgroundColor:'rgba(245,168,32,0.08)', borderWidth:1, borderColor:'rgba(245,168,32,0.15)', borderRadius:10, marginBottom:4 },
  contextTxt: { fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:18 },
  startWrap:  { flex:1, alignItems:'center', justifyContent:'center', padding:32, gap:12 },
  startEmoji: { fontSize:40 },
  startTitle: { fontSize:18, fontWeight:'800', color:'#fff', textAlign:'center' },
  startSub:   { fontSize:13, color:'rgba(255,255,255,0.45)', textAlign:'center', lineHeight:20 },
  startBtn:   { backgroundColor:COLORS.primary, borderRadius:28, paddingHorizontal:28, paddingVertical:13, marginTop:8 },
  startBtnTxt:{ color:COLORS.dark, fontSize:15, fontWeight:'800' },
  chatList:   { padding:14, gap:2 },
  msgRow:     { flexDirection:'row', alignItems:'flex-end', gap:8, marginBottom:12 },
  rhRow:      {},
  userRow:    { flexDirection:'row-reverse' },
  avRH:       { width:30, height:30, borderRadius:15, backgroundColor:COLORS.surface, alignItems:'center', justifyContent:'center', flexShrink:0 },
  avUser:     { width:30, height:30, borderRadius:15, backgroundColor:COLORS.primary, alignItems:'center', justifyContent:'center', flexShrink:0 },
  nameRH:     { fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:3 },
  nameUser:   { fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:3, textAlign:'right' },
  bubbleRH:   { maxWidth:'78%', backgroundColor:'rgba(255,255,255,0.08)', borderRadius:14, borderBottomLeftRadius:4, padding:10 },
  bubbleUser: { maxWidth:'78%', backgroundColor:COLORS.primary, borderRadius:14, borderBottomRightRadius:4, padding:10 },
  textRH:     { fontSize:13, color:'rgba(255,255,255,0.85)', lineHeight:19 },
  textUser:   { fontSize:13, color:COLORS.dark, lineHeight:19 },
  inputBar:   { flexDirection:'row', gap:8, padding:12, paddingBottom:16, borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.07)', backgroundColor:COLORS.dark },
  input:      { flex:1, backgroundColor:'rgba(255,255,255,0.07)', borderWidth:1, borderColor:'rgba(255,255,255,0.12)', borderRadius:22, paddingHorizontal:14, paddingVertical:10, fontSize:14, color:'#fff' },
  sendBtn:    { paddingHorizontal:18, paddingVertical:10, backgroundColor:COLORS.primary, borderRadius:22, justifyContent:'center' },
  sendTxt:    { color:COLORS.dark, fontSize:14, fontWeight:'700' },
});
