export type FastingType = 'flexible' | 'strict';

export interface AppSettings {
  fastingType: FastingType;
  flexibleDuration: number; // in hours
  strictStartTime: string; // "HH:MM" format
  strictDuration: number; // in hours
}

export interface FastSession {
  id: string;
  startTime: string; // ISO string
  endTime: string | null; // ISO string, null if currently active
  targetDuration: number; // in hours
  type: FastingType;
  completed: boolean;
}

export interface FastingStats {
  totalFasts: number;
  completedFasts: number;
  totalHoursFasted: number;
  longestFastHours: number;
  currentStreak: number;
}
