export const FUNDING_TIERS = {
  SEED: {
    id: "SEED",
    name: "Seed Grant",
    maxAmount: 25000,
    currency: "INR",
    minOriginalityScore: 70,
    minProjectProgress: 50,
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth Grant",
    maxAmount: 100000,
    currency: "INR",
    minOriginalityScore: 85,
    minProjectProgress: 80,
  },
  INNOVATION: {
    id: "INNOVATION",
    name: "Innovation Grant",
    maxAmount: 500000,
    currency: "INR",
    minOriginalityScore: 95,
    minProjectProgress: 100, // Completion required
  },
};

export const ORIGINALITY_PASS_THRESHOLD = 75;
