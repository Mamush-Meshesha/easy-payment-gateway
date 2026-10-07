import React from 'react';

interface WaveBackgroundProps {
  className?: string;
  color?: string; // e.g., 'text-emerald-500' or 'text-blue-500'
  opacity?: number;
}

export function WaveBackground({ className = '', color = 'text-emerald-500', opacity = 0.4 }: WaveBackgroundProps) {
  const lines = Array.from({ length: 25 });

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 1440 600" 
        preserveAspectRatio="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="fadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="15%" stopColor="white" />
            <stop offset="85%" stopColor="white" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <mask id="fadeMask">
            <rect width="100%" height="100%" fill="url(#fadeGrad)" />
          </mask>
        </defs>
        
        <g stroke="currentColor" fill="none" style={{ opacity }} mask="url(#fadeMask)" className={color}>
          {lines.map((_, i) => {
            // Create a ribbon effect by varying control points
            const startY = 300 + i * 2;
            const endY = 300 + i * 2;
            
            // First curve
            const cp1x = 320;
            const cp1y = 100 + i * 18;
            
            const cp2x = 420;
            const cp2y = 500 - i * 12;
            
            // Mid point
            const midX = 720;
            const midY = 300 + i * 2;
            
            // Second curve
            const cp3x = 1020;
            const cp3y = 100 + i * 12;
            
            const cp4x = 1120;
            const cp4y = 500 - i * 18;
            
            return (
              <path 
                key={i} 
                d={`M 0,${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${midX},${midY} C ${cp3x},${cp3y} ${cp4x},${cp4y} 1440,${endY}`} 
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
