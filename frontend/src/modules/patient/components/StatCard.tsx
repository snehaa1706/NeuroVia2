import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon }) => {
  return (
    <div className="bg-[#f5f0e8] hover:bg-[#e2dcd0] rounded-[20px] p-4 border border-[#d2c8b9]/60 flex items-center gap-4 hover:shadow-[0_4px_12px_rgba(107,124,82,0.1)] transition-all duration-300 hover:-translate-y-[1px]">
      <div className="bg-[--color-navy]/5 p-3 rounded-[14px] text-[--color-sage]">
        {icon}
      </div>
      <div>
        <p className="text-[0.7rem] font-bold text-[--color-navy]/50 uppercase tracking-[0.05em] mb-1">{title}</p>
        <h3 className="text-[1.2rem] font-bold text-[--color-navy] leading-tight">{value}</h3>
        {subtitle && <p className="text-[0.75rem] text-[--color-sage] mt-0.5 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
