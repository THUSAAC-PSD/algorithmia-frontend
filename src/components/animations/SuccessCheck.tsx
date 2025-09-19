import React, { useEffect, useRef } from 'react';

/**
 * Simple animated success checkmark using SVG stroke-dash animations.
 */
const SuccessCheck: React.FC<{
  size?: number;
  onDone?: () => void;
  delayMs?: number;
}> = ({ size = 96, onDone, delayMs = 1200 }) => {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (onDone) {
      timeoutRef.current = window.setTimeout(() => onDone(), delayMs);
    }
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [onDone, delayMs]);

  const stroke = '#34d399'; // emerald-400
  const bg = 'rgba(16, 185, 129, 0.08)'; // emerald tint

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: bg,
        borderRadius: '9999px',
      }}
    >
      <svg
        width={Math.floor(size * 0.7)}
        height={Math.floor(size * 0.7)}
        viewBox="0 0 52 52"
        fill="none"
      >
        <circle
          cx="26"
          cy="26"
          r="24"
          stroke={stroke}
          strokeWidth="3"
          className="success-ring"
          style={{ strokeDasharray: 150, strokeDashoffset: 150 }}
        />
        <path
          d="M14 27 L22 34 L38 18"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="success-check"
          style={{ strokeDasharray: 60, strokeDashoffset: 60 }}
        />
        <style>{`
          .success-ring { animation: drawRing 700ms ease-out forwards; }
          .success-check { animation: drawCheck 500ms 400ms ease-out forwards; }
          @keyframes drawRing {
            to { stroke-dashoffset: 0; }
          }
          @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </svg>
    </div>
  );
};

export default SuccessCheck;
