import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import { 
  TrendingUp, TrendingDown, BarChart3, Clock, TableProperties, 
  Download, RefreshCw, PhilippinePeso, Users, CheckCircle 
} from 'lucide-react';
import { 
  isToday, isThisMonth, isThisYear, subDays, subMonths, 
  format, isSameDay, isSameWeek, isSameMonth, 
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  isAfter, startOfDay
} from 'date-fns';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
type GlobalRange = 'today' | '7d' | 'month' | 'year';

// --- HELPERS ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-neutral-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
            {p.name}: ₱{p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function StatCard({ label, value, sub, icon: Icon, color }: any) {
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
    </div>
  );
}

export function Analytics() {
  const { tables, reservations } = useAppContext();
  const [range, setRange] = useState<GlobalRange>('month');
  const [isLoading, setIsLoading] = useState(false);

  // Unified loading effect for the entire page
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [range]);

  // --- 1. DYNAMIC DATE RANGE FILTERING ---
  const filteredReservations = useMemo(() => {
    const now = new Date();
    
    return reservations.filter(r => {
      const resDate = new Date(r.date);
      if (r.status !== 'completed') return false;

      if (range === 'today') return isToday(resDate);
      
      let startDate: Date;
      if (range === '7d') startDate = subDays(now, 6);
      else if (range === 'month') startDate = subMonths(now, 1);
      else startDate = subMonths(now, 11);

      return isAfter(startOfDay(resDate), startOfDay(startDate));
    });
  }, [reservations, range]);

  // --- 2. KPI CALCULATIONS (Synced to Range) ---
  const totalRevenue = filteredReservations.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalGuests = filteredReservations.reduce((sum, r) => sum + (r.partySize || 0), 0);
  const completedCount = filteredReservations.length;

  // --- 3. TREND DATA (Synced to Range) ---
  const trendData = useMemo(() => {
    const now = new Date();
    
    if (range === 'today') {
      // Create buckets for every 2 hours for today
      return [8, 10, 12, 14, 16, 18, 20, 22].map(hour => ({
        label: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
        revenue: filteredReservations
          .filter(r => new Date(r.date).getHours() >= hour && new Date(r.date).getHours() < hour + 2)
          .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
      }));
    }

    if (range === '7d') {
      return eachDayOfInterval({ start: subDays(now, 6), end: now }).map(date => ({
        label: format(date, 'EEE'),
        revenue: filteredReservations
          .filter(r => isSameDay(new Date(r.date), date))
          .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
      }));
    }

    if (range === 'month') {
      return eachWeekOfInterval({ start: subMonths(now, 1), end: now }).map(date => ({
        label: `Week ${format(date, 'w')}`,
        revenue: filteredReservations
          .filter(r => isSameWeek(new Date(r.date), date))
          .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
      }));
    }

    return eachMonthOfInterval({ start: subMonths(now, 11), end: now }).map(date => ({
      label: format(date, 'MMM'),
      revenue: filteredReservations
        .filter(r => isSameMonth(new Date(r.date), date))
        .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    }));
  }, [filteredReservations, range]);

  // --- 4. SESSION DISTRIBUTION (Synced to Range) ---
  const sessionDist = useMemo(() => {
    return [
      { name: 'Open Time', value: filteredReservations.filter(r => !r.durationHours || r.durationHours === 0).length },
      { name: '1 Hour', value: filteredReservations.filter(r => r.durationHours === 1).length },
      { name: '2 Hours', value: filteredReservations.filter(r => r.durationHours === 2).length },
      { name: '3 Hours', value: filteredReservations.filter(r => r.durationHours === 3).length },
      { name: '4+ Hours', value: filteredReservations.filter(r => r.durationHours >= 4).length },
    ].filter(d => d.value > 0);
  }, [filteredReservations]);

  // --- 5. TABLE PERFORMANCE (Synced to Range) ---
  const tablePerformance = useMemo(() => {
    return tables.map(table => {
      const tableRes = filteredReservations.filter(r => r.tableId === table.id);
      const revenue = tableRes.reduce((s, r) => s + (r.totalAmount || 0), 0);
      return {
        name: table.name,
        sessions: tableRes.length,
        revenue: revenue,
        usage: Math.min(100, Math.round((tableRes.length / (filteredReservations.length || 1)) * 100 * 5))
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [tables, filteredReservations]);

  const exportReport = () => {
    const headers = "Metric,Value\n";
    const rows = `Range,${range}\nTotal Revenue,${totalRevenue}\nCompleted Bookings,${completedCount}\nGuests Served,${totalGuests}\n`;
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `OneShot_Analytics_${range}.csv`; a.click();
  };

  return (
    <div className="space-y-6 relative">
      {/* GLOBAL LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-neutral-950/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <RefreshCw size={20} className="text-amber-500 animate-spin" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">Syncing Data...</span>
          </div>
        </div>
      )}

      {/* UNIFIED HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <BarChart3 className="text-amber-500" size={20}/> Business Intelligence
          </h1>
          <p className="text-xs text-neutral-400 mt-1">Unified analytics for the selected period.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 w-full sm:w-auto">
  {(['today', '7d', 'month', 'year'] as GlobalRange[]).map((t) => (
    <button
      key={t}
      onClick={() => setRange(t)}
      className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${range === t ? 'bg-amber-600 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
    >
      {t === 'today' ? 'Today' : t === '7d' ? 'Last 7 Days' : t === 'month' ? 'Last Month' : 'Past Year'}
    </button>
  ))}
  <div className="w-px h-4 bg-neutral-800 mx-1" />
  <button onClick={exportReport} title="Export CSV" className="p-2 text-neutral-400 hover:text-white transition-colors">
    <Download size={18} />
  </button>
</div>
      </div>


      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={`₱${totalRevenue.toLocaleString()}`} sub={`Gross (${range})`} icon={PhilippinePeso} color="text-emerald-400" />
        <StatCard label="Completed Sessions" value={completedCount} sub="Finalized bookings" icon={CheckCircle} color="text-blue-400" />
        <StatCard label="Guests Served" value={totalGuests} sub="Total pax" icon={Users} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* REVENUE TREND */}
        <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-neutral-300 mb-6">Revenue Trajectory</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="analytics-revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} fill="url(#analytics-revGrad)" dot={{ fill: '#10b981', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* SESSION DISTRIBUTION */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-neutral-300 mb-1">Session Distribution</h3>
          <p className="text-xs text-neutral-600 mb-6">Popular durations</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sessionDist} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={5}>
                {sessionDist.map((entry, i) => (
                  <Cell key={i} fill={entry.name === 'Open Time' ? '#3b82f6' : COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 mt-4">
            {sessionDist.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.name === 'Open Time' ? '#3b82f6' : COLORS[i % COLORS.length] }} />
                  <span className="text-neutral-400">{item.name}</span>
                </div>
                <span className="text-neutral-200 font-bold">{item.value} sessions</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLE PERFORMANCE */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-neutral-300 mb-4">Table Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-800 text-[10px] text-neutral-500 uppercase tracking-wider">
                <th className="py-3 pr-4">Table</th>
                <th className="py-3 pr-4">Sessions</th>
                <th className="py-3 pr-4">Total Revenue</th>
                <th className="py-3">Utilization</th>
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
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${t.usage}%` }} />
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