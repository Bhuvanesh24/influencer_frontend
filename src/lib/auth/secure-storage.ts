import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

/** Zustand persist adapter backed by expo-secure-store — tokens never touch AsyncStorage. */
export const secureStorage: StateStorage = {
  getItem: async (name) => {
    return (await SecureStore.getItemAsync(name)) ?? null;
  },
  setItem: async (name, value) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name) => {
    await SecureStore.deleteItemAsync(name);
  },
};
