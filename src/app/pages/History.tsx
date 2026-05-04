import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, Search, RefreshCw, Calendar, CheckCircle, XCircle, User } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';

type DateFilter = 'today' | 'week' | 'month' | 'year' | 'all';

export function HistoryPage() {
  const { reservations, tables } = useAppContext(); // 🚨 Added tables for walk-in context if needed
  const [filter, setFilter] = useState<DateFilter>('today');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [filter]);

  const historyData = reservations.filter(r => {
    const d = new Date(r.date);
    
    // 1. Date Filter Logic
    const matchDate = 
      filter === 'today' ? isToday(d) : 
      filter === 'week' ? isThisWeek(d, { weekStartsOn: 1 }) : 
      filter === 'month' ? isThisMonth(d) : 
      filter === 'year' ? isThisYear(d) : true;
      
    // 2. Search Logic
    const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase());
    
    // 3. Status Logic (Includes completed reservations AND walk-ins stored in the reservations table)
    return matchDate && matchSearch && (r.status === 'completed' || r.status === 'cancelled');
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportCSV = () => {
    const headers = "ID,Type,Customer,Contact,Date,Time,Status,Total Amount\n";
    const rows = historyData.map(r => {
      // Logic to label walk-ins vs reservations in the export
      const type = r.tableId && !r.email ? 'Walk-in' : 'Reservation';
      return `${r.id},${type},"${r.customerName}",${r.contactNumber},${format(new Date(r.date), 'yyyy-MM-dd')},${format(new Date(r.date), 'hh:mm:ss a')},${r.status},${r.totalAmount}`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Full_History_${filter}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Calendar className="text-emerald-500"/> Activity History
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            View all past activities, including **reservations and walk-in sessions**.
          </p>
        </div>
        <button 
          onClick={exportCSV} 
          disabled={historyData.length === 0} 
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
        >
          <Download size={16} /> Export Detailed CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search by customer name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50" 
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['today', 'week', 'month', 'year', 'all'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${filter === f ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' : 'bg-neutral-950 text-neutral-500 border border-neutral-800'}`}
            >
              {f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : f === 'year' ? 'This Year' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <RefreshCw size={28} className="text-emerald-500 animate-spin mb-3" />
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Updating Records...</p>
          </div>
        )}
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
            <tr>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Date & Time</th>
              <th className="p-4 font-semibold">Customer</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {historyData.map(r => {
              // 🚨 UI Distinction: Check if it was a Walk-in (Usually has tableId but no email)
              const isWalkIn = r.tableId && !r.email;

              return (
                <tr key={r.id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${isWalkIn ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                      {isWalkIn ? 'Walk-In' : 'Booking'}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-300">
                    <div className="flex flex-col">
                      <span className="font-medium">{format(new Date(r.date), 'MMM d, yyyy')}</span>
                      <span className="text-[11px] text-neutral-500">{format(new Date(r.date), 'hh:mm:ss a')}</span>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-neutral-200">{r.customerName}</td>
                  <td className="p-4">
                    <span className={`flex items-center gap-1.5 w-max px-2.5 py-1 rounded text-[10px] font-bold ${r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {r.status === 'completed' ? <CheckCircle size={10}/> : <XCircle size={10}/>} 
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-400 text-right">₱{r.totalAmount.toFixed(2)}</td>
                </tr>
              );
            })}
            {historyData.length === 0 && !isLoading && (
              <tr><td colSpan={5} className="p-12 text-center text-neutral-600">No activity history found for this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}