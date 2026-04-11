import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-(--color-border) flex items-center gap-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
      <div className="bg-(--color-navy)/8 p-4 rounded-2xl text-(--color-sage)">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-(--color-navy)/50 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-(--color-navy)">{value}</h3>
        {subtitle && <p className="text-sm text-(--color-sage) mt-0.5 font-semibold">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
