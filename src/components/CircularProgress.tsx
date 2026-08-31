import React from 'react';

interface CircularProgressProps {
  progress: number; // 0 to 1
  timeLeft: string; // e.g. "15:42:10"
  statusLabel: string; // e.g. "Ayuno Activo"
  percentageText: string; // e.g. "82%"
  isFasting: boolean;
  hasExceededIdeal?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  timeLeft,
  statusLabel,
  percentageText,
  isFasting,
  hasExceededIdeal = false,
}) => {
  const size = 240;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const strokeDashoffset = circumference - clampedProgress * circumference;

  // Determine gradient based on state
  const gradientId = isFasting
    ? 'fastingGradient'
    : hasExceededIdeal
    ? 'exceededGradient'
    : 'eatingGradient';

  return (
    <div className={`circular-progress-wrapper ${hasExceededIdeal ? 'exceeded-glow' : ''}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          {/* Fasting Gradient (Purple to Pink) */}
          <linearGradient id="fastingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          {/* Eating Gradient (Green to Mint) */}
          <linearGradient id="eatingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Exceeded Gradient (Orange to Red) */}
          <linearGradient id="exceededGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>

          {/* Shadow filters for glow effect */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth={strokeWidth}
        />

        {/* Foreground Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter="url(#glow)"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />
      </svg>

      {/* Central Content */}
      <div className="timer-text-content">
        <span className={`timer-subtitle ${hasExceededIdeal ? 'subtitle-exceeded' : ''}`}>
          {statusLabel}
        </span>
        <span className={`timer-countdown ${hasExceededIdeal ? 'countdown-exceeded' : ''}`}>
          {timeLeft}
        </span>
        <span className={`timer-percentage ${hasExceededIdeal ? 'percentage-exceeded' : ''}`}>
          {percentageText}
        </span>
      </div>
    </div>
  );
};
