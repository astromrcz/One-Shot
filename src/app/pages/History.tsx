import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, Search, RefreshCw, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';

type DateFilter = 'today' | 'week' | 'month' | 'year' | 'all';

export function HistoryPage() {
  // 🚨 FIXED: Pulling both Billiards and Tattoo reservations to combine them into one master log
  const { reservations, tattooReservations } = useAppContext(); 
  const [filter, setFilter] = useState<DateFilter>('today');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [filter]);

  // 🚨 FIXED: Combine both databases into one unified array
  const combinedHistory = [
    ...(reservations || []).map(r => ({ 
      ...r, 
      historyType: r.tableId && !r.email ? 'Walk-in' : 'Billiards Booking' 
    })),
    ...(tattooReservations || []).map(r => ({ 
      ...r, 
      historyType: 'Tattoo Booking' 
    }))
  ];

  const historyData = combinedHistory.filter(r => {
    if (!r.date && !r.createdAt) return false;
    
    // Safely parse the date
    const d = new Date(r.date || r.createdAt);
    
    // 1. Date Filter Logic
    const matchDate = 
      filter === 'today' ? isToday(d) : 
      filter === 'week' ? isThisWeek(d, { weekStartsOn: 1 }) : 
      filter === 'month' ? isThisMonth(d) : 
      filter === 'year' ? isThisYear(d) : true;
      
    // 2. Search Logic
    const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase());
    
    // 3. Status Logic (Only show finished lifecycle statuses)
    const isFinished = r.status === 'completed' || r.status === 'cancelled' || r.status === 'denied';
    
    return matchDate && matchSearch && isFinished;
  }).sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  const exportCSV = () => {
    const headers = "ID,Type,Customer,Contact,Date,Time,Status,Total Amount\n";
    const rows = historyData.map(r => {
      return `${r.id},${r.historyType},"${r.customerName}",${r.contactNumber},${format(new Date(r.date || r.createdAt), 'yyyy-MM-dd')},${r.timeSlot || format(new Date(r.date || r.createdAt), 'hh:mm a')},${r.status},${r.totalAmount || 0}`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `OneShot_History_${filter}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Calendar className="text-emerald-500"/> Activity History
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            View all completed or cancelled bookings for Billiards and Tattoos.
          </p>
        </div>
        <button 
          onClick={exportCSV} 
          disabled={historyData.length === 0} 
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
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
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50 transition-colors" 
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['today', 'week', 'month', 'year', 'all'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all border ${filter === f ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30 shadow-md shadow-emerald-900/20' : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'}`}
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 font-semibold">Type</th>
                <th className="px-5 py-4 font-semibold">Date & Time</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {historyData.map(r => {
                const isWalkIn = r.historyType === 'Walk-in';
                const isTattoo = r.historyType === 'Tattoo Booking';

                return (
                  <tr key={r.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        isTattoo ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 
                        isWalkIn ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {r.historyType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-neutral-300">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-neutral-200">{format(new Date(r.date || r.createdAt), 'MMM d, yyyy')}</span>
                        <span className="text-[11px] text-neutral-500">{r.timeSlot ? formatTimeSlot(r.timeSlot) : format(new Date(r.date || r.createdAt), 'hh:mm a')}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-neutral-200">{r.customerName}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">ID: {r.id.split('-')[0].toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 
                        r.status === 'denied' ? 'bg-red-500/10 text-red-500' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {r.status === 'completed' ? <CheckCircle size={12}/> : r.status === 'denied' ? <AlertTriangle size={12}/> : <XCircle size={12}/>} 
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black text-white text-right">
                      ₱{(r.totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              {historyData.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Calendar size={32} className="mx-auto text-neutral-700 mb-3" />
                    <p className="text-neutral-500 text-sm font-medium">No activity history found for this period.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}