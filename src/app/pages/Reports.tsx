import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, RefreshCw, BarChart3, PhilippinePeso, Users } from 'lucide-react';
import { isToday, isThisMonth, isThisYear, format } from 'date-fns';

type DateFilter = 'today' | 'month' | 'year' | 'all';

export function ReportsPage() {
  const { reservations } = useAppContext();
  const [filter, setFilter] = useState<DateFilter>('today');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [filter]);

  const reportData = reservations.filter(r => {
    const d = new Date(r.date);
    return filter === 'today' ? isToday(d) : filter === 'month' ? isThisMonth(d) : filter === 'year' ? isThisYear(d) : true;
  });

  const completed = reportData.filter(r => r.status === 'completed');
  const totalRevenue = completed.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalGuests = completed.reduce((sum, r) => sum + r.partySize, 0);

  const exportReport = () => {
    const headers = "Metric,Value\n";
    const rows = `Total Revenue,${totalRevenue}\nTotal Completed Bookings,${completed.length}\nTotal Guests Served,${totalGuests}\n`;
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Financial_Report_${filter}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 className="text-amber-500"/> Financial Reports</h1>
          <p className="text-xs text-neutral-400 mt-1">Generate and export revenue reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value as DateFilter)} className="bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50">
            <option value="today">Today</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button onClick={exportReport} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      <div className="relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-neutral-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
            <RefreshCw size={28} className="text-amber-500 animate-spin mb-3" />
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Generating Report...</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-max mb-4"><PhilippinePeso size={24} /></div>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Total Revenue</p>
            <p className="text-4xl font-black text-emerald-400 mt-1">₱{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-max mb-4"><BarChart3 size={24} /></div>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Completed Bookings</p>
            <p className="text-4xl font-black text-blue-400 mt-1">{completed.length}</p>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-max mb-4"><Users size={24} /></div>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Total Guests Served</p>
            <p className="text-4xl font-black text-amber-400 mt-1">{totalGuests}</p>
          </div>
        </div>
      </div>
    </div>
  );
}