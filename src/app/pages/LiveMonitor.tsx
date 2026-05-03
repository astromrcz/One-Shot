import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Table, QueueItem, Reservation } from '../context/AppContext';
import { Clock, Users, Calendar, ArrowRight } from 'lucide-react';
import { isToday, format } from 'date-fns';

// 🚨 FORMATTER: HH:MM:SS format
const formatTimeDisplay = (totalSecs: number) => {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.floor(totalSecs % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// 12-hour clock formatter for display
const formatTimeSlot = (time24: string) => {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${m} ${ampm}`;
};

// ── Helpers ────────────────────────────────────────────────────
function getSessionTimer(table: Table): {
  formatted: string; isOvertime: boolean; percentLeft: number; label: string; isOpenTime: boolean; secsLeft: number;
} {
  if (!table.session) return { formatted: '--:--', isOvertime: false, percentLeft: 0, label: '', isOpenTime: false, secsLeft: 0 };
  const start = new Date(table.session.startTime).getTime();
  
  if (table.session.durationMinutes === 0) {
    const elapsedSecs = Math.floor(Math.max(0, Date.now() - start) / 1000);
    const formatted = formatTimeDisplay(elapsedSecs);
    return { formatted, isOvertime: false, percentLeft: 100, label: `${formatted} elapsed`, isOpenTime: true, secsLeft: 0 };
  } else if (table.session.durationMinutes < 0) {
     const baseMins = Math.abs(table.session.durationMinutes);
     const endMs = start + (baseMins * 60000);
     const remainingMs = endMs - Date.now();
     if (remainingMs > 0) {
         const remainingSecs = Math.floor(remainingMs / 1000);
         const formatted = formatTimeDisplay(remainingSecs);
         const percentLeft = Math.max(0, Math.min(100, (remainingMs / (baseMins * 60000)) * 100));
         return { formatted, isOvertime: false, percentLeft, label: `${formatted} remaining`, isOpenTime: false, secsLeft: remainingSecs };
     } else {
         const elapsedSecs = Math.floor(Math.max(0, Date.now() - start) / 1000);
         const formatted = formatTimeDisplay(elapsedSecs);
         return { formatted, isOvertime: false, percentLeft: 100, label: `${formatted} elapsed`, isOpenTime: true, secsLeft: 0 };
     }
  }

  const totalMs = table.session.durationMinutes * 60000;
  const elapsed = Date.now() - start;
  const remainingMs = totalMs - elapsed;
  const isOvertime = remainingMs < 0;
  const absSecs = Math.floor(Math.abs(remainingMs) / 1000);
  const formatted = formatTimeDisplay(absSecs);
  const percentLeft = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const label = isOvertime ? `+${formatted} Overtime` : `${formatted} remaining`;
  const secsLeft = Math.floor(remainingMs / 1000);
  return { formatted, isOvertime, percentLeft, label, isOpenTime: false, secsLeft };
}

// ── Single Table Card ──────────────────────────────────────────
function TableCard({ table }: { table: Table }) {
  const timer = getSessionTimer(table);
  const isAlert = !timer.isOvertime && !timer.isOpenTime && timer.secsLeft <= 900 && timer.secsLeft > 0;
  const alertPulseDuration = Math.max(0.8, (timer.secsLeft / 900) * 2.5) + 's';

  if (table.status === 'available') {
    return (
      <div className="relative bg-emerald-950/30 border-2 border-emerald-700/50 rounded-2xl p-5 flex flex-col items-center gap-3 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center">
          <span className="text-emerald-400 font-black text-lg">{table.name.replace('Table ', '')}</span>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">{table.name}</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-emerald-400 font-black text-lg">OPEN</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Walk-in Welcome</p>
        </div>
      </div>
    );
  }

  if (table.status === 'reserved') {
    return (
      <div className="bg-blue-950/30 border-2 border-blue-700/40 rounded-2xl p-5 flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
          <span className="text-blue-400 font-black text-lg">{table.name.replace('Table ', '')}</span>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">{table.name}</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-blue-300 font-black text-lg">RESERVED</span>
          </div>
          <p className="text-[11px] text-blue-600 mt-1">Pre-booked</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative border-2 rounded-2xl p-5 flex flex-col gap-3 overflow-hidden ${
      timer.isOvertime
        ? 'bg-rose-950/40 border-rose-600/60'
        : timer.isOpenTime ? 'bg-blue-950/20 border-blue-800/40' : 'bg-neutral-900/80 border-neutral-700/50'
    }`}>
      {timer.isOvertime && (
        <div className="absolute inset-0 bg-rose-500/15 pointer-events-none" style={{ animation: 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      )}
      {isAlert && (
        <div className="absolute inset-0 bg-amber-500/15 pointer-events-none" style={{ animation: `pulse ${alertPulseDuration} cubic-bezier(0.4, 0, 0.6, 1) infinite` }} />
      )}

      <div className="relative z-10 flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black">{table.name.replace('Table ', '')}</span>
        </div>
        <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
          timer.isOvertime
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            : timer.isOpenTime 
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
              : isAlert 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
        }`}>
          {timer.isOvertime ? '⚠ OVERTIME' : timer.isOpenTime ? 'OPEN TIME' : 'IN USE'}
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Customer</p>
        <p className="text-white font-bold text-sm mt-0.5 truncate">{table.session?.customerName || '—'}</p>
      </div>

      <div className="relative z-10 text-center">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
          {timer.isOvertime ? 'Overtime' : timer.isOpenTime ? 'Elapsed Time' : 'Time Left'}
        </p>
        <div className={`font-black text-4xl tabular-nums tracking-tight ${
          timer.isOvertime ? 'text-rose-400' : timer.isOpenTime ? 'text-blue-400' : isAlert ? 'text-amber-400' : 'text-white'
        }`}>
          {timer.isOvertime && '+'}{timer.formatted}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export function LiveMonitor() {
  const { tables, queue, reservations, refreshData } = useAppContext();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const localTimer = setInterval(() => setNow(new Date()), 1000);
    const dbFetcher = setInterval(() => refreshData(true), 5000);
    return () => {
      clearInterval(localTimer);
      clearInterval(dbFetcher);
    };
  }, [refreshData]);

  // Derived Waiting Lists
  const waitingQueue = queue.filter(q => q.status === 'waiting' || q.status === 'called');
  const todayReservations = reservations.filter(r => 
    isToday(new Date(r.date)) && (r.status === 'confirmed' || r.status === 'pending')
  ).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;
  
  const overtimeCount = tables.filter(t => {
    if (t.status !== 'occupied' || !t.session || t.session.durationMinutes <= 0) return false;
    const end = new Date(t.session.startTime).getTime() + t.session.durationMinutes * 60000;
    return now.getTime() > end;
  }).length;

  const getGraceTime = (startTime: Date) => {
    const elapsed = now.getTime() - new Date(startTime).getTime();
    const remaining = Math.max(0, (15 * 60 * 1000) - elapsed);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return { 
      formatted: `${mins}:${secs.toString().padStart(2, '0')}`,
      isUrgent: mins < 5
    };
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-none bg-black/60 border-b border-neutral-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950">
            <span className="text-white font-black text-base tracking-tight">1S</span>
          </div>
          <div>
            <p className="text-white font-black text-base tracking-tight leading-tight uppercase">One Shot Bar & Billiards</p>
            <p className="text-[11px] text-neutral-500 uppercase tracking-widest">Live Status & Waiting List</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white tabular-nums tracking-tight uppercase">
            {now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </p>
          <p className="text-[11px] text-neutral-500 uppercase">{format(now, 'EEEE, MMMM do, yyyy')}</p>
        </div>
      </header>

      {/* ── Summary ── */}
      <div className="flex-none bg-neutral-900/50 border-b border-neutral-800/50 px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-sm font-semibold text-emerald-300">{availableCount} Available</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-sm font-semibold text-amber-300">{occupiedCount} In Use</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-sm font-semibold text-blue-300">{reservedCount} Reserved</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /><span className="text-sm font-semibold text-rose-300">{overtimeCount} Overtime</span></div>
      </div>

      {/* ── Main Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {tables.map(table => <TableCard key={table.id} table={table} />)}
          </div>
        </div>

        {/* ── Waiting Sidebar ── */}
        <div className="lg:w-96 flex-none border-l border-neutral-800/60 bg-neutral-950/60 flex flex-col">
          <div className="p-5 border-b border-neutral-800/40">
            <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2">
              <Users size={16} className="text-amber-500" /> Waiting List
            </h2>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-6">
            {/* 🗓️ RESERVATIONS */}
            <section className="space-y-3">
              <p className="text-[10px] text-neutral-500 uppercase font-black tracking-tighter flex items-center gap-2">
                <Calendar size={10}/> Today's Bookings
              </p>
              {todayReservations.length === 0 ? (
                <p className="text-[11px] text-neutral-700 italic">No reservations today.</p>
              ) : todayReservations.map(res => {
                const [h, m] = res.timeSlot.split(':').map(Number);
                const startTime = new Date(res.date);
                startTime.setHours(h, m, 0, 0);
                const isLate = now > startTime;
                const grace = isLate ? getGraceTime(startTime) : null;

                return (
                  <div key={res.id} className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3 flex justify-between items-center transition-all">
                    <div>
                      <p className="text-sm font-bold text-blue-100">{res.customerName}</p>
                      <p className="text-[10px] text-blue-400 font-semibold">{formatTimeSlot(res.timeSlot)} · {res.partySize} pax</p>
                    </div>
                    {grace ? (
                      <div className="text-right">
                        <p className={`text-xs font-mono font-black ${grace.isUrgent ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>{grace.formatted}</p>
                        <p className="text-[8px] text-neutral-500 uppercase font-bold">Expires</p>
                      </div>
                    ) : <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">Booked</span>}
                  </div>
                );
              })}
            </section>

            {/* 🚶 WALK-IN QUEUE */}
            <section className="space-y-3">
              <p className="text-[10px] text-neutral-500 uppercase font-black tracking-tighter flex items-center gap-2">
                <Users size={10}/> Walk-in Queue
              </p>
              {waitingQueue.length === 0 ? (
                <p className="text-[11px] text-neutral-700 italic">Queue is empty.</p>
              ) : waitingQueue.map((item, i) => {
                const grace = item.status === 'called' ? getGraceTime(item.arrivalTime) : null;
                return (
                  <div key={item.id} className={`p-3 rounded-xl border flex justify-between items-center transition-all ${item.status === 'called' ? 'bg-emerald-950/20 border-emerald-800/40 shadow-lg shadow-emerald-900/10' : 'bg-neutral-900/40 border-neutral-800'}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-black text-neutral-400">{i+1}</span>
                      <div>
                        <p className={`text-sm font-bold ${item.status === 'called' ? 'text-emerald-400' : 'text-neutral-200'}`}>{item.customerName}</p>
                        <p className="text-[10px] text-neutral-500">{item.partySize} pax</p>
                      </div>
                    </div>
                    {item.status === 'called' && grace && (
                      <div className="text-right">
                        <p className={`text-xs font-mono font-black ${grace.isUrgent ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>{grace.formatted}</p>
                        <p className="text-[8px] text-emerald-600/70 uppercase font-bold">Claim Table</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          </div>

          <div className="p-4 border-t border-neutral-800/40">
            <p className="text-[10px] text-neutral-600 text-center leading-relaxed">
              Customers have a **15-minute grace period** after being called or after their reservation time to claim their table before automatic removal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}