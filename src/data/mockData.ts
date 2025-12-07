export interface Neighborhood {
  id: string;
  name: string;
  image: string;
  textColor: string;
  requirements: string[];
  derbyRequirements: string;
  tag: string;
  leader: string;
}

export interface Event {
  id: string;
  name: string;
  image: string;
  category: 'Main' | 'Mini' | 'Weekly Derby';
  winners: string[];
  host: string;
  sponsors: { name: string; amount: string }[];
}

export const initialNeighborhoods: Neighborhood[] = [
  {
    id: '1',
    name: 'GOAT GANG',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000&auto=format&fit=crop',
    textColor: '#ffffff',
    requirements: ['Level 50+', 'Active Daily', 'Derby Focused'],
    derbyRequirements: '3200 points minimum',
    tag: '#GG2024',
    leader: 'The Goat Father',
  },
  {
    id: '2',
    name: 'FARM LEGENDS',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop',
    textColor: '#f0f0f0',
    requirements: ['Level 30+', 'Helpful'],
    derbyRequirements: 'Participate in all tasks',
    tag: '#FL888',
    leader: 'Farmer Joe',
  },
  {
    id: '3',
    name: 'BARN RAISERS',
    image: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?q=80&w=1000&auto=format&fit=crop',
    textColor: '#e0e0e0',
    requirements: ['No Drama', 'Trade Often'],
    derbyRequirements: 'Optional',
    tag: '#BR123',
    leader: 'Sally Sue',
  }
];

export const initialEvents: Event[] = [
  {
    id: '1',
    name: 'Grand Harvest Festival',
    image: 'https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?q=80&w=1000&auto=format&fit=crop',
    category: 'Main',
    winners: ['FarmKing99', 'CropMaster', 'HayDayHero'],
    host: 'Goat Gang Admins',
    sponsors: [{ name: 'SuperCell', amount: '5000 Diamonds' }, { name: 'Local Farmers', amount: '1M Coins' }],
  },
  {
    id: '2',
    name: 'Speed Truck Event',
    image: 'https://images.unsplash.com/photo-1586775490184-b791341642ec?q=80&w=1000&auto=format&fit=crop',
    category: 'Mini',
    winners: ['TruckerTom'],
    host: 'Speedy Gonzales',
    sponsors: [{ name: 'Truck Co', amount: '500 Diamonds' }],
  },
  {
    id: '3',
    name: 'Weekly Derby Championship',
    image: 'https://images.unsplash.com/photo-1535090467336-9501f96eef89?q=80&w=1000&auto=format&fit=crop',
    category: 'Weekly Derby',
    winners: ['Goat Gang', 'Farm Legends', 'Barn Raisers'],
    host: 'Derby Committee',
    sponsors: [{ name: 'Mayor', amount: 'Trophy' }],
  }
];
