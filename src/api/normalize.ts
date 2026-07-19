/**
 * Le backend n'a pas une enveloppe de réponse uniforme (vérifié endpoint par
 * endpoint, pas de convention globale) :
 *  - /login, /register       -> objet brut, PAS wrappé dans "data" (LoginResource::$wrap = null)
 *  - /me, /voyages, /billets,
 *    /portefeuille           -> wrappés dans { data: ... } (JsonResource par défaut Laravel)
 *  - /trajets, /chaloupes,
 *    /tarifs                 -> JSON brut, PAS wrappé (les contrôleurs renvoient les modèles directement)
 *
 * On ne touche pas au backend pour uniformiser ça : l'app admin le consomme déjà
 * tel quel. La normalisation reste ici, explicite par endpoint plutôt que devinée
 * automatiquement (un unwrap "magique" basé sur la présence d'une clé "data"
 * casserait silencieusement le jour où une ressource métier a elle-même un champ
 * "data").
 */
export function unwrapResource<T>(body: { data: T }): T {
  return body.data;
}

export interface LaravelPaginated<T> {
  data: T[];
  links?: unknown;
  meta?: unknown;
}

export function unwrapPaginated<T>(body: LaravelPaginated<T>): T[] {
  return body.data;
}
