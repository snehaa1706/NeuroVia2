import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ErrorState = ({ message = "An error occurred.", onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-red-50 rounded-lg">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <p className="text-red-700 font-medium">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
