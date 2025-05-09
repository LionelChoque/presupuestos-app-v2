import React from 'react';

interface ProgressBarProps {
  value: number;
  color?: string;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, color = '#4CAF50', label, className }: ProgressBarProps) {
  // Asegurarse de que el valor esté entre 0 y 100
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-1">
        {label && <span className="text-xs font-medium text-gray-700">{label}</span>}
        <span className="text-xs font-medium text-gray-700">{normalizedValue.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ 
            width: `${normalizedValue}%`, 
            backgroundColor: color 
          }}
        ></div>
      </div>
    </div>
  );
}