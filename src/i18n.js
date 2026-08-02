import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { storage } from './utils/storage';

// Importation des fichiers de traduction JSON
import fr from './Locales/locales/fr.json';
import en from './Locales/locales/en.json';
import es from './Locales/locales/es.json';

// Clé de stockage persistante pour enregistrer le choix de la langue
const LANGUAGE_KEY = 'user_language';

// Définition des ressources pour chaque langue disponible
const resources = {
  fr: { translation: fr },
  en: { translation: en },
  es: { translation: es },
};

/**
 * Langues proposées à l'utilisateur, dans l'ordre d'affichage.
 *
 * Source unique : l'écran Réglages construit son sélecteur à partir d'ici, pour
 * qu'ajouter une langue se limite à déposer son JSON et à l'ajouter à cette
 * liste — sans avoir à penser à modifier un écran.
 */
export const LANGUES_DISPONIBLES = [
  { code: 'fr', libelle: 'Français' },
  { code: 'en', libelle: 'English' },
  { code: 'es', libelle: 'Español' },
];

// Détecteur de langue personnalisé (asynchrone)
const languageDetector = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async (callback) => {
    try {
      // 1. Tente de récupérer la langue précédemment sauvegardée par l'utilisateur
      const savedLanguage = await storage.get(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
    } catch (error) {
      console.log('Erreur lors de la lecture de la langue depuis le stockage :', error);
    }
    
    try {
      // 2. Si aucune langue n'est sauvegardée, tente de récupérer la langue du système de l'appareil
      const locales = getLocales();
      if (locales && locales.length > 0 && locales[0].languageCode) {
        return callback(locales[0].languageCode);
      }
    } catch (error) {
      console.log('Erreur lors du ciblage de la locale de l\'appareil :', error);
    }
    
    // 3. Langue de secours par défaut en cas d'absence de langue trouvée
    callback('fr');
  },
  cacheUserLanguage: async (lng) => {
    try {
      // Enregistre de manière persistante la langue sélectionnée par l'utilisateur
      await storage.set(LANGUAGE_KEY, lng);
    } catch (error) {
      console.log('Erreur lors de la mise en cache de la langue utilisateur :', error);
    }
  }
};

// Initialisation et configuration globale de i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4', // Assure la compatibilité JSON v4 pour la gestion des pluriels sous React Native
    resources,
    fallbackLng: 'fr', // Langue de secours si une clé de traduction est manquante
    interpolation: {
      escapeValue: false, // React gère nativement l'échappement pour prévenir les failles XSS
    },
    react: {
      useSuspense: false, // Désactive Suspense pour éviter les problèmes de rendu asynchrone sous React Native
    }
  });

export default i18n;
