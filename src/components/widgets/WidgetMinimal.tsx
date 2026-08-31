import React from 'react';

interface WidgetMinimalProps {
  isFasting: boolean;
  statusText: string;
  timeText: string;
  onStart: () => void;
  onStop: () => void;
  fastingType: 'flexible' | 'strict';
}

export const WidgetMinimal: React.FC<WidgetMinimalProps> = ({
  isFasting,
  statusText,
  timeText,
  onStart,
  onStop,
  fastingType,
}) => {
  return (
    <div className="widget-card widget-minimal">
      <div className="widget-header">
        <div className="widget-badge">
          <span className={`widget-dot ${isFasting ? 'dot-fasting' : 'dot-eating'}`}></span>
          <span className="widget-status-text">{statusText}</span>
        </div>
        <span className="widget-timer-minimal">{timeText}</span>
      </div>

      <div className="widget-body">
        {fastingType === 'flexible' ? (
          isFasting ? (
            <button className="widget-btn widget-btn-stop" onClick={onStop}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" rx="2"></rect>
              </svg>
              Detener Ayuno
            </button>
          ) : (
            <button className="widget-btn widget-btn-start" onClick={onStart}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Iniciar Ayuno
            </button>
          )
        ) : (
          <div className="widget-strict-info">
            <span>Modo Programado Activo</span>
          </div>
        )}
      </div>
    </div>
  );
};
