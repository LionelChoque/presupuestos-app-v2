import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  color?: string;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, color = '#4CAF50', label, className }: ProgressBarProps) {
  // Asegurar que el valor esté entre 0 y 100
  const safeValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300 ease-in-out"
          style={{ 
            width: `${safeValue}%`,
            backgroundColor: color
          }}
        />
        {label && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}