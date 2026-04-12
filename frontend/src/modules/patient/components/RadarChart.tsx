import React from 'react';
import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface DomainData {
  domain: string;
  score: number;
}

interface RadarChartProps {
  data: DomainData[];
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[260px] bg-transparent rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[#d2c8b9]/60">
      <h3 className="text-lg font-bold text-[--color-navy] mb-2">Cognitive Domains</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="rgba(210, 200, 185, 0.6)" />
          <PolarAngleAxis dataKey="domain" tick={{ fill: '#1a2744', fontSize: 11, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Score" dataKey="score" stroke="#6b7c52" fill="#6b7c52" fillOpacity={0.25} strokeWidth={2} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
