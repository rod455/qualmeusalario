// app/faq.tsx
// Dúvidas frequentes sobre CLT — interstitial ao voltar

import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import AdBanner from '../components/AdBanner';
import { useInterstitial } from '../lib/useInterstitial';

type FAQItem = { q: string; a: string; icon: string };

const FAQ_DATA: FAQItem[] = [
  {
    icon: '💰',
    q: 'Qual a diferença entre salário bruto e líquido?',
    a: 'Salário bruto é o valor total antes dos descontos. O líquido é o que cai na sua conta, após descontos de INSS, IRRF e outros. Use nossa calculadora para saber o valor exato.',
  },
  {
    icon: '📋',
    q: 'O que é INSS e como é calculado?',
    a: 'O INSS é a contribuição à Previdência Social. É calculado de forma progressiva: 7,5% até R$ 1.518, 9% de R$ 1.518 a R$ 2.794, 12% de R$ 2.794 a R$ 4.191, e 14% de R$ 4.191 a R$ 8.157. Cada faixa incide apenas sobre a parcela correspondente.',
  },
  {
    icon: '🧾',
    q: 'Como funciona o IRRF (Imposto de Renda)?',
    a: 'O IRRF é descontado na fonte sobre o salário após INSS. As faixas vão de isento (até R$ 2.259) até 27,5% (acima de R$ 4.665). Há um desconto simplificado de R$ 564,80 e dedução por dependente de R$ 189,59.',
  },
  {
    icon: '🏖️',
    q: 'Tenho direito a quantos dias de férias?',
    a: 'Todo CLT tem direito a 30 dias de férias após 12 meses de trabalho. Você pode dividir em até 3 períodos (um deles com no mínimo 14 dias). As férias incluem adicional de 1/3 sobre o salário.',
  },
  {
    icon: '🎄',
    q: 'Como funciona o 13º salário?',
    a: 'O 13º é pago em duas parcelas: a primeira até 30/11 (metade do salário sem descontos) e a segunda até 20/12 (com descontos de INSS e IR). É proporcional aos meses trabalhados no ano.',
  },
  {
    icon: '📄',
    q: 'O que é FGTS e como posso sacar?',
    a: 'O FGTS é um depósito mensal de 8% do salário feito pelo empregador. Você pode sacar em caso de demissão sem justa causa, compra de imóvel, aposentadoria, doença grave, ou pelo saque-aniversário.',
  },
  {
    icon: '🚪',
    q: 'Fui demitido. Quais são meus direitos?',
    a: 'Na demissão sem justa causa: aviso prévio (trabalhado ou indenizado), saldo de salário, férias proporcionais + 1/3, 13º proporcional, multa de 40% sobre FGTS, saque do FGTS e seguro-desemprego (se elegível).',
  },
  {
    icon: '⚠️',
    q: 'O que é justa causa?',
    a: 'Justa causa é quando o empregador demite por falta grave (abandono, insubordinação, embriaguez, etc.). Nesse caso, o trabalhador perde direito à multa do FGTS, aviso prévio indenizado e seguro-desemprego.',
  },
  {
    icon: '🤰',
    q: 'Quais os direitos da gestante no trabalho?',
    a: 'A gestante tem estabilidade desde a confirmação da gravidez até 5 meses após o parto. Licença-maternidade de 120 dias (180 em empresas do Empresa Cidadã). Direito a consultas e exames durante o horário de trabalho.',
  },
  {
    icon: '⏰',
    q: 'Qual o limite de horas extras?',
    a: 'O limite é de 2 horas extras por dia. O adicional é de no mínimo 50% sobre a hora normal (100% em domingos e feriados). Horas extras habituais podem ser incorporadas ao cálculo de férias, 13º e FGTS.',
  },
  {
    icon: '🏥',
    q: 'Fiquei doente. E agora?',
    a: 'Nos primeiros 15 dias, a empresa paga normalmente. A partir do 16º dia, você recebe auxílio-doença do INSS (se tiver carência de 12 meses). Precisa de atestado médico e perícia do INSS.',
  },
  {
    icon: '📝',
    q: 'Posso pedir demissão e ter algum direito?',
    a: 'Sim, mas perde seguro-desemprego e multa do FGTS. Recebe: saldo de salário, férias vencidas e proporcionais + 1/3, e 13º proporcional. Deve cumprir aviso prévio de 30 dias (ou ter desconto).',
  },
  {
    icon: '🤝',
    q: 'O que é demissão por acordo (rescisão consensual)?',
    a: 'Desde a Reforma Trabalhista, empregado e empregador podem fazer acordo. O trabalhador recebe: metade do aviso prévio, 20% da multa do FGTS, pode sacar 80% do FGTS, mas NÃO tem direito ao seguro-desemprego.',
  },
  {
    icon: '💼',
    q: 'Qual a diferença entre CLT e PJ?',
    a: 'CLT tem carteira assinada com todos os direitos (FGTS, férias, 13º, INSS). PJ emite nota fiscal sem vínculo empregatício. PJ geralmente ganha mais no bruto, mas precisa pagar impostos e não tem benefícios CLT.',
  },
  {
    icon: '🍽️',
    q: 'VR e VA são obrigatórios?',
    a: 'Não são obrigatórios por lei. São benefícios facultativos. Se a empresa aderir ao PAT (Programa de Alimentação do Trabalhador), pode descontar até 20% do valor do benefício do salário do funcionário.',
  },
];

export default function FAQScreen() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const adShownRef = useRef(false);
  const { showAdThenDo } = useInterstitial(['CLT', 'direitos trabalhistas', 'emprego']);

  function toggle(index: number) {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(index) ? s.delete(index) : s.add(index);
      return s;
    });
  }

  function handleBack() {
    if (!adShownRef.current) {
      adShownRef.current = true;
      showAdThenDo(() => router.replace('/'));
    } else {
      router.replace('/');
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <AdBanner />

      <View style={s.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={s.backTxt}>← Início</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>❓ Dúvidas Frequentes</Text>
        <Text style={s.headerSub}>Tudo sobre seus direitos CLT</Text>
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {FAQ_DATA.map((faq, i) => {
          const isOpen = expanded.has(i);
          return (
            <TouchableOpacity
              key={i}
              style={[s.faqCard, isOpen && s.faqCardOpen]}
              onPress={() => toggle(i)}
              activeOpacity={0.8}
            >
              <View style={s.faqHeader}>
                <Text style={s.faqIcon}>{faq.icon}</Text>
                <Text style={s.faqQuestion}>{faq.q}</Text>
                <Text style={s.faqChevron}>{isOpen ? '▾' : '▸'}</Text>
              </View>
              {isOpen && (
                <Text style={s.faqAnswer}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.dark },
  header:        { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  backTxt:       { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
  headerTitle:   { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:     { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  list:          { paddingHorizontal: 16, paddingTop: 4, gap: 8 },
  faqCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 14,
  },
  faqCardOpen: {
    borderColor: 'rgba(245,168,32,0.2)',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqIcon:     { fontSize: 20 },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 20 },
  faqChevron:  { fontSize: 16, color: 'rgba(255,255,255,0.3)' },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 21,
  },
});
