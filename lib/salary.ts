import { MODEL_MULT } from './constants';

// ─── Tabelas de dados ────────────────────────────────────────────────────────

export const BASE_SALARIES: Record<string, number> = {
  'Desenvolvedor(a) Frontend Junior':3800,'Desenvolvedor(a) Frontend Pleno':6500,'Desenvolvedor(a) Frontend Senior':11000,
  'Desenvolvedor(a) Backend Junior':4000,'Desenvolvedor(a) Backend Pleno':7000,'Desenvolvedor(a) Backend Senior':12000,
  'Desenvolvedor(a) Full Stack Pleno':7500,'Desenvolvedor(a) Full Stack Senior':13000,
  'Desenvolvedor(a) Mobile':10000,'Engenheiro(a) de Software':12500,'Tech Lead':16000,
  'Arquiteto(a) de Software':18000,'DevOps Engineer':12000,'SRE':14000,
  'Engenheiro(a) de Dados Pleno':9500,'Engenheiro(a) de Dados Senior':14000,
  'Analista de Dados':7000,'Cientista de Dados':11000,'Analista de BI':6500,
  'QA Engineer':6000,'Scrum Master':9000,'Agile Coach':12000,
  'Product Manager (PM)':14000,'Product Owner (PO)':9000,'CTO':25000,'Head de Tecnologia':22000,
  'Designer UX/UI Junior':3500,'Designer UX/UI Pleno':6000,'Designer UX/UI Senior':9500,
  'UX Researcher':7500,'Motion Designer':5500,'Designer Gráfico':4500,'Head de Design':14000,'Web Designer':4800,
  'Analista de Marketing':4500,'Analista de Marketing Digital':5000,'Growth Hacker':8000,
  'Especialista em SEO':6000,'Especialista em Mídia Paga':6500,'Social Media Manager':4500,
  'Copywriter':4500,'Gerente de Marketing':10000,'CMO':22000,
  'SDR':3500,'BDR':4000,'Executivo(a) de Contas (AE)':7000,'Key Account Manager':9000,
  'Gerente de Vendas':12000,'Diretor(a) Comercial':18000,'CSO':25000,'Closer':5500,
  'Inside Sales':4500,'Analista de Customer Success':4500,'Customer Success Manager':8000,
  'Analista de Operações':5500,'Gerente de Operações':11000,'COO':24000,
  'Gerente de Projetos (PMO)':11000,'Analista Financeiro Pleno':6500,'Analista Financeiro Senior':9500,
  'Controller':13000,'CFO':24000,'Contador(a)':5000,'Analista de FP&A':8000,'Analista de Investimentos':8500,
  'Analista de RH':4000,'HRBP':8000,'People Analytics':7000,'Gerente de RH':11000,'CHRO':22000,
  'Advogado(a) Trabalhista':7000,'Advogado(a) Tributário(a)':8000,'Analista de Compliance':6000,'DPO':10000,
  'Médico(a) Clínico(a) Geral':9000,'Médico(a) Especialista':16000,'Enfermeiro(a)':4500,
  'Psicólogo(a)':4500,'Fisioterapeuta':4000,'Nutricionista':3800,'Dentista':6000,
  'Professor(a) Educação Básica':3200,'Professor(a) Ensino Superior':5500,'Designer Instrucional':5500,
  'Engenheiro(a) Civil':7500,'Engenheiro(a) Mecânico(a)':7000,'Engenheiro(a) Elétrico(a)':7200,
  'Engenheiro(a) de Produção':6800,'Engenheiro(a) Químico(a)':7000,'Engenheiro(a) Ambiental':6000,
};

export const MARKET_VARS: Record<string, { com:number; plr:number; vr:number; out:number }> = {
  'Tecnologia':        { com:0,    plr:1.8, vr:1200, out:600 },
  'Design & UX':       { com:0,    plr:1.2, vr:1000, out:400 },
  'Marketing':         { com:0.15, plr:1.0, vr:900,  out:400 },
  'Vendas & Comercial':{ com:0.6,  plr:1.5, vr:800,  out:300 },
  'Operações & CS':    { com:0,    plr:1.0, vr:1000, out:350 },
  'Finanças':          { com:0,    plr:1.5, vr:1100, out:450 },
  'RH & People':       { com:0,    plr:1.0, vr:950,  out:380 },
  'Jurídico':          { com:0,    plr:1.2, vr:1000, out:400 },
  'Saúde':             { com:0,    plr:0.5, vr:600,  out:300 },
  'Educação':          { com:0,    plr:0.5, vr:500,  out:200 },
  'Engenharia':        { com:0,    plr:1.2, vr:1100, out:400 },
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Cidade = {
  nome: string; uf: string; mult: number; nomad?: boolean;
};

export type SalaryInput = {
  cargo:     string;
  area:      string | null;
  cidade:    Cidade;
  workModel: string;
  exp:       number;
  salario:   number;
  extras: {
    com: number; plr: number; plrTipo?: string;
    vr: number;  out: number;
  };
};

export type SalaryResult = {
  cargo: string; area: string | null;
  cidade: Cidade; workModel: string; exp: number;
  my:  { fixo:number; com:number; plr:number; vr:number; out:number; total:number };
  mkt: { fixo:number; com:number; plr:number; vr:number; out:number; total:number };
  diff: number; diffMes: number; diffAno: number;
  isNomad: boolean;
};

// ─── Função principal ─────────────────────────────────────────────────────────

export function computeSalaryResult(input: SalaryInput): SalaryResult {
  const cityM  = input.cidade.mult;
  const modelM = input.cidade.nomad ? MODEL_MULT.nomad : (MODEL_MULT[input.workModel] ?? 1.0);
  const expM   = Math.max(0.6, 1 + (input.exp - 3) * 0.03);

  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let base = BASE_SALARIES[input.cargo];
  if (!base) {
    base = 5500 + Math.abs(
      norm(input.cargo).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    ) % 4000;
  }

  const mktFixo  = Math.round(base * cityM * expM * modelM);
  const vd       = MARKET_VARS[input.area ?? ''] ?? { com:0, plr:1.0, vr:900, out:350 };
  const mktCom   = Math.round(mktFixo * vd.com);
  const mktPlr   = Math.round(mktFixo * vd.plr / 12);
  const mktVr    = Math.round(vd.vr * cityM);
  const mktOut   = Math.round(vd.out * cityM);
  const mktTotal = mktFixo + mktCom + mktPlr + mktVr + mktOut;

  const myFixo  = input.salario;
  const myCom   = input.extras.com;
  const myPlr   = input.extras.plr / 12;
  const myVr    = input.extras.vr;
  const myOut   = input.extras.out;
  const myTotal = myFixo + myCom + myPlr + myVr + myOut;

  const diff    = Math.round(((myTotal - mktTotal) / mktTotal) * 100);
  const diffMes = Math.abs(Math.round(mktTotal - myTotal));

  return {
    cargo: input.cargo, area: input.area,
    cidade: input.cidade, workModel: input.workModel, exp: input.exp,
    my:  { fixo:myFixo,  com:myCom,  plr:myPlr,  vr:myVr,  out:myOut,  total:myTotal  },
    mkt: { fixo:mktFixo, com:mktCom, plr:mktPlr, vr:mktVr, out:mktOut, total:mktTotal },
    diff, diffMes, diffAno: diffMes * 12,
    isNomad: input.cidade.nomad ?? false,
  };
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

export function fmtBRL(n: number): string {
  return 'R$ ' + Math.round(n).toLocaleString('pt-BR');
}
