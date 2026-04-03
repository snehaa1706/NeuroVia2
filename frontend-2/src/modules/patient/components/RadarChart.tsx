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
    <div className="w-full h-[300px] bg-white rounded-3xl p-6 shadow-sm border border-(--color-ivory-200)">
      <h3 className="text-2xl font-bold text-(--color-navy) mb-2">Cognitive Domains</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#EEEEDD" />
          <PolarAngleAxis dataKey="domain" tick={{ fill: '#003049', fontSize: 14, fontWeight: 500 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Score" dataKey="score" stroke="#84A59D" fill="#84A59D" fillOpacity={0.5} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
