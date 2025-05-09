import React from 'react';

interface ProgressBarProps {
  value: number;
  color?: string;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, color = '#4CAF50', label, className }: ProgressBarProps) {
  // Asegurar que el valor esté entre 0 y 100
  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className={`w-full ${className || ''}`}>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${clampedValue}%`, 
            backgroundColor: color 
          }}
        />
      </div>
      {label && (
        <div className="mt-1 text-xs text-center font-medium" style={{ color }}>
          {label}
        </div>
      )}
    </div>
  );
}