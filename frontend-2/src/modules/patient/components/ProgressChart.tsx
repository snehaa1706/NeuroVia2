import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgressChartProps {
  data: Array<{ date: string; score: number }>;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[300px] bg-white rounded-3xl p-6 shadow-sm border border-(--color-ivory-200)">
      <h3 className="text-2xl font-bold text-(--color-navy) mb-6">Recent Progress</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEDD" vertical={false} />
          <XAxis dataKey="date" stroke="#003049" tick={{ fontSize: 14 }} tickLine={false} axisLine={false} />
          <YAxis stroke="#003049" tick={{ fontSize: 14 }} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#003049', fontWeight: 'bold' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#84A59D" 
            strokeWidth={4}
            dot={{ r: 6, fill: '#84A59D', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;
