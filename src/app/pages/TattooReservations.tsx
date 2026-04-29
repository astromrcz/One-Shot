import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, Plus, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertTriangle, Phone, Mail, FileText, ChevronDown, Check, X, CalendarDays } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, isThisMonth, isThisYear } from 'date-fns';

type DateFilter = 'all' | 'today' | 'month' | 'year'; 

export function TattooReservationsPage() {
  const { tattooReservations, updateTattooReservationStatus, proposeReschedule } = useAppContext();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all'); 

  // 🚨 Reschedule State
  const [showRescheduleForm, setShowRescheduleForm] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const filtered = tattooReservations.filter(r => {
    const matchSearch = !search || 
      r.customerName.toLowerCase().includes(search.toLowerCase()) || 
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.contactNumber.includes(search);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    
    // Date Filtering Logic
    const d = new Date(r.date);
    const matchDate = dateFilter === 'all' ? true : dateFilter === 'today' ? isToday(d) : dateFilter === 'month' ? isThisMonth(d) : dateFilter === 'year' ? isThisYear(d) : true;
    
    return matchSearch && matchStatus && matchDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleProposeReschedule = async (id: string) => {
    if (!rescheduleDate || !rescheduleTime) return;
    const [year, month, day] = rescheduleDate.split('-').map(Number);
    const [hour, minute] = rescheduleTime.split(':').map(Number);
    const proposedDateObj = new Date(year, month - 1, day, hour, minute);
    
    await proposeReschedule(id, proposedDateObj, rescheduleTime);
    setShowRescheduleForm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Tattoo Bookings</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage and track all studio tattoo appointments.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input type="text" placeholder="Search customer, email or phone..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-violet-500/50 transition-colors" />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'today', 'month', 'year'] as const).map(f => (
            <button key={f} onClick={() => setDateFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors border whitespace-nowrap ${
                dateFilter === f ? 'bg-violet-600/20 text-violet-400 border-violet-600/30' : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'
              }`}>
              {f === 'month' ? 'This Month' : f === 'year' ? 'This Year' : f}
            </button>
          ))}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer min-w-[140px]">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="denied">Denied</option> 
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-neutral-950 border border-neutral-800 rounded-xl p-12 text-center">
            <Calendar size={32} className="mx-auto text-neutral-700 mb-3" />
            <p className="text-neutral-400 font-semibold">No tattoo bookings found</p>
          </div>
        ) : filtered.map(r => (
          <div key={r.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-neutral-200 text-base">{r.customerName}</h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">Booking #{r.id.split('-')[0].toUpperCase()}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                r.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                r.status === 'confirmed' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                r.status === 'denied' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {r.status}
              </span>
            </div>

            <div className="space-y-2 mb-5 flex-1">
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <Calendar size={13} className="text-neutral-500 flex-shrink-0" />
                {format(new Date(r.date), 'MMM d, yyyy')} <span className="text-neutral-500 mx-1">•</span> {r.timeSlot}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <MapPin size={13} className="text-neutral-500 flex-shrink-0" />
                {r.placement} <span className="text-neutral-500 mx-1">•</span> {r.size}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <div className="w-3 h-3 rounded-full border border-neutral-700 flex items-center justify-center flex-shrink-0 bg-neutral-900" />
                {r.colorStyle}
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-4 space-y-3">
              {r.description && (
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-1">Concept</p>
                  <p className="text-xs text-neutral-400 italic line-clamp-2">"{r.description}"</p>
                </div>
              )}
              {r.referenceImage && (
                <a href={r.referenceImage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
                  <FileText size={10} /> View Reference Image
                </a>
              )}
            </div>

            <div className="border-t border-neutral-800 pt-4 mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a href={`tel:${r.contactNumber}`} className="w-7 h-7 rounded bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <Phone size={12} />
                </a>
                <a href={`mailto:${r.email}`} className="w-7 h-7 rounded bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <Mail size={12} />
                </a>
              </div>
              
              <select
                value={r.status}
                onChange={(e) => updateTattooReservationStatus(r.id, e.target.value as any)}
                className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg px-2 py-1.5 focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="denied">Denied</option> 
              </select>
            </div>

            {/* 🚨 Rescheduling UI for Staff */}
            <div className="border-t border-neutral-800 pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-amber-500 uppercase tracking-widest font-semibold flex items-center gap-1.5"><CalendarDays size={10}/> Reschedule</p>
                {r.rescheduleRequested && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pending Customer</span>
                )}
              </div>
              
              {showRescheduleForm === r.id ? (
                <div className="space-y-2 mt-2 bg-amber-950/20 border border-amber-900/30 rounded-lg p-3">
                  <div className="flex gap-2">
                    <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50" />
                    <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowRescheduleForm(null)} className="flex-1 py-1.5 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-semibold transition-colors">Cancel</button>
                    <button onClick={() => handleProposeReschedule(r.id)} disabled={!rescheduleDate || !rescheduleTime} className="flex-1 py-1.5 text-[10px] bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded font-bold transition-colors">Propose</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setShowRescheduleForm(r.id); setRescheduleDate(''); setRescheduleTime(''); }} className="w-full py-1.5 text-[10px] border border-amber-600/50 text-amber-500 hover:bg-amber-600/10 rounded font-semibold transition-colors flex items-center justify-center gap-1.5">
                  Propose New Time
                </button>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}