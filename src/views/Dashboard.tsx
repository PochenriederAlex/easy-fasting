import React, { useState, useEffect } from 'react';
import { AppSettings, FastSession } from '../types/types';
import { storage } from '../services/storage';
import { CircularProgress } from '../components/CircularProgress';

interface DashboardProps {
  settings: AppSettings;
  activeSession: FastSession | null;
  setActiveSession: (session: FastSession | null) => void;
  onFastLogged: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  settings,
  activeSession,
  setActiveSession,
  onFastLogged,
}) => {
  const [now, setNow] = useState<Date>(new Date());
  
  // Strict mode calculated state
  const [strictState, setStrictState] = useState<{
    isFasting: boolean;
    windowStart: Date;
    windowEnd: Date;
    timeLeftMs: number;
    progress: number;
  } | null>(null);

  // Unlogged strict fasts
  const [unloggedFasts, setUnloggedFasts] = useState<{ start: Date; end: Date }[]>([]);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Recalculate strict mode window and unlogged fasts
  useEffect(() => {
    if (settings.fastingType === 'strict') {
      const state = calculateStrictState(now, settings);
      setStrictState(state);
      
      // Look for unlogged strict fasts from the last 3 days
      checkUnloggedStrictFasts(settings);
    } else {
      setStrictState(null);
      setUnloggedFasts([]);
    }
  }, [now, settings]);

  // Check for unlogged strict fasts
  const checkUnloggedStrictFasts = (settings: AppSettings) => {
    const history = storage.loadHistory();
    const list: { start: Date; end: Date }[] = [];
    const today = new Date();
    
    // Check last 3 days (excluding today's current/future fast)
    for (let i = 1; i <= 3; i++) {
      const baseDate = new Date();
      baseDate.setDate(today.getDate() - i);
      
      const [hours, minutes] = settings.strictStartTime.split(':').map(Number);
      const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0);
      const end = new Date(start.getTime() + settings.strictDuration * 60 * 60 * 1000);
      
      // If the fast has completely finished
      if (end.getTime() < today.getTime()) {
        // Check if there is an overlapping history item
        const isLogged = history.some(session => {
          if (session.type !== 'strict') return false;
          const sessionStart = new Date(session.startTime).getTime();
          
          // Overlaps if session start is within 1 hour of our target start
          const timeDiff = Math.abs(sessionStart - start.getTime());
          return timeDiff < 60 * 60 * 1000;
        });

        if (!isLogged) {
          list.push({ start, end });
        }
      }
    }
    setUnloggedFasts(list);
  };

  // Calculate Strict mode state
  const calculateStrictState = (currentDate: Date, settings: AppSettings) => {
    const [hours, minutes] = settings.strictStartTime.split(':').map(Number);
    const durationMs = settings.strictDuration * 60 * 60 * 1000;
    
    // Dates to test: yesterday and today
    const testDates = [
      new Date(currentDate.getTime() - 24 * 60 * 60 * 1000), // Yesterday
      new Date(currentDate.getTime()),                      // Today
    ];

    let activeFastingWindow: { start: Date; end: Date } | null = null;

    for (const baseDate of testDates) {
      const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0);
      const end = new Date(start.getTime() + durationMs);
      
      if (currentDate.getTime() >= start.getTime() && currentDate.getTime() < end.getTime()) {
        activeFastingWindow = { start, end };
        break;
      }
    }

    if (activeFastingWindow) {
      // CURRENTLY FASTING
      const start = activeFastingWindow.start;
      const end = activeFastingWindow.end;
      const elapsed = currentDate.getTime() - start.getTime();
      const progress = elapsed / durationMs;
      const timeLeftMs = end.getTime() - currentDate.getTime();

      return {
        isFasting: true,
        windowStart: start,
        windowEnd: end,
        timeLeftMs,
        progress,
      };
    } else {
      // CURRENTLY EATING
      // Find the next fast start
      const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes, 0, 0);
      let nextStart = todayStart;
      if (currentDate.getTime() >= todayStart.getTime()) {
        // Next fast starts tomorrow
        nextStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      }
      
      // Last fast ended: nextStart minus 24 hours + duration
      const lastStart = new Date(nextStart.getTime() - 24 * 60 * 60 * 1000);
      const lastEnd = new Date(lastStart.getTime() + durationMs);
      
      const eatingDurationMs = nextStart.getTime() - lastEnd.getTime();
      const elapsed = currentDate.getTime() - lastEnd.getTime();
      const progress = elapsed / eatingDurationMs;
      const timeLeftMs = nextStart.getTime() - currentDate.getTime();

      return {
        isFasting: false,
        windowStart: lastEnd,
        windowEnd: nextStart,
        timeLeftMs,
        progress,
      };
    }
  };

  // Helper: Format milliseconds to HH:MM:SS
  const formatTime = (ms: number): string => {
    if (ms < 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // Get elapsed hours for flexible active session
  const getFlexibleFastingHours = (): number => {
    if (!activeSession) return 0;
    const start = new Date(activeSession.startTime).getTime();
    return (now.getTime() - start) / (1000 * 60 * 60);
  };

  // Get current active fasting hours (either mode)
  const getFastingHours = (): number => {
    if (settings.fastingType === 'flexible') {
      return getFlexibleFastingHours();
    } else {
      if (strictState && strictState.isFasting) {
        return (now.getTime() - strictState.windowStart.getTime()) / (1000 * 60 * 60);
      }
      return 0;
    }
  };

  // Get Fasting biological stage description
  const getFastingStage = (hours: number) => {
    if (hours <= 0) return null;
    if (hours < 4) {
      return {
        title: 'Absorción de Nutrientes',
        color: '#60a5fa',
        desc: 'Tu cuerpo está digiriendo los últimos alimentos. El azúcar en sangre sube y se libera insulina para almacenar energía.',
      };
    }
    if (hours < 12) {
      return {
        title: 'Fase de Transición',
        color: '#a78bfa',
        desc: 'Los niveles de azúcar en sangre e insulina comienzan a bajar. Tu cuerpo empieza a buscar fuentes alternativas de energía.',
      };
    }
    if (hours < 18) {
      return {
        title: 'Quema de Grasa / Cetosis Temprana',
        color: '#f472b6',
        desc: 'El glucógeno en el hígado se está agotando. Tu cuerpo incrementa la quema de grasas y produce cetonas para obtener energía.',
      };
    }
    if (hours < 24) {
      return {
        title: 'Cetosis Activa',
        color: '#f59e0b',
        desc: 'La quema de grasas se acelera significativamente. Empieza la autofagia: tus células comienzan a limpiarse y repararse.',
      };
    }
    return {
      title: 'Autofagia y Renovación',
      color: '#10b981',
      desc: 'Tus células eliminan componentes dañados a un ritmo elevado. Se estimula la hormona de crecimiento y la regeneración celular.',
    };
  };

  // Actions: Start Flexible Fast
  const handleStartFlexible = () => {
    const session: FastSession = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      startTime: new Date().toISOString(),
      endTime: null,
      targetDuration: settings.flexibleDuration,
      type: 'flexible',
      completed: false,
    };
    storage.saveActiveSession(session);
    setActiveSession(session);
  };

  // Actions: Stop Flexible Fast
  const handleStopFlexible = (completeManual: boolean) => {
    if (!activeSession) return;
    
    const end = new Date();
    const start = new Date(activeSession.startTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const targetHours = activeSession.targetDuration;
    
    const session: FastSession = {
      ...activeSession,
      endTime: end.toISOString(),
      completed: completeManual || durationHours >= targetHours,
    };
    
    storage.addHistorySession(session);
    storage.saveActiveSession(null);
    setActiveSession(null);
    onFastLogged();
  };

  // Actions: Log strict fast manually
  const handleLogStrictFast = (start: Date, end: Date) => {
    const session: FastSession = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      targetDuration: settings.strictDuration,
      type: 'strict',
      completed: true, // Auto-completed since it ran its full schedule
    };
    storage.addHistorySession(session);
    // Remove from local list
    setUnloggedFasts(prev => prev.filter(f => f.start.getTime() !== start.getTime()));
    onFastLogged();
  };

  // Render values
  let progress = 0;
  let timeLeftText = '00:00:00';
  let statusLabel = 'Ayuno';
  let percentageText = '0%';
  let isFasting = false;

  if (settings.fastingType === 'flexible') {
    if (activeSession) {
      isFasting = true;
      const elapsedMs = now.getTime() - new Date(activeSession.startTime).getTime();
      const targetMs = activeSession.targetDuration * 60 * 60 * 1000;
      
      progress = elapsedMs / targetMs;
      const remainingMs = targetMs - elapsedMs;
      
      statusLabel = 'Ayuno Activo';
      percentageText = `${Math.min(100, Math.floor(progress * 100))}%`;

      if (remainingMs > 0) {
        timeLeftText = formatTime(remainingMs);
      } else {
        // Exceeded fasting goal
        timeLeftText = `+${formatTime(Math.abs(remainingMs))}`;
        percentageText = 'Objetivo Logrado';
      }
    } else {
      isFasting = false;
      progress = 0;
      timeLeftText = formatTime(settings.flexibleDuration * 60 * 60 * 1000);
      statusLabel = 'Comer / Libre';
      percentageText = 'Inactivo';
    }
  } else {
    // Strict Mode
    if (strictState) {
      isFasting = strictState.isFasting;
      progress = strictState.progress;
      timeLeftText = formatTime(strictState.timeLeftMs);
      statusLabel = isFasting ? 'Ayuno Activo (Prog.)' : 'Ventana de Comida';
      percentageText = `${Math.min(100, Math.floor(progress * 100))}%`;
    }
  }

  const fastingHours = getFastingHours();
  const currentStage = getFastingStage(fastingHours);

  return (
    <div className="view-container">
      {/* Timer Circle Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress
          progress={progress}
          timeLeft={timeLeftText}
          statusLabel={statusLabel}
          percentageText={percentageText}
          isFasting={isFasting}
        />

        {/* Start / Stop Buttons */}
        <div className="timer-actions">
          {settings.fastingType === 'flexible' ? (
            activeSession ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleStopFlexible(false)}
                >
                  Terminar Temprano
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleStopFlexible(true)}
                >
                  Completar Ayuno
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={handleStartFlexible}>
                Iniciar Ayuno Flexible
              </button>
            )
          ) : (
            // Strict mode doesn't start/stop, it runs on schedule
            <div className="detail-card" style={{ textAlign: 'center', width: '100%' }}>
              <span className="detail-label">Horario Programado Diario</span>
              <span className="detail-value" style={{ fontSize: '18px', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {settings.strictStartTime} ({settings.strictDuration}h ayuno / {24 - settings.strictDuration}h comida)
              </span>
            </div>
          )}
        </div>

        {/* Time Grid Info */}
        <div className="fast-details-grid">
          <div className="detail-card">
            <span className="detail-label">Inicio</span>
            <span className="detail-value">
              {settings.fastingType === 'flexible' && activeSession
                ? new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : settings.fastingType === 'strict' && strictState
                ? strictState.windowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </span>
          </div>
          <div className="detail-card">
            <span className="detail-label">Finalización</span>
            <span className="detail-value">
              {settings.fastingType === 'flexible' && activeSession
                ? new Date(new Date(activeSession.startTime).getTime() + activeSession.targetDuration * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : settings.fastingType === 'strict' && strictState
                ? strictState.windowEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </span>
          </div>
        </div>
      </div>

      {/* Unlogged Strict Fasts Banners */}
      {unloggedFasts.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <h3 className="card-title" style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⚠️ Ayunos sin registrar
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Tienes periodos de ayuno programado que terminaron pero no se han registrado en tu historial.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unloggedFasts.map((fast, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ fontSize: '12px' }}>
                  <div style={{ fontWeight: '700' }}>
                    {fast.start.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {fast.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} a {fast.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => handleLogStrictFast(fast.start, fast.end)}
                >
                  Registrar ({settings.strictDuration}h)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biological Stage Card */}
      {isFasting && currentStage && (
        <div className="card stages-card" style={{ borderLeft: `4px solid ${currentStage.color}`, animation: 'fadeIn 0.5s ease-out' }}>
          <div className="stage-header">
            <span className="stage-dot" style={{ backgroundColor: currentStage.color }}></span>
            <span className="stage-title" style={{ color: currentStage.color }}>
              Estado Corporal: {currentStage.title}
            </span>
          </div>
          <p className="stage-desc">{currentStage.desc}</p>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tiempo ayunando:</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: currentStage.color }}>
              {fastingHours.toFixed(1)} hrs
            </span>
          </div>
        </div>
      )}

      {/* Normal Eating / Idle Tip Card */}
      {!isFasting && (
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stage-header">
            <span className="stage-dot" style={{ backgroundColor: 'var(--success)' }}></span>
            <span className="stage-title" style={{ color: 'var(--success)' }}>
              Ventana de Alimentación Activa
            </span>
          </div>
          <p className="stage-desc">
            Es momento de nutrir tu cuerpo de forma saludable. Concéntrate en proteínas magras, grasas saludables y carbohidratos complejos. ¡Mantente hidratado!
          </p>
        </div>
      )}
    </div>
  );
};
