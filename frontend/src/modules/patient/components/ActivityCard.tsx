import React from 'react';
import { PlayCircle, CheckCircle2 } from 'lucide-react';

interface ActivityCardProps {
  title: string;
  description: string;
  isCompleted?: boolean;
  onPlay?: (title: string) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ title, description, isCompleted, onPlay }) => {
  return (
    <div className={`flex flex-col h-full p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      isCompleted 
        ? 'bg-(--color-surface-alt) border-(--color-sage)/40 shadow-md' 
        : 'bg-(--color-bg) hover:bg-[#e2dcd0] border-(--color-border) shadow-lg hover:border-(--color-sage)/50'
    }`}>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-(--color-navy) mb-2">{title}</h3>
        <p className="text-base text-(--color-navy)/50 leading-relaxed">{description}</p>
      </div>
      <button 
        onClick={() => onPlay && onPlay(title)}
        className={`mt-5 w-full py-3.5 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
          isCompleted 
            ? 'bg-(--color-sage)/15 text-(--color-sage) cursor-default border border-(--color-sage)/30' 
            : 'bg-(--color-sage) text-white hover:bg-(--color-sage-dark) shadow-md hover:shadow-lg active:scale-[0.98]'
        }`}
        disabled={isCompleted}
      >
        {isCompleted ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Completed
          </>
        ) : (
          <>
            <PlayCircle className="w-5 h-5" />
            Play Now
          </>
        )}
      </button>
    </div>
  );
};

export default ActivityCard;
