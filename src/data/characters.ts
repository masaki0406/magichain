export type CharacterSeed = {
  id: string;
  name: string;
  title: string;
  portrait: string;
  locationId: string;
  healthMax: number;
  sanityMax: number;
  stats: {
    lore: number;
    influence: number;
    observation: number;
    strength: number;
    will: number;
  };
  abilityKey: string;
  abilitySummary: string;
  abilityDetail: string;
};

export const CHARACTER_SEEDS: CharacterSeed[] = [
  {
    id: "akachi_onyele",
    name: "Akachi Onyele",
    title: "The Shaman",
    portrait: "/assets/investigators/akachi.png",
    locationId: "heart_of_africa",
    healthMax: 7,
    sanityMax: 5,
    stats: { lore: 3, influence: 2, observation: 2, strength: 2, will: 4 },
    abilityKey: "akachi_extra_gate_close",
    abilitySummary: "Gate close adds +1 gate removal.",
    abilityDetail:
      "After succeeding at an Other World encounter to close a gate, close one additional gate.",
  },
  {
    id: "diana_stanley",
    name: "Diana Stanley",
    title: "The Medium",
    portrait: "/assets/investigators/diana.png",
    locationId: "london",
    healthMax: 5,
    sanityMax: 7,
    stats: { lore: 4, influence: 2, observation: 2, strength: 1, will: 3 },
    abilityKey: "diana_spell_sanity",
    abilitySummary: "Regain 1 Sanity after casting a spell.",
    abilityDetail:
      "After resolving a spell (front/back), recover 1 Sanity regardless of outcome.",
  },
  {
    id: "jacqueline_fine",
    name: "Jacqueline Fine",
    title: "The Psychic",
    portrait: "/assets/investigators/jacqueline.png",
    locationId: "arkham",
    healthMax: 6,
    sanityMax: 6,
    stats: { lore: 3, influence: 2, observation: 3, strength: 1, will: 3 },
    abilityKey: "jacqueline_die_swap",
    abilitySummary: "Swap a die in a test at your location.",
    abilityDetail:
      "When you or another investigator at your location makes a test, you may replace one die with another.",
  },
  {
    id: "leo_anderson",
    name: "Leo Anderson",
    title: "The Expedition Leader",
    portrait: "/assets/investigators/leo.png",
    locationId: "buenos_aires",
    healthMax: 7,
    sanityMax: 5,
    stats: { lore: 2, influence: 3, observation: 3, strength: 2, will: 2 },
    abilityKey: "leo_extra_ally",
    abilitySummary: "Can hold 1 additional Ally.",
    abilityDetail:
      "You may have up to 2 Ally assets instead of the normal 1.",
  },
  {
    id: "lily_chen",
    name: "Lily Chen",
    title: "The Martial Artist",
    portrait: "/assets/investigators/lily.png",
    locationId: "shanghai",
    healthMax: 8,
    sanityMax: 4,
    stats: { lore: 1, influence: 2, observation: 3, strength: 4, will: 2 },
    abilityKey: "lily_combat_bonus",
    abilitySummary: "Combat successes deal +1 damage each.",
    abilityDetail:
      "During a Combat test, each success deals +1 additional damage (double success value).",
  },
  {
    id: "mandy_thompson",
    name: "Mandy Thompson",
    title: "The Researcher",
    portrait: "/assets/investigators/mandy.png",
    locationId: "san_francisco",
    healthMax: 5,
    sanityMax: 7,
    stats: { lore: 4, influence: 2, observation: 3, strength: 1, will: 2 },
    abilityKey: "mandy_draw_choose",
    abilitySummary: "Draw 2 cards, choose 1.",
    abilityDetail:
      "Whenever you draw a card, draw 1 additional card and keep 1 of your choice.",
  },
  {
    id: "mark_harrigan",
    name: "Mark Harrigan",
    title: "The Soldier",
    portrait: "/assets/investigators/mark.png",
    locationId: "sydney",
    healthMax: 8,
    sanityMax: 4,
    stats: { lore: 1, influence: 2, observation: 3, strength: 4, will: 2 },
    abilityKey: "mark_focus_damage",
    abilitySummary: "Spend Focus instead of taking damage.",
    abilityDetail:
      "When you would lose Health or Sanity, you may spend a Focus token instead.",
  },
  {
    id: "norman_withers",
    name: "Norman Withers",
    title: "The Astronomer",
    portrait: "/assets/investigators/norman.png",
    locationId: "arkham",
    healthMax: 4,
    sanityMax: 8,
    stats: { lore: 4, influence: 1, observation: 2, strength: 1, will: 4 },
    abilityKey: "norman_start_spell",
    abilitySummary: "Starts with a Spell and gains spell bonuses.",
    abilityDetail:
      "Begin the game with a Spell. Spell-focused effects are amplified.",
  },
  {
    id: "silas_marsh",
    name: "Silas Marsh",
    title: "The Sailor",
    portrait: "/assets/investigators/silas.png",
    locationId: "sydney",
    healthMax: 8,
    sanityMax: 4,
    stats: { lore: 1, influence: 2, observation: 3, strength: 3, will: 3 },
    abilityKey: "silas_sea_bonus",
    abilitySummary: "Sea encounters and travel are improved.",
    abilityDetail:
      "Gains advantages in Sea encounters and during Ship travel.",
  },
  {
    id: "trish_scarborough",
    name: "Trish Scarborough",
    title: "The Spy",
    portrait: "/assets/investigators/trish.png",
    locationId: "rome",
    healthMax: 6,
    sanityMax: 6,
    stats: { lore: 2, influence: 3, observation: 4, strength: 1, will: 2 },
    abilityKey: "trish_clue_on_success",
    abilitySummary: "Gain a clue when allies succeed nearby.",
    abilityDetail:
      "When another investigator at your location succeeds on a test, you gain 1 Clue.",
  },
  {
    id: "wilson_richards",
    name: "Wilson Richards",
    title: "The Handyman",
    portrait: "/assets/investigators/wilson.png",
    locationId: "buenos_aires",
    healthMax: 7,
    sanityMax: 5,
    stats: { lore: 2, influence: 3, observation: 2, strength: 3, will: 2 },
    abilityKey: "wilson_reuse_asset",
    abilitySummary: "Reusable single-use assets.",
    abilityDetail:
      "When you would discard a single-use asset, you may keep it on a success.",
  },
  {
    id: "jim_culver",
    name: "Jim Culver",
    title: "The Musician",
    portrait: "/assets/investigators/jim.png",
    locationId: "arkham",
    healthMax: 6,
    sanityMax: 6,
    stats: { lore: 2, influence: 3, observation: 2, strength: 2, will: 3 },
    abilityKey: "jim_ignore_ones",
    abilitySummary: "Ones do not count as failures.",
    abilityDetail:
      "When resolving tests, results of 1 are ignored and do not count as failures.",
  },
];
