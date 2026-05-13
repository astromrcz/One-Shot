import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserPlus, X, Bell, CheckCircle, Clock, Users, ChevronDown, ChevronUp, Calendar as CalendarIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import { useNavigate } from 'react-router';

export function Queue() {
  const { queue, addToQueue, removeFromQueue, callQueueItem, tables, reservations, cancelReservation, reservationTerms } = useAppContext() as any;
  const navigate = useNavigate();

  const [now, setNow] = useState(new Date());

  // 🚨 FIXED: We track exactly when the bell was clicked so the 15m timer doesn't start at arrival
  const [calledTimes, setCalledTimes] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('oneshot_called_times');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup local storage so it doesn't store old queue IDs forever
  useEffect(() => {
    const activeIds = new Set(queue.map((q: any) => q.id));
    let changed = false;
    const cleaned: Record<string, number> = {};
    
    for (const id in calledTimes) {
      if (activeIds.has(id)) {
        cleaned[id] = calledTimes[id];
      } else {
        changed = true;
      }
    }
    
    if (changed) {
      setCalledTimes(cleaned);
      localStorage.setItem('oneshot_called_times', JSON.stringify(cleaned));
    }
  }, [queue, calledTimes]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes] = useState('');

  const waiting = queue.filter((q: any) => q.status === 'waiting');
  const called = queue.filter((q: any) => q.status === 'called');
  const availableTables = tables.filter((t: any) => t.status === 'available');
  
  const upcomingReservations = reservations
    .filter((r: any) => r.status !== 'cancelled' && r.status !== 'completed')
    .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
    .slice(0, 10);

  // 🚨 FIXED: Now calculates based on the exact click time, not arrival time
  const getGraceTime = (calledAt: Date | string | number) => {
    const start = new Date(calledAt).getTime();
    const elapsed = now.getTime() - start;
    const remaining = Math.max(0, (15 * 60 * 1000) - elapsed);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return {
      formatted: `${mins}:${secs.toString().padStart(2, '0')}`,
      isUrgent: mins < 5,
      rawRemaining: remaining
    };
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    addToQueue({ customerName: name, contactNumber: contact, partySize, notes });
    setName(''); setContact(''); setPartySize(2); setNotes('');
    setShowAddForm(false);
  };

  const handleCallCustomer = (item: any) => {
    // Record the exact time the bell was clicked
    const nowMs = Date.now();
    const newTimes = { ...calledTimes, [item.id]: nowMs };
    setCalledTimes(newTimes);
    localStorage.setItem('oneshot_called_times', JSON.stringify(newTimes));
    
    const utterance = new SpeechSynthesisUtterance(`Calling customer ${item.customerName}. Please proceed to the counter.`);
    window.speechSynthesis.speak(utterance);
    callQueueItem(item.id); 
  };

  return (
    <div className="space-y-5">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Users size={15} className="text-amber-400" />
            <span className="text-sm font-semibold text-neutral-200">{waiting.length} Waiting</span>
          </div>
          {availableTables.length > 0 && (
            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">{availableTables.length} Table{availableTables.length > 1 ? 's' : ''} Available</span>
            </div>
          )}
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl transition-all font-semibold shadow-lg shadow-emerald-900/30">
          <UserPlus size={15} /> Add to Queue {showAddForm ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-neutral-300 mb-4 flex items-center gap-2">
            <UserPlus size={15} className="text-emerald-500" /> Register Walk-in Customer (FCFS)
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Full Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder-neutral-600" placeholder="Customer name" required autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Contact Number</label>
              <input type="tel" value={contact} onChange={e => setContact(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder-neutral-600" placeholder="09xx-xxx-xxxx" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Party Size</label>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: (reservationTerms?.maxPartySize || 6) - (reservationTerms?.minPartySize || 1) + 1 }, (_, i) => (reservationTerms?.minPartySize || 1) + i).map(n => (
                  <button key={n} type="button" onClick={() => setPartySize(n)} className={`flex-1 py-2 min-w-[36px] rounded-lg border text-xs font-bold transition-all ${partySize === n ? 'bg-emerald-600/15 border-emerald-600 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}>{n}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Notes (optional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder-neutral-600" placeholder="Special requests..." />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl font-semibold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2">
                <UserPlus size={15} /> Add to Queue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Queue Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs text-neutral-500 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Waiting Queue ({waiting.length})
          </h2>

          {waiting.length === 0 ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-10 text-center">
              <CheckCircle size={32} className="mx-auto text-emerald-500/40 mb-3" />
              <p className="text-neutral-400 font-semibold">No customers in queue</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {waiting.map((item: any, index: number) => (
                <div key={item.id} className={`bg-neutral-950 border rounded-xl p-4 flex items-center gap-4 transition-all ${index === 0 ? 'border-emerald-700/40 shadow-sm shadow-emerald-900/10' : 'border-neutral-800'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-none ${index === 0 ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-200">{item.customerName}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-neutral-500">
                      <span className="flex items-center gap-1"><Users size={10} /> {item.partySize} pax</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {formatDistanceToNow(new Date(item.arrivalTime), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleCallCustomer(item)} className="p-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 rounded-lg border border-amber-700/30"><Bell size={14} /></button>
                    <button onClick={() => removeFromQueue(item.id)} className="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-lg border border-rose-700/30"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Called Customers */}
          {called.length > 0 && (
            <div className="mt-5 space-y-2">
              <h2 className="text-xs text-neutral-600 uppercase tracking-widest font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> Called ({called.length})
              </h2>
              {called.map((item: any) => {
                // 🚨 FIXED: Retrieves the exact saved click time, falling back to arrival time if missing
                const grace = getGraceTime(calledTimes[item.id] || item.arrivalTime); 
                return (
                  <div key={item.id} className={`bg-neutral-950 border rounded-xl p-3 flex items-center gap-3 transition-all ${grace.isUrgent ? 'border-rose-500/50 bg-rose-500/5' : 'border-blue-900/30'}`}>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-neutral-300">{item.customerName}</p>
                      <p className="text-xs text-neutral-600">{item.partySize} pax · {item.contactNumber}</p>
                    </div>
                    
                    <div className="flex flex-col items-end px-3 border-r border-neutral-800">
                      <span className={`text-xs font-mono font-black ${grace.isUrgent ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>{grace.formatted}</span>
                      <span className="text-[8px] text-neutral-600 uppercase font-bold">Expires</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => {
                          const utterance = new SpeechSynthesisUtterance(`Re-calling customer ${item.customerName}. Your table is ready, please proceed to the counter.`);
                          window.speechSynthesis.speak(utterance);
                        }}
                        title="Call again"
                        className="p-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 rounded-lg border border-amber-500/20 transition-all"
                      >
                        <Bell size={14} />
                      </button>

                      <button onClick={() => {
                        const firstAvail = availableTables.length > 0 ? availableTables[0].id : '';
                        navigate(`/staff/tables?assignTable=${firstAvail}&queueId=${item.id}`);
                      }} className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-700/30 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">Assign <ArrowRight size={12} /></button>
                      
                      <button onClick={() => removeFromQueue(item.id)} className="p-2 text-neutral-600 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg"><X size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Available Tables Verbatim */}
        <div className="space-y-3">
          <h2 className="text-xs text-neutral-500 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Available Tables ({availableTables.length})
          </h2>
          {availableTables.length === 0 ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-center">
              <p className="text-sm text-neutral-500">No tables available</p>
              <button onClick={() => navigate('/staff/tables')} className="text-xs text-emerald-500 hover:text-emerald-400 mt-2 font-semibold">View Table Monitor →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {availableTables.map((table: any) => (
                <div key={table.id} className="bg-neutral-950 border border-emerald-800/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-neutral-200">{table.name}</p>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase">Free</span>
                  </div>
                  {waiting.length > 0 && (
                    <button onClick={() => navigate(`/staff/tables?assignTable=${table.id}&queueId=${waiting[0].id}`)} className="w-full text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-700/30 py-2 rounded-lg font-medium">Assign to {waiting[0]?.customerName}</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}