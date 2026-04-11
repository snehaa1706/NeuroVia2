import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ message = "No data available.", action = null }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
      <Inbox className="w-12 h-12 text-gray-400 mb-4" />
      <p className="text-gray-500 font-medium">{message}</p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};
