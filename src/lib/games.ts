export type GameListing = {
  slug: string;
  title: string;
  tagline: string;
  image: string;
  // Games still being built show on the home page but cannot be opened.
  comingSoon?: boolean;
};

export const games: GameListing[] = [
  {
    slug: 'january-getaway',
    title: 'The Great January Getaway',
    tagline: 'Two travellers. Twenty holidays. One deeply overworked spreadsheet.',
    image: '/images/destinations/prague.jpg',
  },
  {
    slug: 'coming-soon',
    title: 'Game Two',
    tagline: 'Currently in rehearsal. Please do not feed the contestants.',
    image: '/images/destinations/tenerife.jpg',
    comingSoon: true,
  },
];
