export interface Meditation {
  id: number;
  title: string;
  file_path: string;
  file_size: number;
  order: number;
  created_at?: string;
}

export interface Affirmation {
  id: number;
  title: string;
  file_path: string;
  file_size: number;
  order: number;
  created_at?: string;
}

export interface WeeklyIntention {
  id: number;
  text: string;
  order: number;
}

export interface DailyQuestion {
  id: number;
  text: string;
  order: number;
}
