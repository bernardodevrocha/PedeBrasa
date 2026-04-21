export const CUT_OPTIONS = [
  "Picanha",
  "Fraldinha",
  "Costela",
  "Linguica artesanal",
  "Ancho",
  "Pao de alho",
];

export const CUT_PRICE_PER_PERSON: Record<string, number> = {
  Picanha: 32,
  Fraldinha: 24,
  Costela: 22,
  "Linguica artesanal": 14,
  Ancho: 30,
  "Pao de alho": 8,
};

export const DEFAULT_GUEST_COUNT = 30;

export type ProfileTab = "agenda" | "parceiros";
