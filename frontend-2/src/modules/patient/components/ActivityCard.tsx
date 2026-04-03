import React from 'react';
import { PlayCircle } from 'lucide-react';

interface ActivityCardProps {
  title: string;
  description: string;
  isCompleted?: boolean;
  onPlay?: (title: string) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ title, description, isCompleted, onPlay }) => {
  return (
    <div className={`p-6 rounded-3xl border transition-all hover:shadow-md ${isCompleted ? 'bg-(--color-ivory-100) border-(--color-ivory-200) opacity-70' : 'bg-white border-(--color-ivory-200)'}`}>
      <h3 className="text-2xl font-bold text-(--color-navy) mb-2">{title}</h3>
      <p className="text-lg text-(--color-navy)/70 mb-6">{description}</p>
      <button 
        onClick={() => onPlay && onPlay(title)}
        className={`w-full py-4 rounded-2xl text-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
          isCompleted 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-(--color-sage) text-white hover:bg-[#6b8c84] shadow-sm'
        }`}
        disabled={isCompleted}
      >
        <PlayCircle className="w-6 h-6" />
        {isCompleted ? 'Completed' : 'Play Now'}
      </button>
    </div>
  );
};

export default ActivityCard;
