import type { AxiosAdapter, AxiosRequestConfig } from "axios";

import { apiClient } from "@/api/client";

/**
 * Simulation de l'API à la frontière réseau.
 *
 * Le principe importe plus que l'outil : on ne remplace jamais nos hooks ni nos
 * services — un test qui mocke `useBillets` ne teste que le mock. Ici, tout le
 * code applicatif s'exécute pour de vrai (intercepteurs axios, mapping des
 * erreurs, React Query, transformation des données) ; seule la réponse HTTP est
 * fournie par le test.
 *
 * MSW aurait été le choix habituel, mais le paquet déclare
 * « react-native: null » dans ses exports : sous le préréglage Expo, le
 * résolveur retombe sur ses sources TypeScript non transpilées. Remplacer
 * l'adaptateur d'axios intercepte au même endroit, sans cette friction.
 */
type Reponse = { statut: number; corps: unknown };
type Gestionnaire = (config: AxiosRequestConfig) => Reponse | undefined;

const gestionnaires: Gestionnaire[] = [];
let adaptateurOrigine: AxiosAdapter | undefined;

export const serveurApi = {
  /** À appeler dans beforeAll. */
  demarrer() {
    adaptateurOrigine = apiClient.defaults.adapter as AxiosAdapter;

    apiClient.defaults.adapter = (async (config: AxiosRequestConfig) => {
      for (const gestionnaire of gestionnaires) {
        const reponse = gestionnaire(config);
        if (!reponse) continue;

        const resultat = {
          data: reponse.corps,
          status: reponse.statut,
          statusText: String(reponse.statut),
          headers: {},
          config,
        };

        // axios rejette lui-même sur un statut d'erreur : on reproduit ce
        // comportement pour que l'intercepteur d'erreurs soit bien traversé.
        if (reponse.statut >= 400) {
          const erreur: Error & { response?: unknown; config?: unknown; isAxiosError?: boolean } =
            new Error(`Request failed with status code ${reponse.statut}`);
          erreur.response = resultat;
          erreur.config = config;
          erreur.isAxiosError = true;
          throw erreur;
        }

        return resultat;
      }

      throw new Error(`Aucun gestionnaire pour ${config.method?.toUpperCase()} ${config.url}`);
    }) as AxiosAdapter;
  },

  /** À appeler dans afterEach. */
  reinitialiser() {
    gestionnaires.length = 0;
  },

  /** À appeler dans afterAll. */
  arreter() {
    if (adaptateurOrigine) apiClient.defaults.adapter = adaptateurOrigine;
    gestionnaires.length = 0;
  },

  utiliser(...nouveaux: Gestionnaire[]) {
    gestionnaires.push(...nouveaux);
  },
};

/** Réponse paginée à la façon de Laravel. */
export function pagineeLaravel<T>(elements: T[]) {
  return {
    data: elements,
    links: {},
    meta: { current_page: 1, last_page: 1, per_page: 15, total: elements.length },
  };
}

export function repondre(chemin: string, corps: unknown, statut = 200): Gestionnaire {
  return (config) => (config.url === chemin ? { statut, corps } : undefined);
}

export function echouer(chemin: string, statut = 500): Gestionnaire {
  return (config) =>
    config.url === chemin ? { statut, corps: { message: "Erreur serveur." } } : undefined;
}
