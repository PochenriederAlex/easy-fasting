import React from 'react';
import { AppSettings, FastSession } from '../types/types';
import { WidgetMinimal } from '../components/widgets/WidgetMinimal';
import { WidgetStage } from '../components/widgets/WidgetStage';

interface WidgetsViewProps {
  settings: AppSettings;
  activeSession: FastSession | null;
  isFasting: boolean;
  timeLeftText: string;
  progress: number;
  fastingHours: number;
  hasExceededIdeal: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const WidgetsView: React.FC<WidgetsViewProps> = ({
  settings,
  isFasting,
  timeLeftText,
  progress,
  fastingHours,
  hasExceededIdeal,
  onStart,
  onStop,
}) => {
  return (
    <div className="view-container">
      <h2 className="card-title" style={{ paddingLeft: '4px', marginBottom: '8px' }}>
        Galeria de Widgets
      </h2>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', paddingLeft: '4px' }}>
        Explora y prueba las variantes de widgets diseñadas para un control rápido y visual de tu ayuno.
      </p>

      {/* Variant 1: Minimalist Quick Action */}
      <div className="widget-preview-section">
        <div className="widget-preview-header">
          <span className="widget-badge-tag">Variante 1</span>
          <h3 className="widget-preview-title">Widget Ultracompacto (Acción Rápida)</h3>
        </div>
        <p className="widget-preview-desc">
          Botón directo para iniciar o detener tu ayuno de un solo toque con estado minimalista.
        </p>

        <div className="widget-container-box">
          <WidgetMinimal
            isFasting={isFasting}
            statusText={isFasting ? 'Ayuno Activo' : 'Ventana de Comida'}
            timeText={timeLeftText}
            onStart={onStart}
            onStop={onStop}
            fastingType={settings.fastingType}
          />
        </div>
      </div>

      {/* Variant 2: Stage & Status Info */}
      <div className="widget-preview-section" style={{ marginTop: '24px' }}>
        <div className="widget-preview-header">
          <span className="widget-badge-tag" style={{ background: 'var(--success-gradient)' }}>Variante 2</span>
          <h3 className="widget-preview-title">Widget de Etapa Corporal & Tiempo</h3>
        </div>
        <p className="widget-preview-desc">
          Muestra la etapa biológica actual (Absorción, Cetosis, Autofagia), barra de avance y tiempo en vivo.
        </p>

        <div className="widget-container-box">
          <WidgetStage
            isFasting={isFasting}
            fastingHours={fastingHours}
            progress={progress}
            timeLeftText={timeLeftText}
            onStart={onStart}
            onStop={onStop}
            fastingType={settings.fastingType}
            hasExceededIdeal={hasExceededIdeal}
          />
        </div>
      </div>
    </div>
  );
};
