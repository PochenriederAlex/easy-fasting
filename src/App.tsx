import { useState, useEffect } from 'react';
import { AppSettings, FastSession } from './types/types';
import { storage } from './services/storage';
import { Dashboard } from './views/Dashboard';
import { History } from './views/History';
import { Settings } from './views/Settings';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(storage.loadSettings());
  const [activeSession, setActiveSession] = useState<FastSession | null>(storage.loadActiveSession());
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [now, setNow] = useState<Date>(new Date());

  // Set up a single global timer for the entire app
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Recalculate fasting status for the header badge
  const getFastingStatus = (): 'fasting' | 'eating' | 'idle' => {
    if (settings.fastingType === 'flexible') {
      return activeSession ? 'fasting' : 'idle';
    } else {
      // Strict Mode Calculation
      const [hours, minutes] = settings.strictStartTime.split(':').map(Number);
      const durationMs = settings.strictDuration * 60 * 60 * 1000;
      
      const testDates = [
        new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        new Date(now.getTime()),                       // Today
      ];

      for (const baseDate of testDates) {
        const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0);
        const end = new Date(start.getTime() + durationMs);
        
        if (now.getTime() >= start.getTime() && now.getTime() < end.getTime()) {
          return 'fasting';
        }
      }
      return 'eating';
    }
  };

  const status = getFastingStatus();

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">F</div>
          <span className="logo-text">Easy Fasting</span>
        </div>
        
        <div className={`status-badge ${status}`}>
          <span className="status-dot"></span>
          <span>
            {status === 'fasting' ? 'Ayuno' : status === 'eating' ? 'Comida' : 'Libre'}
          </span>
        </div>
      </header>

      {/* Main Content Areas */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            settings={settings}
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            onFastLogged={() => setRefreshTrigger(prev => prev + 1)}
          />
        )}
        {activeTab === 'history' && (
          <History refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            onSettingsChange={(newSettings) => setSettings(newSettings)}
          />
        )}
      </main>

      {/* Bottom Sticky Tab Navigation */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </span>
          Dashboard
        </button>

        <button
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </span>
          Historial
        </button>

        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="nav-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="2" y1="14" x2="6" y2="14"></line>
              <line x1="10" y1="8" x2="14" y2="8"></line>
              <line x1="18" y1="16" x2="22" y2="16"></line>
            </svg>
          </span>
          Ajustes
        </button>
      </nav>
    </div>
  );
}

export default App;
