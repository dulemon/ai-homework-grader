import { useEffect, useState } from 'react';

export default function ScoreRing({ score, size = 120, strokeWidth = 8, label = '分数' }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getColor = (s) => {
    if (s >= 90) return '#0d9488';
    if (s >= 80) return '#2563eb';
    if (s >= 70) return '#d97706';
    if (s >= 60) return '#9333ea';
    return '#e11d48';
  };

  const getGradientId = (s) => {
    if (s >= 90) return 'grad-excellent';
    if (s >= 80) return 'grad-good';
    if (s >= 70) return 'grad-medium';
    if (s >= 60) return 'grad-pass';
    return 'grad-fail';
  };

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="score-ring-container">
      <div className="score-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id="grad-excellent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="grad-good" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="grad-medium" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="grad-pass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="grad-fail" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          <circle
            className="score-ring-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
          />
          <circle
            className="score-ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${getGradientId(score)})`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="score-ring-text">
          <div className="score-ring-value" style={{ color: getColor(animatedScore) }}>
            {animatedScore}
          </div>
          <div className="score-ring-label">{label}</div>
        </div>
      </div>
    </div>
  );
}
