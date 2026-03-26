import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CoinState {
  coins: number;
  loaded: boolean;
  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
  loadCoins: () => Promise<void>;
}

export const useCoinStore = create<CoinState>((set, get) => ({
  coins: 3,
  loaded: false,

  addCoins: (n) => {
    set(s => {
      const newCoins = s.coins + n;
      AsyncStorage.setItem('@qg_coins', String(newCoins));
      return { coins: newCoins };
    });
  },

  spendCoins: (n) => {
    const { coins } = get();
    if (coins < n) return false;
    const newCoins = coins - n;
    set({ coins: newCoins });
    AsyncStorage.setItem('@qg_coins', String(newCoins));
    return true;
  },

  loadCoins: async () => {
    try {
      const saved = await AsyncStorage.getItem('@qg_coins');
      if (saved !== null) set({ coins: parseInt(saved, 10), loaded: true });
      else set({ loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
