import { AppSettings, FastSession, FastingStats } from '../types/types';

const SETTINGS_KEY = 'easy_fasting_settings';
const ACTIVE_SESSION_KEY = 'easy_fasting_active_session';
const HISTORY_KEY = 'easy_fasting_history';
const LAST_EATING_START_KEY = 'easy_fasting_last_eating_start';

const DEFAULT_SETTINGS: AppSettings = {
  fastingType: 'flexible',
  flexibleDuration: 16,
  strictStartTime: '20:00',
  strictDuration: 16,
};

export const storage = {
  // Settings
  loadSettings(): AppSettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Active Session (only for flexible, or strict overrides)
  loadActiveSession(): FastSession | null {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveActiveSession(session: FastSession | null): void {
    if (session === null) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    }
  },

  // History
  loadHistory(): FastSession[] {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as FastSession[];
      // Sort by start time descending (newest first)
      return parsed.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    } catch {
      return [];
    }
  },

  saveHistory(history: FastSession[]): void {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  addHistorySession(session: FastSession): void {
    const history = this.loadHistory();
    // Avoid duplicates
    if (!history.some(s => s.id === session.id)) {
      history.push(session);
      this.saveHistory(history);
    }
  },

  deleteHistorySession(id: string): void {
    const history = this.loadHistory();
    const filtered = history.filter(s => s.id !== id);
    this.saveHistory(filtered);
  },

  // Eating start timestamp (for flexible eating window tracking)
  loadLastEatingStart(): string | null {
    return localStorage.getItem(LAST_EATING_START_KEY);
  },

  saveLastEatingStart(isoString: string | null): void {
    if (isoString === null) {
      localStorage.removeItem(LAST_EATING_START_KEY);
    } else {
      localStorage.setItem(LAST_EATING_START_KEY, isoString);
    }
  },

  clearAllData(): void {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(LAST_EATING_START_KEY);
  },

  // Statistics
  calculateStats(history: FastSession[]): FastingStats {
    const totalFasts = history.length;
    
    const completedFasts = history.filter(s => s.completed).length;

    let totalHoursFasted = 0;
    let longestFastHours = 0;

    history.forEach(session => {
      if (session.endTime) {
        const start = new Date(session.startTime).getTime();
        const end = new Date(session.endTime).getTime();
        const durationHours = (end - start) / (1000 * 60 * 60);
        
        totalHoursFasted += durationHours;
        if (durationHours > longestFastHours) {
          longestFastHours = durationHours;
        }
      }
    });

    // Calculate current streak
    // A day is counted in streak if there is a completed fast on that calendar date or the previous date
    const streak = this.calculateStreak(history);

    return {
      totalFasts,
      completedFasts,
      totalHoursFasted: parseFloat(totalHoursFasted.toFixed(1)),
      longestFastHours: parseFloat(longestFastHours.toFixed(1)),
      currentStreak: streak,
    };
  },

  calculateStreak(history: FastSession[]): number {
    const completed = history
      .filter(s => s.completed && s.endTime)
      .map(s => {
        const date = new Date(s.endTime!);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      });

    if (completed.length === 0) return 0;

    // Remove duplicates and sort descending
    const uniqueDates = Array.from(new Set(completed)).sort((a, b) => b - a);

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let streak = 0;
    let expectedDate = todayMidnight;

    // If there is no fast today, but there was one yesterday, we can still continue the streak
    if (uniqueDates[0] !== todayMidnight && uniqueDates[0] === todayMidnight - oneDayMs) {
      expectedDate = todayMidnight - oneDayMs;
    } else if (uniqueDates[0] !== todayMidnight) {
      // No fast today or yesterday
      return 0;
    }

    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === expectedDate) {
        streak++;
        expectedDate -= oneDayMs;
      } else if (uniqueDates[i] < expectedDate) {
        // Streak is broken
        break;
      }
    }

    return streak;
  }
};
