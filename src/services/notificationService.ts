import { AppSettings } from '../types/types';

// Track fired notification tags to avoid duplicate alerts
const firedTags = new Set<string>();

export const notificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  },

  sendNotification(title: string, body: string, tag?: string): void {
    if (!this.isSupported()) return;
    if (Notification.permission !== 'granted') return;

    if (tag) {
      if (firedTags.has(tag)) return; // Already sent for this tag
      firedTags.add(tag);
    }

    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag,
      });
    } catch (e) {
      console.warn('Failed to send notification:', e);
    }
  },

  clearFiredTag(tag: string): void {
    firedTags.delete(tag);
  },

  resetFiredTags(): void {
    firedTags.clear();
  },

  // Check and trigger notifications based on active state and settings
  checkNotifications(
    settings: AppSettings,
    sessionInfo: {
      sessionId: string;
      isFasting: boolean;
      elapsedMs: number;
      targetMs: number;
    } | null
  ): void {
    if (!settings.enableNotifications) return;
    if (!sessionInfo || !sessionInfo.isFasting) return;

    const { sessionId, elapsedMs, targetMs } = sessionInfo;
    const remainingMs = targetMs - elapsedMs;

    // 1. Fast Start Notification
    if (settings.notifyFastStart && elapsedMs < 10000) {
      this.sendNotification(
        '🧘‍♂️ ¡Ayuno Iniciado!',
        'Tu sesión de ayuno ha comenzado. ¡Tú puedes!',
        `start_${sessionId}`
      );
    }

    // 2. Near End Warning Notification
    if (settings.notifyNearEnd && remainingMs > 0) {
      const nearEndMs = settings.nearEndMinutes * 60 * 1000;
      if (remainingMs <= nearEndMs) {
        const minsLeft = Math.ceil(remainingMs / (60 * 1000));
        this.sendNotification(
          '⏳ ¡Ayuno a punto de terminar!',
          `Quedan aproximadamente ${minsLeft} minutos para completar tu objetivo. ¡Mantente firme!`,
          `near_end_${sessionId}`
        );
      }
    }

    // 3. Fast End Notification
    if (settings.notifyFastEnd && remainingMs <= 0) {
      this.sendNotification(
        '🎉 ¡Objetivo de Ayuno Cumplido!',
        '¡Felicidades! Has alcanzado tu tiempo meta de ayuno.',
        `end_${sessionId}`
      );
    }
  },
};
