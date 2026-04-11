import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ProgressChartProps {
  data: Array<{ date: string; score: number }>;
  title?: string;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data, title = 'Recent Progress' }) => {
  return (
    <div className="w-full bg-white rounded-3xl p-6 shadow-lg border border-(--color-border)">
      <h3 className="text-2xl font-bold text-(--color-navy) mb-4">{title}</h3>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#84A59D" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#84A59D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#CCC8BB" vertical={false} />
            <XAxis dataKey="date" stroke="#003049" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#003049" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#003049', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#84A59D" 
              strokeWidth={3}
              fill="url(#colorScore)"
              dot={{ r: 5, fill: '#84A59D', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, fill: '#003049' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressChart;
