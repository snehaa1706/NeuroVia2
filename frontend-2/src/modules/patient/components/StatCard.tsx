import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-(--color-ivory-200) flex items-center gap-6 hover:shadow-md transition-shadow">
      <div className="bg-(--color-ivory-100) p-4 rounded-2xl text-(--color-sage)">
        {icon}
      </div>
      <div>
        <p className="text-xl font-medium text-(--color-navy)/60 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-(--color-navy)">{value}</h3>
        {subtitle && <p className="text-md text-(--color-sage) mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
