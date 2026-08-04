/* eslint-env jest */

// Modules natifs indisponibles sous Jest : on les remplace par des doublures
// minimales. C'est la seule catégorie qu'on simule — les appels réseau, eux,
// sont interceptés par MSW à la frontière HTTP, jamais en mockant nos hooks.
jest.mock('expo-secure-store', () => {
  const memoire = new Map();
  return {
    getItemAsync: jest.fn(async (cle) => memoire.get(cle) ?? null),
    setItemAsync: jest.fn(async (cle, valeur) => void memoire.set(cle, valeur)),
    deleteItemAsync: jest.fn(async (cle) => void memoire.delete(cle)),
  };
});

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'fr' }],
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  Redirect: () => null,
  Stack: { Screen: () => null },
}));
