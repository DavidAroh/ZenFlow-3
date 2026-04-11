
import React from 'react';
import { WellnessEntry } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface WellnessHubProps {
  entries: WellnessEntry[];
  onLogMood: () => void;
}

const WellnessHub: React.FC<WellnessHubProps> = ({ entries, onLogMood }) => {
  // Prepare data for the chart
  const chartData = entries
    .slice(-7) // Last 7 entries
    .map(entry => ({
      date: new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'short' }),
      mood: entry.mood,
      energy: entry.energy === 'high' ? 3 : entry.energy === 'medium' ? 2 : 1
    }));

  const getMoodEmoji = (mood: number) => {
    return ['😫', '😕', '😐', '🙂', '🤩'][mood - 1] || '😐';
  };

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'high': return 'text-emerald-400';
      case 'medium': return 'text-primary';
      case 'low': return 'text-orange-400';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-text-main tracking-tight mb-2">Wellness Hub</h1>
          <p className="text-text-secondary text-sm md:text-base">Track your mental state and energy levels to optimize your flow.</p>
        </div>
        <button 
          onClick={onLogMood}
          className="w-full md:w-auto px-6 py-3 bg-primary text-background-dark font-black rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span>
          LOG DAILY CHECK-IN
        </button>
      </header>

      {entries.length === 0 ? (
        <div className="bg-surface-dark border border-border-dark rounded-3xl p-12 text-center">
          <div className="size-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl">favorite</span>
          </div>
          <h2 className="text-2xl font-black text-text-main mb-2">No Wellness Data Yet</h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">Start logging your daily check-ins to see trends and get personalized AI insights into your productivity.</p>
          <button 
            onClick={onLogMood}
            className="px-8 py-3 bg-primary text-background-dark font-black rounded-xl"
          >
            CREATE FIRST ENTRY
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mood Trend Chart */}
          <div className="lg:col-span-2 bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Mood & Energy Trend</h2>
              </div>
              <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-primary" />
                  <span className="text-text-secondary">Mood</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span className="text-text-secondary">Energy</span>
                </div>
              </div>
            </div>
            
            <div className="h-[250px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-secondary)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#13ec5b" 
                    fillOpacity={1} 
                    fill="url(#colorMood)" 
                    strokeWidth={3}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="#10B981" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: '#10B981' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-8">
            <div className="bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-xl">
              <h2 className="text-xs font-black text-text-secondary uppercase tracking-widest mb-6">Current State</h2>
              <div className="flex items-center gap-6">
                <div className="text-5xl">{getMoodEmoji(entries[entries.length - 1].mood)}</div>
                <div>
                  <p className="text-2xl font-black text-text-main">Feeling Good</p>
                  <p className={`text-sm font-bold uppercase tracking-widest ${getEnergyColor(entries[entries.length - 1].energy)}`}>
                    {entries[entries.length - 1].energy} Energy
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-xl">
              <h2 className="text-xs font-black text-text-secondary uppercase tracking-widest mb-6">Recent Reflection</h2>
              <p className="text-sm text-text-secondary italic leading-relaxed">
                "{entries[entries.length - 1].reflection || 'No reflection provided for this entry.'}"
              </p>
              <p className="mt-4 text-[10px] font-black text-text-main uppercase tracking-tighter">
                Logged {new Date(entries[entries.length - 1].timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* History List */}
          <div className="lg:col-span-3 bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">history</span>
              <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Wellness History</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-dark">
                    <th className="pb-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Date</th>
                    <th className="pb-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Mood</th>
                    <th className="pb-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Energy</th>
                    <th className="pb-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Reflection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark/50">
                  {entries.slice().reverse().map(entry => (
                    <tr key={entry.id} className="group hover:bg-primary/5 transition-colors">
                      <td className="py-4 text-xs font-bold text-text-main">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-2xl">
                        {getMoodEmoji(entry.mood)}
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full bg-surface-dark border border-border-dark ${getEnergyColor(entry.energy)}`}>
                          {entry.energy}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-text-secondary max-w-md truncate">
                        {entry.reflection}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellnessHub;
