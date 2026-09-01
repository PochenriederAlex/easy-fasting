package com.easyfasting.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class WidgetStageProvider extends AppWidgetProvider {

    public static final String ACTION_AUTO_UPDATE = "com.easyfasting.app.ACTION_AUTO_UPDATE_STAGE";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        scheduleAlarm(context);
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
        cancelAlarm(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_AUTO_UPDATE.equals(intent.getAction()) || AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(intent.getAction())) {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, WidgetStageProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            onUpdate(context, appWidgetManager, appWidgetIds);
        }
    }

    private void scheduleAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, WidgetStageProvider.class);
        intent.setAction(ACTION_AUTO_UPDATE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        if (alarmManager != null) {
            alarmManager.setRepeating(AlarmManager.RTC, System.currentTimeMillis() + 1000, 60000, pendingIntent);
        }
    }

    private void cancelAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, WidgetStageProvider.class);
        intent.setAction(ACTION_AUTO_UPDATE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        if (alarmManager != null) {
            alarmManager.cancel(pendingIntent);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_stage);

        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String isFastingStr = prefs.getString("widget_is_fasting", "false");
        String startTimeStr = prefs.getString("widget_start_time", "");
        String targetHoursStr = prefs.getString("widget_target_hours", "16");

        boolean isFasting = "true".equalsIgnoreCase(isFastingStr);
        double targetHours = 16.0;
        try {
            targetHours = Double.parseDouble(targetHoursStr);
        } catch (Exception ignored) {}

        String stageName = "Alimentación Activa";
        String stageEndTimeText = "Fin: --:--";
        String hoursText = "Ventana de Comida";
        String actionText = isFasting ? "Detener" : "Iniciar";
        int progress = 0;

        if (isFasting && !startTimeStr.isEmpty()) {
            long startMs = parseIsoDate(startTimeStr);
            if (startMs > 0) {
                long nowMs = System.currentTimeMillis();
                long elapsedMs = nowMs - startMs;
                double elapsedHours = elapsedMs / 3600000.0;
                long targetMs = (long) (targetHours * 3600000);

                progress = (int) Math.min(100, Math.max(0, (elapsedMs * 100) / targetMs));
                hoursText = String.format(Locale.US, "%.1f hrs ayunando", elapsedHours);

                // Determine biological stage and its end time
                long stageEndMs;
                if (elapsedHours < 4.0) {
                    stageName = "Absorción de Nutrientes";
                    stageEndMs = startMs + (long)(4.0 * 3600000);
                } else if (elapsedHours < 12.0) {
                    stageName = "Fase de Transición";
                    stageEndMs = startMs + (long)(12.0 * 3600000);
                } else if (elapsedHours < 18.0) {
                    stageName = "Cetosis Temprana";
                    stageEndMs = startMs + (long)(18.0 * 3600000);
                } else if (elapsedHours < 24.0) {
                    stageName = "Cetosis Activa";
                    stageEndMs = startMs + (long)(24.0 * 3600000);
                } else {
                    stageName = "Autofagia y Renovación";
                    stageEndMs = startMs + targetMs;
                }

                stageEndTimeText = "Fin: " + formatClockTime(stageEndMs);
            }
        }

        views.setTextViewText(R.id.widget_stage_name, stageName);
        views.setTextViewText(R.id.widget_stage_timer, stageEndTimeText);
        views.setTextViewText(R.id.widget_stage_hours, hoursText);
        views.setTextViewText(R.id.widget_stage_action_btn, actionText);
        views.setProgressBar(R.id.widget_stage_progress, 100, progress, false);

        // PendingIntent to launch main activity on click
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        views.setOnClickPendingIntent(R.id.widget_stage_container, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_stage_action_btn, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static long parseIsoDate(String isoStr) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date date = sdf.parse(isoStr);
            return date != null ? date.getTime() : 0;
        } catch (Exception e1) {
            try {
                SimpleDateFormat sdf2 = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
                sdf2.setTimeZone(TimeZone.getTimeZone("UTC"));
                Date date = sdf2.parse(isoStr);
                return date != null ? date.getTime() : 0;
            } catch (Exception e2) {
                return 0;
            }
        }
    }

    private static String formatClockTime(long timeMs) {
        SimpleDateFormat sdf = new SimpleDateFormat("HH:mm 'hs'", Locale.getDefault());
        return sdf.format(new Date(timeMs));
    }
}
