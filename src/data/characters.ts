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
};

export const CHARACTER_SEEDS: CharacterSeed[] = [
  {
    id: "silas_marsh",
    name: "Silas Marsh",
    title: "The Sailor",
    portrait: "/assets/investigators/silas.png",
    locationId: "sydney",
    healthMax: 7,
    sanityMax: 5,
    stats: { lore: 1, influence: 2, observation: 3, strength: 3, will: 2 },
  },
  {
    id: "daisy_walker",
    name: "Daisy Walker",
    title: "The Librarian",
    portrait: "/assets/investigators/daisy.png",
    locationId: "arkham",
    healthMax: 5,
    sanityMax: 7,
    stats: { lore: 4, influence: 2, observation: 2, strength: 1, will: 3 },
  },
  {
    id: "akachi_onyelie",
    name: "Akachi Onyele",
    title: "The Shaman",
    portrait: "/assets/investigators/akachi.png",
    locationId: "heart_of_africa",
    healthMax: 7,
    sanityMax: 5,
    stats: { lore: 4, influence: 2, observation: 2, strength: 2, will: 3 },
  },
  {
    id: "mark_harrigan",
    name: "Mark Harrigan",
    title: "The Soldier",
    portrait: "/assets/investigators/mark.png",
    locationId: "san_francisco",
    healthMax: 7,
    sanityMax: 5,
    stats: { lore: 1, influence: 2, observation: 3, strength: 4, will: 2 },
  },
  {
    id: "jacqueline_fine",
    name: "Jacqueline Fine",
    title: "The Psychic",
    portrait: "/assets/investigators/jacqueline.png",
    locationId: "london",
    healthMax: 6,
    sanityMax: 6,
    stats: { lore: 3, influence: 2, observation: 2, strength: 1, will: 4 },
  },
  {
    id: "trish_scarborough",
    name: "Trish Scarborough",
    title: "The Spy",
    portrait: "/assets/investigators/trish.png",
    locationId: "tokyo",
    healthMax: 6,
    sanityMax: 6,
    stats: { lore: 2, influence: 3, observation: 4, strength: 2, will: 2 },
  },
  {
    id: "jim_culver",
    name: "Jim Culver",
    title: "The Musician",
    portrait: "/assets/investigators/jim.png",
    locationId: "arkham",
    healthMax: 6,
    sanityMax: 6,
    stats: { lore: 3, influence: 2, observation: 2, strength: 2, will: 3 },
  },
  {
    id: "wendy_adams",
    name: "Wendy Adams",
    title: "The Urchin",
    portrait: "/assets/investigators/wendy.png",
    locationId: "san_francisco",
    healthMax: 7,
    sanityMax: 5,
    stats: { lore: 2, influence: 2, observation: 3, strength: 2, will: 3 },
  },
];
