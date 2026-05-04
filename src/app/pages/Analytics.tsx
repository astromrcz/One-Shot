import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import { TrendingUp, TrendingDown, BarChart3, Clock, TableProperties, Download, RefreshCw, PhilippinePeso, Users, CheckCircle } from 'lucide-react';
import { isToday, isThisMonth, isThisYear, subDays, format, startOfDay } from 'date-fns';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
type DateFilter = 'today' | 'month' | 'year' | 'all';

// --- HELPERS ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-neutral-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
            {p.name}: {p.dataKey === 'revenue' || p.dataKey === 'value' ? `₱${p.value.toLocaleString()}` : p.value}
            {p.dataKey === 'occupancy' ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function StatCard({ label, value, sub, trend, icon: Icon, color }: any) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">{label}</p>
        <div className={`p-1.5 rounded-lg ${color.replace('text-', 'bg-').replace('-400', '-500/10')}`}>
          <Icon size={14} className={color} />
        </div>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(trend)}% vs last period
        </div>
      )}
    </div>
  );
}

export function Analytics() {
  const { tables, reservations } = useAppContext();
  const [filter, setFilter] = useState<DateFilter>('month');
  const [isLoading, setIsLoading] = useState(false);

  // Fake Loading Effect when switching filters
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [filter]);

  // --- 1. CALCULATE REPORT DATA (Verbatim from Reports logic) ---
  const reportData = reservations.filter(r => {
    const d = new Date(r.date);
    return filter === 'today' ? isToday(d) : filter === 'month' ? isThisMonth(d) : filter === 'year' ? isThisYear(d) : true;
  });

  const completed = reportData.filter(r => r.status === 'completed');
  const totalRevenue = completed.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalGuests = completed.reduce((sum, r) => sum + r.partySize, 0);

  // --- 2. CALCULATE DYNAMIC CHART DATA ---
  
  // Weekly Revenue (Last 7 Days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = subDays(new Date(), i);
    const dayName = format(d, 'EEE');
    const dayRevenue = reservations
      .filter(r => r.status === 'completed' && startOfDay(new Date(r.date)).getTime() === startOfDay(d).getTime())
      .reduce((sum, r) => sum + r.totalAmount, 0);
    return { day: dayName, revenue: dayRevenue, date: d };
  }).reverse();

  // Session Duration Distribution
  const sessionDist = [
    { 
      name: 'Open Time', 
      // Assuming 0 or null represents Open Time sessions in your DB
      value: reservations.filter(r => r.status === 'completed' && (r.durationHours === 0 || !r.durationHours)).length 
    },
    { name: '1 Hour', value: reservations.filter(r => r.status === 'completed' && r.durationHours === 1).length },
    { name: '2 Hours', value: reservations.filter(r => r.status === 'completed' && r.durationHours === 2).length },
    { name: '3 Hours', value: reservations.filter(r => r.status === 'completed' && r.durationHours === 3).length },
    { name: '4+ Hours', value: reservations.filter(r => r.status === 'completed' && r.durationHours >= 4).length },
  ].filter(d => d.value > 0);

  // Table Performance
  const tablePerformance = tables.map(table => {
    const tableRes = reservations.filter(r => r.tableId === table.id && r.status === 'completed');
    const revenue = tableRes.reduce((s, r) => s + r.totalAmount, 0);
    return {
      name: table.name,
      sessions: tableRes.length,
      revenue: revenue,
      usage: Math.min(100, Math.round((tableRes.length / (reservations.length || 1)) * 100 * 5)) // Simplified weight
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const exportReport = () => {
    const headers = "Metric,Value\n";
    const rows = `Total Revenue,${totalRevenue}\nTotal Completed Bookings,${completed.length}\nTotal Guests Served,${totalGuests}\n`;
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `OneShot_Financial_Report_${filter}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      {/* SECTION: FINANCIAL REPORTS (Merged) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <PhilippinePeso className="text-amber-500" size={20}/> Reports and Analytics
          </h1>
          <p className="text-xs text-neutral-400 mt-1">Real-time revenue and booking analytics.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value as DateFilter)} 
            className="flex-1 sm:flex-none bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50"
          >
            <option value="today">Today</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button onClick={exportReport} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-neutral-900/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
            <RefreshCw size={24} className="text-amber-500 animate-spin" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Filter Revenue" value={`₱${totalRevenue.toLocaleString()}`} sub={`Gross from ${filter}`} icon={PhilippinePeso} color="text-emerald-400" />
          <StatCard label="Bookings" value={completed.length} sub="Completed sessions" icon={CheckCircle} color="text-blue-400" />
          <StatCard label="Total Guests" value={totalGuests} sub="Pax served" icon={Users} color="text-amber-400" />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Real Weekly Revenue Area Chart */}
        <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-neutral-300">Revenue Trend (Last 7 Days)</h3>
            <p className="text-xs text-neutral-600 mt-0.5">Daily table rental income</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="analytics-revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Daily Revenue" stroke="#10b981" strokeWidth={3} fill="url(#analytics-revGrad)" dot={{ fill: '#10b981', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Real Session Distribution */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-neutral-300 mb-1">Session Distribution</h3>
          <p className="text-xs text-neutral-600 mb-4">Timed vs Open Time Popularity</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie 
                data={sessionDist} 
                cx="50%" 
                cy="50%" 
                innerRadius={55} 
                outerRadius={80} 
                dataKey="value" 
                paddingAngle={5}
              >
                {sessionDist.map((entry, i) => (
                  <Cell 
                    key={i} 
                    // Use a specific blue for Open Time if it matches the name
                    fill={entry.name === 'Open Time' ? '#3b82f6' : COLORS[i % COLORS.length]} 
                    stroke="none" 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {sessionDist.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-sm" 
                    style={{ backgroundColor: item.name === 'Open Time' ? '#3b82f6' : COLORS[i % COLORS.length] }} 
                  />
                  <span className="text-neutral-400">{item.name}</span>
                </div>
                <span className="text-neutral-200 font-bold">{item.value} sessions</span>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Table Performance Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-300">Table Utilization Performance</h3>
            <p className="text-xs text-neutral-600 mt-0.5">Which tables are generating the most value?</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 text-left">
                <th className="text-[10px] text-neutral-500 uppercase tracking-wider py-3 pr-4">Table</th>
                <th className="text-[10px] text-neutral-500 uppercase tracking-wider py-3 pr-4">Total Sessions</th>
                <th className="text-[10px] text-neutral-500 uppercase tracking-wider py-3 pr-4">Revenue Contribution</th>
                <th className="text-[10px] text-neutral-500 uppercase tracking-wider py-3">Popularity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40">
              {tablePerformance.map((t, i) => (
                <tr key={i} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="py-3 text-sm font-bold text-neutral-200">{t.name}</td>
                  <td className="py-3 text-sm text-neutral-400">{t.sessions}</td>
                  <td className="py-3 text-sm text-emerald-400 font-black">₱{t.revenue.toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-neutral-800 rounded-full max-w-[100px]">
                        <div 
                          className="h-full rounded-full bg-amber-500" 
                          style={{ width: `${t.usage}%` }} 
                        />
                      </div>
                      <span className="text-[10px] text-neutral-500 font-bold">{t.usage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}