import React, { useState } from 'react';
import { AppSettings } from '../types/types';
import { storage } from '../services/storage';
import { notificationService } from '../services/notificationService';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const PRESET_DURATIONS = [
  { value: 12, label: '12:12 (Ayuno Básico)' },
  { value: 14, label: '14:10 (Ayuno Moderado)' },
  { value: 16, label: '16:8 (Leangains - Recomendado)' },
  { value: 18, label: '18:6 (Guerrero Avanzado)' },
  { value: 20, label: '20:4 (Dieta del Guerrero)' },
  { value: 24, label: '24:0 (OMAD - Una comida al día)' },
];

export const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  const [showCustomFlex, setShowCustomFlex] = useState(!PRESET_DURATIONS.some(p => p.value === settings.flexibleDuration));
  const [showCustomStrict, setShowCustomStrict] = useState(!PRESET_DURATIONS.some(p => p.value === settings.strictDuration));

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = {
      ...settings,
      [key]: value,
    };
    storage.saveSettings(updated);
    onSettingsChange(updated);
  };

  const handleClearData = () => {
    if (window.confirm('🚨 ¡ATENCIÓN! Esto borrará permanentemente todo tu historial, sesiones activas y configuraciones. ¿Deseas continuar?')) {
      storage.clearAllData();
      alert('Todos los datos han sido borrados de este dispositivo.');
      window.location.reload();
    }
  };

  return (
    <div className="view-container">
      <h2 className="card-title" style={{ paddingLeft: '4px', marginBottom: '16px' }}>
        Configuración
      </h2>

      {/* General Settings */}
      <h3 className="setting-section-title">Método de Ayuno</h3>
      <div className="setting-group">
        <div className="setting-row">
          <div className="setting-label-block">
            <span className="setting-label">Tipo de Cronograma</span>
            <span className="setting-desc">Elige entre iniciar manualmente o definir una rutina diaria fija.</span>
          </div>
          <div className="mode-selector">
            <button
              className={`mode-btn ${settings.fastingType === 'flexible' ? 'active' : ''}`}
              onClick={() => updateSetting('fastingType', 'flexible')}
            >
              Flexible
            </button>
            <button
              className={`mode-btn ${settings.fastingType === 'strict' ? 'active' : ''}`}
              onClick={() => updateSetting('fastingType', 'strict')}
            >
              Estricto
            </button>
          </div>
        </div>
      </div>

      {/* Flexible Mode Settings */}
      {settings.fastingType === 'flexible' && (
        <>
          <h3 className="setting-section-title">Ajustes del Ayuno Flexible</h3>
          <div className="setting-group">
            <div className="setting-row">
              <div className="setting-label-block">
                <span className="setting-label">Duración Objetivo</span>
                <span className="setting-desc">Horas que quieres mantenerte en ayunas por sesión.</span>
              </div>
              
              {!showCustomFlex ? (
                <select
                  className="input-select"
                  value={settings.flexibleDuration}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setShowCustomFlex(true);
                    } else {
                      updateSetting('flexibleDuration', Number(val));
                    }
                  }}
                >
                  {PRESET_DURATIONS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="custom">Personalizado...</option>
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    className="input-text"
                    value={settings.flexibleDuration}
                    onChange={(e) => updateSetting('flexibleDuration', Math.max(1, Math.min(48, Number(e.target.value))))}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>hs</span>
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: 'auto', padding: '6px 10px', fontSize: '11px', borderRadius: '6px' }}
                    onClick={() => setShowCustomFlex(false)}
                  >
                    Presets
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Strict Mode Settings */}
      {settings.fastingType === 'strict' && (
        <>
          <h3 className="setting-section-title">Ajustes del Ayuno Programado</h3>
          <div className="setting-group">
            {/* Start Time */}
            <div className="setting-row">
              <div className="setting-label-block">
                <span className="setting-label">Hora de Inicio Diaria</span>
                <span className="setting-desc">¿A qué hora empieza tu ayuno todos los días?</span>
              </div>
              <input
                type="time"
                className="input-select"
                value={settings.strictStartTime}
                onChange={(e) => updateSetting('strictStartTime', e.target.value)}
                style={{ width: '110px', textAlign: 'center' }}
              />
            </div>

            {/* Duration */}
            <div className="setting-row">
              <div className="setting-label-block">
                <span className="setting-label">Duración del Ayuno</span>
                <span className="setting-desc">Horas que durará la ventana de ayuno programada.</span>
              </div>
              
              {!showCustomStrict ? (
                <select
                  className="input-select"
                  value={settings.strictDuration}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setShowCustomStrict(true);
                    } else {
                      updateSetting('strictDuration', Number(val));
                    }
                  }}
                >
                  {PRESET_DURATIONS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="custom">Personalizado...</option>
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="1"
                    max="23"
                    className="input-text"
                    value={settings.strictDuration}
                    onChange={(e) => updateSetting('strictDuration', Math.max(1, Math.min(23, Number(e.target.value))))}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>hs</span>
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: 'auto', padding: '6px 10px', fontSize: '11px', borderRadius: '6px' }}
                    onClick={() => setShowCustomStrict(false)}
                  >
                    Presets
                  </button>
                </div>
              )}
            </div>

            {/* Info Calculated Row */}
            <div className="setting-row" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <div className="setting-label-block">
                <span className="setting-label" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ventana de Alimentación</span>
                <span className="setting-desc">Calculada en base a tu ayuno diario.</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--success)' }}>
                {24 - settings.strictDuration} horas libres al día
              </span>
            </div>
          </div>
        </>
      )}

      {/* Notifications Settings */}
      <h3 className="setting-section-title">Notificaciones</h3>
      <div className="setting-group">
        {/* Enable Notifications Master Toggle */}
        <div className="setting-row">
          <div className="setting-label-block">
            <span className="setting-label">Activar Notificaciones</span>
            <span className="setting-desc">Recibe alertas del sistema en tu dispositivo (desactivadas por defecto).</span>
          </div>
          <label className="switch-toggle">
            <input
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={async (e) => {
                const checked = e.target.checked;
                if (checked) {
                  const granted = await notificationService.requestPermission();
                  if (granted) {
                    updateSetting('enableNotifications', true);
                    updateSetting('notifyFastStart', true);
                    updateSetting('notifyFastEnd', true);
                    updateSetting('notifyNearEnd', true);
                  } else {
                    alert('No se otorgaron permisos de notificación en el navegador.');
                    updateSetting('enableNotifications', false);
                  }
                } else {
                  updateSetting('enableNotifications', false);
                }
              }}
            />
            <span className="slider round"></span>
          </label>
        </div>

        {settings.enableNotifications && (
          <>
            {/* Notify Fast Start */}
            <div className="setting-row">
              <div className="setting-label-block">
                <span className="setting-label">Inicio de Ayuno</span>
                <span className="setting-desc">Avisar cuando comience un periodo de ayuno.</span>
              </div>
              <input
                type="checkbox"
                className="checkbox-input"
                checked={settings.notifyFastStart}
                onChange={(e) => updateSetting('notifyFastStart', e.target.checked)}
              />
            </div>

            {/* Notify Near End (Pre-Fin) */}
            <div className="setting-row">
              <div className="setting-label-block">
                <span className="setting-label">Aviso Previo al Fin</span>
                <span className="setting-desc">Alerta previa para evitar cortar el ayuno antes de tiempo.</span>
              </div>
              <input
                type="checkbox"
                className="checkbox-input"
                checked={settings.notifyNearEnd}
                onChange={(e) => updateSetting('notifyNearEnd', e.target.checked)}
              />
            </div>

            {/* Near End Minutes */}
            {settings.notifyNearEnd && (
              <div className="setting-row" style={{ paddingLeft: '32px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <div className="setting-label-block">
                  <span className="setting-label">Anticipación</span>
                  <span className="setting-desc">¿Con cuánta anticipación enviar el aviso?</span>
                </div>
                <select
                  className="input-select"
                  value={settings.nearEndMinutes}
                  onChange={(e) => updateSetting('nearEndMinutes', Number(e.target.value))}
                >
                  <option value={10}>10 min antes</option>
                  <option value={15}>15 min antes</option>
                  <option value={30}>30 min antes</option>
                  <option value={45}>45 min antes</option>
                  <option value={60}>60 min antes</option>
                </select>
              </div>
            )}

            {/* Notify Fast End */}
            <div className="setting-row">
              <div className="setting-label-block">
                <span className="setting-label">Fin de Ayuno</span>
                <span className="setting-desc">Avisar cuando cumplas tu objetivo de ayuno.</span>
              </div>
              <input
                type="checkbox"
                className="checkbox-input"
                checked={settings.notifyFastEnd}
                onChange={(e) => updateSetting('notifyFastEnd', e.target.checked)}
              />
            </div>
          </>
        )}
      </div>

      {/* Danger Zone */}
      <h3 className="setting-section-title" style={{ color: '#f87171' }}>Zona de Peligro</h3>
      <div className="setting-group" style={{ borderColor: 'rgba(239, 68, 68, 0.15)' }}>
        <div style={{ padding: '16px' }}>
          <button className="danger-zone-btn" onClick={handleClearData}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
            Borrar Todos los Datos
          </button>
        </div>
      </div>
    </div>
  );
};
