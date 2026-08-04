import { formatHeureDepart, heureDepartBrute, joursRestants } from "@/utils/date";

describe("formatHeureDepart", () => {
  it("réduit un horaire SQL à l'heure et aux minutes", () => {
    expect(formatHeureDepart("07:30:00")).toBe("07:30");
  });

  it("accepte l'absence d'horaire sans planter", () => {
    // Le trajet d'un voyage peut avoir été supprimé côté admin.
    expect(formatHeureDepart(null)).toBe("—");
    expect(formatHeureDepart(undefined)).toBe("—");
    expect(formatHeureDepart("")).toBe("—");
  });
});

describe("heureDepartBrute", () => {
  it("renvoie l'horaire du trajet", () => {
    expect(heureDepartBrute({ trajet: { heure_depart: "16:00:00" } })).toBe("16:00:00");
  });

  it("renvoie une chaîne vide sans trajet, pour que le tri reste stable", () => {
    expect(heureDepartBrute({ trajet: null })).toBe("");
  });
});

describe("joursRestants", () => {
  function dans(jours: number): string {
    const d = new Date();
    d.setDate(d.getDate() + jours);
    return d.toISOString();
  }

  it("compte les jours calendaires jusqu'à l'échéance", () => {
    expect(joursRestants(dans(30))).toBe(30);
    expect(joursRestants(dans(1))).toBe(1);
  });

  it("compte le jour même comme zéro plutôt que de tomber en négatif", () => {
    expect(joursRestants(dans(0))).toBe(0);
  });

  it("ne descend jamais sous zéro pour une échéance passée", () => {
    expect(joursRestants(dans(-10))).toBe(0);
  });
});
