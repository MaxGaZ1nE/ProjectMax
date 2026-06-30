import React from 'react';

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

export default function KPICard({ title, value, change, icon }: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-neutral-100 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-neutral-600">{title}</h3>
        <div className="w-10 h-10 rounded-full bg-[#1B4332]/10 flex items-center justify-center text-[#1B4332]">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-neutral-900 mb-2">{value}</div>
        <div className="flex items-center text-xs">
          <span
            className={`font-semibold flex items-center ${
              isPositive ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(change)}%
          </span>
          <span className="text-neutral-500 ml-2">เทียบกับเมื่อวาน</span>
        </div>
      </div>
    </div>
  );
}
