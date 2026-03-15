import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useOnboardingStore } from '../store/useOnboardingStore';

export default function CadastroScreen() {
  const [nome, setNome]           = useState('');
  const [email, setEmail]         = useState('');
  const [senha, setSenha]         = useState('');
  const [confirma, setConfirma]   = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [erro, setErro]           = useState('');
  const [modo, setModo]           = useState<'cadastro'|'login'>('cadastro');

  const result = useOnboardingStore(s => s.result);

  const senhaMatch = senha === confirma;
  const canSubmit  = nome.trim().length > 0
    && email.trim().length > 0
    && senha.length >= 6
    && (modo === 'login' || senhaMatch);

  // Salva análise no Supabase após auth
  const salvarAnalise = async (userId: string) => {
    if (!result) return;
    try {
      await supabase.from('salary_analyses').insert({
        user_id:      userId,
        cargo:        result.cargo,
        area:         result.area ?? '',
        cidade:       result.cidade.nome,
        uf:           result.cidade.uf,
        is_nomad:     result.isNomad ?? false,
        work_model:   result.workModel,
        exp_years:    result.exp,
        salary_fixo:  result.my.fixo,
        salary_total: result.my.total,
        market_total: result.mkt.total,
        diff_pct:     result.diff,
        diff_mes:     result.diffMes,
        diff_ano:     result.diffAno,
      });
    } catch (e) {
      console.warn('salvarAnalise error', e);
    }
  };

  const handleCadastro = async () => {
    if (!canSubmit) return;
    setErro('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: { data: { full_name: nome.trim() } },
      });
      if (error) {
        const msgs: Record<string,string> = {
          'User already registered': 'Este e-mail já está cadastrado. Faça login.',
          'Invalid email':           'E-mail inválido.',
        };
        setErro(msgs[error.message] ?? error.message);
        return;
      }
      if (data.user) {
        await salvarAnalise(data.user.id);
      }
      Alert.alert('✅ Conta criada!', 'Bem-vindo ao Quanto Ganha!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/resultado') },
      ]);
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !senha) { setErro('Preencha e-mail e senha.'); return; }
    setErro('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });
      if (error) {
        const msgs: Record<string,string> = {
          'Invalid login credentials': 'E-mail ou senha incorretos.',
          'Email not confirmed':       'Confirme seu e-mail antes de entrar.',
        };
        setErro(msgs[error.message] ?? error.message);
        return;
      }
      if (data.user) await salvarAnalise(data.user.id);
      router.replace('/(tabs)/resultado');
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={s.topbar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={s.logoRow}>
          <Image source={require('../assets/images/icon.png')} style={s.logoImg} resizeMode="contain" />
          <Text style={s.logoName}>Quanto Ganha!</Text>
        </View>
        <View style={{ width:32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.content}>

          {/* Toggle cadastro/login */}
          <View style={s.modoRow}>
            <TouchableOpacity
              style={[s.modoBtn, modo === 'cadastro' && s.modoBtnActive]}
              onPress={() => { setModo('cadastro'); setErro(''); }}
            >
              <Text style={[s.modoBtnTxt, modo === 'cadastro' && s.modoBtnTxtActive]}>Criar conta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modoBtn, modo === 'login' && s.modoBtnActive]}
              onPress={() => { setModo('login'); setErro(''); }}
            >
              <Text style={[s.modoBtnTxt, modo === 'login' && s.modoBtnTxtActive]}>Já tenho conta</Text>
            </TouchableOpacity>
          </View>

          {modo === 'cadastro' && (
            <View style={s.perks}>
              {[
                { icon:'📊', text:'Histórico de análises salvo' },
                { icon:'🔔', text:'Alertas mensais de mercado' },
                { icon:'🎯', text:'Simulador de negociação com IA' },
              ].map(p => (
                <View key={p.text} style={s.perk}>
                  <View style={s.perkIcon}><Text>{p.icon}</Text></View>
                  <Text style={s.perkTxt}>{p.text}</Text>
                </View>
              ))}
            </View>
          )}

          {erro ? <View style={s.erroBox}><Text style={s.erroTxt}>⚠️ {erro}</Text></View> : null}

          <View style={s.form}>
            {modo === 'cadastro' && (
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Nome completo</Text>
                <View style={s.inputWrap}>
                  <Text style={s.inputIcon}>👤</Text>
                  <TextInput style={s.input} value={nome} onChangeText={setNome}
                    placeholder="Seu nome" placeholderTextColor="rgba(255,255,255,0.25)"
                    autoCapitalize="words" />
                </View>
              </View>
            )}

            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>E-mail</Text>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>✉️</Text>
                <TextInput style={s.input} value={email} onChangeText={setEmail}
                  placeholder="seu@email.com" placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType="email-address" autoCapitalize="none" />
              </View>
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Senha</Text>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>🔑</Text>
                <TextInput style={s.input} value={senha} onChangeText={setSenha}
                  placeholder={modo === 'cadastro' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  secureTextEntry={!showSenha} autoCapitalize="none" />
                <TouchableOpacity onPress={() => setShowSenha(v => !v)}>
                  <Text style={s.eyeTxt}>{showSenha ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {modo === 'cadastro' && senha.length > 0 && senha.length < 6 &&
                <Text style={s.fieldError}>Mínimo 6 caracteres</Text>}
            </View>

            {modo === 'cadastro' && (
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Confirmar senha</Text>
                <View style={[s.inputWrap, confirma.length > 0 && !senhaMatch && s.inputError]}>
                  <Text style={s.inputIcon}>🔒</Text>
                  <TextInput style={s.input} value={confirma} onChangeText={setConfirma}
                    placeholder="Repita a senha" placeholderTextColor="rgba(255,255,255,0.25)"
                    secureTextEntry={!showConf} autoCapitalize="none" />
                  <TouchableOpacity onPress={() => setShowConf(v => !v)}>
                    <Text style={s.eyeTxt}>{showConf ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {confirma.length > 0 && !senhaMatch &&
                  <Text style={s.fieldError}>As senhas não coincidem</Text>}
                {confirma.length > 0 && senhaMatch && senha.length >= 6 &&
                  <Text style={s.fieldOk}>✓ Senhas coincidem</Text>}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[s.cta, (!canSubmit || loading) && s.ctaDisabled]}
            onPress={modo === 'cadastro' ? handleCadastro : handleLogin}
            disabled={!canSubmit || loading}
          >
            <Text style={s.ctaTxt}>
              {loading ? 'Aguarde...' : modo === 'cadastro' ? 'Criar conta grátis →' : 'Entrar →'}
            </Text>
          </TouchableOpacity>

          <Text style={s.terms}>
            {modo === 'cadastro'
              ? 'Ao criar conta você concorda com nossos Termos de Uso e Política de Privacidade.'
              : 'Entre com seu e-mail e senha cadastrados.'}
          </Text>
          <View style={{height:40}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex:1, backgroundColor:COLORS.dark },
  topbar:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingTop:12, paddingBottom:10 },
  backBtn:        { width:32, height:32, borderRadius:16, backgroundColor:'rgba(255,255,255,0.07)', alignItems:'center', justifyContent:'center' },
  backTxt:        { fontSize:20, color:'rgba(255,255,255,0.6)', lineHeight:24 },
  logoRow:        { flexDirection:'row', alignItems:'center', gap:7 },
  logoImg:        { width:28, height:28, borderRadius:8 },
  logoName:       { fontSize:14, fontWeight:'700', color:'#fff' },
  content:        { paddingHorizontal:24, paddingTop:8 },
  modoRow:        { flexDirection:'row', backgroundColor:COLORS.surface, borderRadius:16, padding:4, marginBottom:20 },
  modoBtn:        { flex:1, paddingVertical:10, borderRadius:12, alignItems:'center' },
  modoBtnActive:  { backgroundColor:COLORS.primary },
  modoBtnTxt:     { fontSize:14, fontWeight:'700', color:'rgba(255,255,255,0.4)' },
  modoBtnTxtActive:{ color:COLORS.dark },
  perks:          { gap:10, marginBottom:20, backgroundColor:COLORS.surface, borderRadius:16, padding:14, borderWidth:1, borderColor:'rgba(255,255,255,0.07)' },
  perk:           { flexDirection:'row', alignItems:'center', gap:10 },
  perkIcon:       { width:30, height:30, borderRadius:8, backgroundColor:'rgba(245,168,32,0.12)', alignItems:'center', justifyContent:'center', flexShrink:0 },
  perkTxt:        { fontSize:13, color:'rgba(255,255,255,0.65)', flex:1 },
  erroBox:        { backgroundColor:'rgba(226,75,74,0.12)', borderWidth:1, borderColor:'rgba(226,75,74,0.3)', borderRadius:12, padding:12, marginBottom:16 },
  erroTxt:        { fontSize:13, color:COLORS.danger },
  form:           { gap:14, marginBottom:20 },
  fieldWrap:      { gap:6 },
  fieldLabel:     { fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:0.7 },
  inputWrap:      { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.surface, borderWidth:1.5, borderColor:'rgba(255,255,255,0.10)', borderRadius:14, paddingHorizontal:14, paddingVertical:13, gap:10 },
  inputError:     { borderColor:COLORS.danger },
  inputIcon:      { fontSize:15 },
  input:          { flex:1, fontSize:15, color:'#fff', padding:0 },
  eyeTxt:         { fontSize:15, paddingHorizontal:2 },
  fieldError:     { fontSize:11, color:COLORS.danger },
  fieldOk:        { fontSize:11, color:COLORS.success },
  cta:            { backgroundColor:COLORS.primary, borderRadius:28, height:52, alignItems:'center', justifyContent:'center', marginBottom:14 },
  ctaDisabled:    { opacity:0.35 },
  ctaTxt:         { color:COLORS.dark, fontSize:16, fontWeight:'900', letterSpacing:-0.3 },
  terms:          { fontSize:11, color:'rgba(255,255,255,0.2)', textAlign:'center', lineHeight:17 },
});
