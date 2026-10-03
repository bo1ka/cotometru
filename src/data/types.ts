export interface Person {
  name: string;
  age?: number;
  role?: string;
}

export interface Couple {
  slug: string;
  shortName: string;
  a: Person;
  b: Person;
  together?: string;
  status?: string;
  location?: string;
  why?: string;
  source?: { label: string; url: string };
  history: { together: number[]; temptation: number[] };
  notes?: Record<number, string>;
}

export interface Episode {
  number: number;
  date: string;
  summary?: string;
}

export interface NewsItem {
  date?: string;
  source: string;
  title: string;
  url: string;
  kind: 'aired' | 'rumor';
  couples?: string[];
}

export interface Schedule {
  start: string;
  end?: string;
  slots: { weekday: number; time: string }[];
  skip?: string[];
  extra?: { date: string; time: string }[];
}

export interface NightQuestion {
  episode: number;
  question: string;
  options: string[];
}

export interface Season {
  number: number;
  question: string;
  schedule?: Schedule;
  nightly?: NightQuestion[];
  episodes: Episode[];
  couples: Couple[];
}

export interface CommunityLink {
  name: string;
  url: string;
  platform: 'Facebook' | 'TikTok' | 'Instagram' | 'YouTube' | 'Reddit' | 'Site';
  note?: string;
}

export interface ShowLink {
  label: string;
  url: string;
  prefix?: string;
  logo?: { dark: string; light: string; alt: string };
}

export interface Show {
  slug: string;
  name: string;
  status: 'live' | 'soon';
  description?: string;
  image?: { src: string; alt: string };
  facts?: { label: string; value: string }[];
  links?: ShowLink[];
  community?: CommunityLink[];
  season?: Season;
  poll?: { question: string; options: string[] };
  news?: NewsItem[];
}
