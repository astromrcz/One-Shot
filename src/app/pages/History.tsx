import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, Search, RefreshCw, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format, isToday, isThisMonth, isThisYear } from 'date-fns';

type DateFilter = 'today' | 'month' | 'year' | 'all';

export function HistoryPage() {
  const { reservations } = useAppContext();
  const [filter, setFilter] = useState<DateFilter>('today');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // STEP 5 logic: Fetching simulation on filter change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [filter]);

  const historyData = reservations.filter(r => {
    const d = new Date(r.date);
    const matchDate = filter === 'today' ? isToday(d) : filter === 'month' ? isThisMonth(d) : filter === 'year' ? isThisYear(d) : true;
    const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase());
    return matchDate && matchSearch && (r.status === 'completed' || r.status === 'cancelled');
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportCSV = () => {
    const headers = "ID,Customer,Contact,Date,Time,Status,Total Amount\n";
    const rows = historyData.map(r => `${r.id},"${r.customerName}",${r.contactNumber},${format(new Date(r.date), 'yyyy-MM-dd')},${r.timeSlot},${r.status},${r.totalAmount}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `History_${filter}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar className="text-emerald-500"/> Session & Reservation History</h1>
          <p className="text-xs text-neutral-400 mt-1">View and export past completed or cancelled sessions.</p>
        </div>
        <button onClick={exportCSV} disabled={historyData.length === 0} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
          <Download size={16} /> Export to CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input type="text" placeholder="Search history..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['today', 'month', 'year', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' : 'bg-neutral-950 text-neutral-500 border border-neutral-800'}`}>
              {f === 'month' ? 'This Month' : f === 'year' ? 'This Year' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <RefreshCw size={28} className="text-emerald-500 animate-spin mb-3" />
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Fetching Database...</p>
          </div>
        )}
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
            <tr>
              <th className="p-4 font-semibold">Date & Time</th>
              <th className="p-4 font-semibold">Customer</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Total Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {historyData.map(r => (
              <tr key={r.id} className="hover:bg-neutral-900/50">
                <td className="p-4 text-neutral-300">{format(new Date(r.date), 'MMM d, yyyy')} <span className="text-neutral-500 ml-2">{r.timeSlot}</span></td>
                <td className="p-4 font-semibold text-neutral-200">{r.customerName}</td>
                <td className="p-4">
                  <span className={`flex items-center gap-1.5 w-max px-2.5 py-1 rounded text-[10px] font-bold ${r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {r.status === 'completed' ? <CheckCircle size={12}/> : <XCircle size={12}/>} {r.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 font-bold text-emerald-400">₱{r.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
            {historyData.length === 0 && !isLoading && (
              <tr><td colSpan={4} className="p-8 text-center text-neutral-600">No history found for this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}