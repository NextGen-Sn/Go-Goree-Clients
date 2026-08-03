import { mapBilletToTicket } from "@/services/billet.service";
import { Billet } from "@/types/billet";

/**
 * Ces cas viennent tous de plantages réels observés en production locale : un
 * seul billet mal formé suffisait à vider l'écran « Mes billets ».
 */
function billet(surcharge: Partial<Billet> = {}): Billet {
  return {
    id: "b-1",
    qr_token: "GOREE_XXX",
    montant: "2500.00",
    statut: "PAYE",
    created_at: "2026-08-01T10:00:00.000000Z",
    voyage: {
      id: "v-1",
      date_voyage: "2026-08-02T00:00:00.000000Z",
      places: 100,
      places_restantes: 40,
      trajet: { id: "t-1", jour: "DIMANCHE", heure_depart: "07:30:00", duree: 20 },
      chaloupe: { id: "c-1", nom: "Beer", capacite: 450, statut: "ACTIVE" },
      created_at: "2026-07-01T00:00:00.000000Z",
    },
    tarif: null,
    ...surcharge,
  } as Billet;
}

describe("mapBilletToTicket", () => {
  it("compose la date et l'heure de départ quand le voyage est complet", () => {
    const ticket = mapBilletToTicket(billet());

    expect(ticket.dateLabel).toContain("07:30");
    expect(ticket.total).toBe(2500);
    expect(ticket.status).toBe("valide");
  });

  it("survit à un voyage dont le trajet a été supprimé", () => {
    const abime = billet({ voyage: { ...billet().voyage!, trajet: null } } as Partial<Billet>);

    // Avant correction : « Cannot read properties of null » — et toute la liste
    // des billets échouait à cause de ce seul billet.
    expect(() => mapBilletToTicket(abime)).not.toThrow();
    expect(mapBilletToTicket(abime).dateLabel).not.toContain("undefined");
  });

  it("affiche un libellé neutre quand le voyage lui-même a disparu", () => {
    const ticket = mapBilletToTicket(billet({ voyage: null } as Partial<Billet>));

    expect(ticket.dateLabel).toBe("Voyage indisponible");
  });

  it("traduit chaque statut backend en statut d'affichage", () => {
    expect(mapBilletToTicket(billet({ statut: "UTILISE" })).status).toBe("utilisé");
    expect(mapBilletToTicket(billet({ statut: "EXPIRE" })).status).toBe("expiré");
    expect(mapBilletToTicket(billet({ statut: "EN_ATTENTE_PAIEMENT" })).status).toBe("en_attente");
    // ANNULE n'a pas de statut local dédié : traité comme inutilisable.
    expect(mapBilletToTicket(billet({ statut: "ANNULE" })).status).toBe("expiré");
  });
});
