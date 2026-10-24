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
    slug: 'blind-flight',
    title: 'Blind Flight',
    tagline: 'Love at first flight. Regret at baggage claim.',
    image: '/images/destinations/tallinn.jpg',
  },
  {
    slug: 'getaway-show',
    title: 'The Great British Getaway Show',
    tagline: 'Tonight, twelve cities enter. Two indecisive adults leave.',
    image: '/images/destinations/krakow.jpg',
  },
];
