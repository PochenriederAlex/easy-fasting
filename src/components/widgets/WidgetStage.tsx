import React from 'react';

interface WidgetStageProps {
  isFasting: boolean;
  fastingHours: number;
  progress: number;
  timeLeftText: string;
  onStart: () => void;
  onStop: () => void;
  fastingType: 'flexible' | 'strict';
  hasExceededIdeal?: boolean;
}

export const WidgetStage: React.FC<WidgetStageProps> = ({
  isFasting,
  fastingHours,
  progress,
  timeLeftText,
  onStart,
  onStop,
  fastingType,
  hasExceededIdeal = false,
}) => {
  const getStageInfo = (hours: number) => {
    if (!isFasting) {
      if (hasExceededIdeal) {
        return {
          title: 'Comida Excedida',
          color: '#f59e0b',
          icon: '⚠️',
          desc: 'Tiempo ideal estimado superado',
        };
      }
      return {
        title: 'Ventana de Alimentación',
        color: '#10b981',
        icon: '🥗',
        desc: 'Nutrición e hidratación activa',
      };
    }

    if (hours < 4) {
      return {
        title: 'Absorción de Nutrientes',
        color: '#60a5fa',
        icon: '🍞',
        desc: 'Digestión y almacenamiento de glucógeno',
      };
    }
    if (hours < 12) {
      return {
        title: 'Fase de Transición',
        color: '#a78bfa',
        icon: '⚡',
        desc: 'Bajan niveles de glucosa e insulina',
      };
    }
    if (hours < 18) {
      return {
        title: 'Cetosis Temprana',
        color: '#f472b6',
        icon: '🔥',
        desc: 'Quema activa de grasas corporales',
      };
    }
    if (hours < 24) {
      return {
        title: 'Cetosis Activa',
        color: '#f59e0b',
        icon: '✨',
        desc: 'Producción de cetonas y limpieza cellular',
      };
    }
    return {
      title: 'Autofagia y Renovación',
      color: '#10b981',
      icon: '🌿',
      desc: 'Reciclaje y regeneración celular profunda',
    };
  };

  const stage = getStageInfo(fastingHours);
  const clampedProgress = Math.max(0, Math.min(100, Math.floor(progress * 100)));

  return (
    <div className="widget-card widget-stage" style={{ borderLeftColor: stage.color }}>
      <div className="widget-stage-top">
        <div className="widget-stage-icon-block" style={{ backgroundColor: `${stage.color}18`, color: stage.color }}>
          <span>{stage.icon}</span>
        </div>

        <div className="widget-stage-text-block">
          <span className="widget-stage-subtitle">Etapa Actual</span>
          <span className="widget-stage-title" style={{ color: stage.color }}>{stage.title}</span>
          <span className="widget-stage-desc">{stage.desc}</span>
        </div>

        <div className="widget-stage-timer">
          <span className="widget-timer-value">{timeLeftText}</span>
          <span className="widget-timer-label">{isFasting ? 'Restante' : 'Ventana'}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="widget-progress-track">
        <div 
          className="widget-progress-fill" 
          style={{ 
            width: `${clampedProgress}%`,
            background: `linear-gradient(90deg, ${stage.color} 0%, #ec4899 100%)`
          }}
        ></div>
      </div>

      {/* Footer Controls */}
      <div className="widget-stage-footer">
        <span className="widget-hours-badge">
          {isFasting ? `${fastingHours.toFixed(1)} hrs ayunando` : `${clampedProgress}% de ventana`}
        </span>

        {fastingType === 'flexible' && (
          isFasting ? (
            <button className="widget-btn-mini btn-danger" onClick={onStop}>
              Detener
            </button>
          ) : (
            <button className="widget-btn-mini btn-primary" onClick={onStart}>
              Iniciar Ayuno
            </button>
          )
        )}
      </div>
    </div>
  );
};
