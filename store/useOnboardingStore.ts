import { create } from 'zustand';
import { SalaryInput, SalaryResult } from '../lib/salary';

type Cidade = SalaryInput['cidade'];

interface OnboardingState {
  // Step 1 — Cargo
  cargo:    string;
  area:     string | null;

  // Step 2 — Localização
  cidade:   Cidade | null;
  workModel: string;
  exp:       number;

  // Step 3 — Salário
  salario:  number;
  extras: {
    com: number; plr: number; plrTipo: string;
    vr: number;  out: number;
  };

  // Resultado calculado
  result: SalaryResult | null;

  // Actions
  setCargo:     (cargo: string, area: string | null) => void;
  setCidade:    (cidade: Cidade) => void;
  setWorkModel: (model: string) => void;
  setExp:       (exp: number) => void;
  setSalario:   (salario: number) => void;
  setExtras:    (extras: Partial<OnboardingState['extras']>) => void;
  setResult:    (result: SalaryResult) => void;
  reset:        () => void;
}

const initialExtras = { com: 0, plr: 0, plrTipo: 'plr', vr: 0, out: 0 };

export const useOnboardingStore = create<OnboardingState>((set) => ({
  cargo:     '',
  area:      null,
  cidade:    null,
  workModel: 'hibrido',
  exp:       3,
  salario:   0,
  extras:    initialExtras,
  result:    null,

  setCargo:     (cargo, area) => set({ cargo, area }),
  setCidade:    (cidade)      => set({ cidade }),
  setWorkModel: (workModel)   => set({ workModel }),
  setExp:       (exp)         => set({ exp }),
  setSalario:   (salario)     => set({ salario }),
  setExtras:    (extras)      => set(s => ({ extras: { ...s.extras, ...extras } })),
  setResult:    (result)      => set({ result }),
  reset:        ()            => set({ cargo:'', area:null, cidade:null, workModel:'hibrido', exp:3, salario:0, extras:initialExtras, result:null }),
}));
