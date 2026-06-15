import React, { useState, useEffect } from 'react';
import { FastSession, FastingStats } from '../types/types';
import { storage } from '../services/storage';

interface HistoryProps {
  refreshTrigger: number; // Used to trigger reload when a new fast is logged
}

export const History: React.FC<HistoryProps> = ({ refreshTrigger }) => {
  const [history, setHistory] = useState<FastSession[]>([]);
  const [stats, setStats] = useState<FastingStats | null>(null);

  useEffect(() => {
    const loadedHistory = storage.loadHistory();
    setHistory(loadedHistory);
    setStats(storage.calculateStats(loadedHistory));
  }, [refreshTrigger]);

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de ayuno?')) {
      storage.deleteHistorySession(id);
      const updatedHistory = storage.loadHistory();
      setHistory(updatedHistory);
      setStats(storage.calculateStats(updatedHistory));
    }
  };

  // Helper: format ISO date to readable string
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper: calculate session duration in hours and minutes
  const formatDuration = (startTime: string, endTime: string | null): string => {
    if (!endTime) return '--';
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMs = end - start;
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="view-container">
      {/* Statistics Section */}
      {stats && (
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-number">{stats.currentStreak} 🔥</span>
            <span className="stat-label">Racha Días</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{stats.totalHoursFasted.toFixed(1)}h</span>
            <span className="stat-label">Total Horas</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{stats.longestFastHours.toFixed(1)}h</span>
            <span className="stat-label">Máximo Ayuno</span>
          </div>
        </div>
      )}

      {/* History List */}
      <h2 className="card-title" style={{ paddingLeft: '4px', marginBottom: '16px' }}>
        Historial de Ayunos ({history.length})
      </h2>

      {history.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">🧘‍♂️</div>
          <p style={{ fontWeight: 600 }}>No hay ayunos registrados aún</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Completa tu primer ayuno flexible o confirma un ayuno estricto programado para ver el registro aquí.
          </p>
        </div>
      ) : (
        <div className="log-list">
          {history.map((session) => (
            <div key={session.id} className="log-item">
              <div className="log-info">
                <div className="log-date">{formatDate(session.startTime)}</div>
                <div className="log-meta">
                  <span className={`badge badge-${session.type}`}>
                    {session.type === 'flexible' ? 'Flexible' : 'Programado'}
                  </span>
                  <span>Objetivo: {session.targetDuration}h</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="log-duration">
                  <span>{formatDuration(session.startTime, session.endTime)}</span>
                  <span className={`log-status ${session.completed ? 'completed' : 'failed'}`}>
                    {session.completed ? 'Completado' : 'Interrumpido'}
                  </span>
                </div>
                
                <button
                  className="btn-delete-log"
                  onClick={() => handleDelete(session.id)}
                  title="Eliminar registro"
                >
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
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
