import { voyageService } from "@/services/voyage.service";
import { echouer, pagineeLaravel, repondre, serveurApi } from "@/test-utils/serveur-api";

beforeAll(() => serveurApi.demarrer());
afterEach(() => serveurApi.reinitialiser());
afterAll(() => serveurApi.arreter());

function voyageApi(surcharge: Record<string, unknown> = {}) {
  return {
    id: "v-1",
    // Le backend sérialise une colonne DATE en datetime ISO complet.
    date_voyage: "2026-08-02T00:00:00.000000Z",
    places: 450,
    places_restantes: 300,
    trajet: { id: "t-1", jour: "DIMANCHE", heure_depart: "07:30:00", duree: 20 },
    chaloupe: { id: "c-1", nom: "Beer", capacite: 450, statut: "ACTIVE" },
    created_at: "2026-07-01T00:00:00.000000Z",
    ...surcharge,
  };
}

describe("voyageService.list", () => {
  it("normalise la date en YYYY-MM-DD pour le reste de l'app", async () => {
    serveurApi.utiliser(repondre("/voyages", pagineeLaravel([voyageApi()])));

    const [voyage] = await voyageService.list();

    // Tout l'app compare des date_voyage entre eux : le format doit être fiable.
    expect(voyage.date_voyage).toBe("2026-08-02");
    expect(voyage.places_restantes).toBe(300);
  });

  it("renvoie une liste vide plutôt que de casser quand l'API n'a rien", async () => {
    serveurApi.utiliser(repondre("/voyages", pagineeLaravel([])));

    await expect(voyageService.list()).resolves.toEqual([]);
  });

  it("propage une erreur exploitable quand l'API échoue", async () => {
    serveurApi.utiliser(echouer("/voyages", 500));

    // L'intercepteur traduit la réponse en ApiError porteuse d'un message.
    await expect(voyageService.list()).rejects.toThrow();
  });

  it("accepte un voyage dont le trajet a été supprimé", async () => {
    serveurApi.utiliser(repondre("/voyages", pagineeLaravel([voyageApi({ trajet: null })])));

    const [voyage] = await voyageService.list();

    expect(voyage.trajet).toBeNull();
    expect(voyage.date_voyage).toBe("2026-08-02");
  });
});
