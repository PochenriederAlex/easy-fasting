import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { AppSettings, FastSession } from '../types/types';

export const widgetSync = {
  async syncWidgetData(
    settings: AppSettings,
    activeSession: FastSession | null,
    isFasting: boolean
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Preferences.set({ key: 'widget_is_fasting', value: isFasting ? 'true' : 'false' });
      await Preferences.set({ key: 'widget_fasting_type', value: settings.fastingType });

      if (isFasting && activeSession) {
        await Preferences.set({ key: 'widget_start_time', value: activeSession.startTime });
        await Preferences.set({ key: 'widget_target_hours', value: activeSession.targetDuration.toString() });
      } else if (settings.fastingType === 'flexible') {
        await Preferences.set({ key: 'widget_target_hours', value: settings.flexibleDuration.toString() });
      } else {
        await Preferences.set({ key: 'widget_target_hours', value: settings.strictDuration.toString() });
      }
    } catch (e) {
      console.warn('Failed to sync widget preferences:', e);
    }
  },
};
