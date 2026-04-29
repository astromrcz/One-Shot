import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Table, QueueItem } from '../context/AppContext';
import { Clock, Users, X, Maximize2 } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────
function getSessionTimer(table: Table): {
  mm: string; ss: string; isOvertime: boolean; percentLeft: number; label: string; isOpenTime: boolean; secsLeft: number;
} {
  if (!table.session) return { mm: '--', ss: '--', isOvertime: false, percentLeft: 0, label: '', isOpenTime: false, secsLeft: 0 };
  const start = new Date(table.session.startTime).getTime();
  
  if (table.session.durationMinutes === 0) {
    const elapsed = Math.max(0, Date.now() - start);
    const mm = String(Math.floor(elapsed / 60000)).padStart(2, '0');
    const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
    return { mm, ss, isOvertime: false, percentLeft: 100, label: `${mm}:${ss} elapsed`, isOpenTime: true, secsLeft: 0 };
  }

  const totalMs = table.session.durationMinutes * 60000;
  const elapsed = Date.now() - start;
  const remaining = totalMs - elapsed;
  const isOvertime = remaining < 0;
  const abs = Math.abs(remaining);
  const mm = String(Math.floor(abs / 60000)).padStart(2, '0');
  const ss = String(Math.floor((abs % 60000) / 1000)).padStart(2, '0');
  const percentLeft = Math.max(0, Math.min(100, (remaining / totalMs) * 100));
  const label = isOvertime ? `+${mm}:${ss} Overtime` : `${mm}:${ss} remaining`;
  const secsLeft = Math.floor(remaining / 1000);
  return { mm, ss, isOvertime, percentLeft, label, isOpenTime: false, secsLeft };
}

function formatWaitTime(arrivalTime: Date, position: number): string {
  const avgMinutesPerTable = 60;
  const waitMinutes = position * avgMinutesPerTable;
  if (waitMinutes < 60) return `~${waitMinutes} min`;
  const h = Math.floor(waitMinutes / 60);
  const m = waitMinutes % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

// ── Single Table Card ──────────────────────────────────────────
function TableCard({ table, tick }: { table: Table; tick: number }) {
  const timer = getSessionTimer(table);
  const isAlert = !timer.isOvertime && !timer.isOpenTime && timer.secsLeft <= 900 && timer.secsLeft > 0;
  const alertPulseDuration = Math.max(0.4, (timer.secsLeft / 900) * 2.5) + 's';

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

  // Occupied
  return (
    <div className={`relative border-2 rounded-2xl p-5 flex flex-col gap-3 overflow-hidden ${
      timer.isOvertime
        ? 'bg-rose-950/40 border-rose-600/60'
        : timer.isOpenTime ? 'bg-blue-950/20 border-blue-800/40' : 'bg-neutral-900/80 border-neutral-700/50'
    }`}>
      {/* 🚨 DYNAMIC FLASHING OVERLAYS */}
      {timer.isOvertime && (
        <div className="absolute inset-0 bg-rose-500/15 pointer-events-none" style={{ animation: 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      )}
      {isAlert && (
        <div className="absolute inset-0 bg-amber-500/15 pointer-events-none" style={{ animation: `pulse ${alertPulseDuration} cubic-bezier(0.4, 0, 0.6, 1) infinite` }} />
      )}

      {/* Table number + customer */}
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
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
        }`}>
          {timer.isOvertime ? '⚠ OVERTIME' : timer.isOpenTime ? 'OPEN TIME' : 'IN USE'}
        </div>
      </div>

      {/* Customer name */}
      <div className="relative z-10">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Customer</p>
        <p className="text-white font-bold text-sm mt-0.5 truncate">{table.session?.customerName || '—'}</p>
      </div>

      {/* Countdown */}
      <div className="relative z-10 text-center">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
          {timer.isOvertime ? 'Overtime' : timer.isOpenTime ? 'Elapsed Time' : 'Time Left'}
        </p>
        <div className={`font-black text-4xl tabular-nums tracking-tight ${
          timer.isOvertime ? 'text-rose-400' : timer.isOpenTime ? 'text-blue-400' : isAlert ? 'text-amber-400' : 'text-white'
        }`}>
          {timer.mm}:{timer.ss}
        </div>

        {/* Progress bar */}
        {!timer.isOpenTime && (
          <div className="mt-2 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            {!timer.isOvertime && (
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timer.percentLeft < 15 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${timer.percentLeft}%` }}
              />
            )}
            {timer.isOvertime && (
              <div className="h-full w-full bg-rose-500/40 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Queue Row ──────────────────────────────────────────────────
function QueueRow({ item, position, onSeat }: { item: QueueItem; position: number, onSeat: () => void }) {
  return (
    <div 
      onClick={item.status === 'called' ? onSeat : undefined}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${item.status === 'called' ? 'cursor-pointer hover:bg-emerald-950/60' : ''} ${
      item.status === 'called'
        ? 'bg-emerald-950/40 border-emerald-700/40'
        : 'bg-neutral-900/60 border-neutral-800/60'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm ${
        item.status === 'called'
          ? 'bg-emerald-600 text-white'
          : position === 1
          ? 'bg-amber-600/20 border border-amber-600/40 text-amber-400'
          : 'bg-neutral-800 border border-neutral-700 text-neutral-400'
      }`}>
        {position}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${item.status === 'called' ? 'text-emerald-300' : 'text-white'}`}>
          {item.customerName}
        </p>
        <p className="text-[11px] text-neutral-500">{item.partySize} person{item.partySize > 1 ? 's' : ''}</p>
      </div>
      {item.status !== 'called' && (
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-semibold text-neutral-400">
            {formatWaitTime(item.arrivalTime, position)}
          </p>
          <p className="text-[10px] text-neutral-600">est. wait</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export function LiveMonitor() {
  const { tables, queue, refreshData } = useAppContext();
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // 1. FAST TICK: Updates the local UI every 1 second for perfectly smooth countdowns and clocks
    const localTimer = setInterval(() => {
      setNow(new Date());
      setTick(t => t + 1); // Forces the TableCards to re-calculate their remaining time instantly
    }, 1000);

    // 2. SLOW FETCH: Silently checks the database every 5 seconds for new reservations/queue members
    const dbFetcher = setInterval(() => {
      refreshData(true); 
    }, 5000);

    // Cleanup both timers if the page closes
    return () => {
      clearInterval(localTimer);
      clearInterval(dbFetcher);
    };
  }, []);

  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;

  const overtimeCount = tables.filter(t => {
    if (t.status !== 'occupied' || !t.session) return false;
    if (t.session.durationMinutes === 0) return false; // 🚨 FIXED: OPEN TIME IS NEVER OVERTIME
    const end = new Date(t.session.startTime).getTime() + t.session.durationMinutes * 60000;
    return Date.now() > end;
  }).length;

  const waitingQueue = queue.filter(q => q.status === 'waiting' || q.status === 'called');

  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col overflow-auto">
      {/* ── Header Bar ── */}
      <header className="flex-none bg-black/60 border-b border-neutral-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950">
            <span className="text-white font-black text-base tracking-tight">1S</span>
          </div>
          <div>
            <p className="text-white font-black text-base tracking-tight leading-tight">ONE SHOT BAR & BILLIARDS</p>
            <p className="text-[11px] text-neutral-500 uppercase tracking-widest">Live Table Status & Walk-in Queue</p>
          </div>
        </div>

        {/* Live clock */}
        <div className="text-right">
          <p className="text-2xl font-black text-white tabular-nums tracking-tight">{timeStr}</p>
          <p className="text-[11px] text-neutral-500">{dateStr}</p>
        </div>
      </header>

      {/* ── Status Summary Bar ── */}
      <div className="flex-none bg-neutral-900/50 border-b border-neutral-800/50 px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
          <span className="text-sm font-semibold text-emerald-300">{availableCount} Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-sm font-semibold text-amber-300">{occupiedCount} In Use</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-sm font-semibold text-blue-300">{reservedCount} Reserved</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
          <span className="text-sm font-semibold text-rose-300">{overtimeCount} Overtime</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-neutral-500 uppercase tracking-widest font-semibold">Live</span>
        </div>
      </div>

      {/* ── Main Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">

        {/* Tables Section */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-widest">Table Status</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {tables.map(table => (
              <TableCard key={table.id} table={table} tick={tick} />
            ))}
          </div>

          
        </div>

        {/* Queue Section */}
        <div className="lg:w-80 xl:w-96 flex-none border-t lg:border-t-0 lg:border-l border-neutral-800/60 bg-neutral-950/60 flex flex-col">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-800/40">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-widest">Walk-in Queue</h2>
            </div>
            <p className="text-[11px] text-neutral-600 pl-3.5">First Come, First Served</p>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {waitingQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-center">
                  <Users size={22} className="text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-emerald-400">No Queue</p>
                  <p className="text-[11px] text-neutral-600 mt-0.5">Walk right in — tables available!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {waitingQueue.map((item, i) => (
                  <QueueRow 
                    key={item.id} 
                    item={item} 
                    position={i + 1} 
                    onSeat={() => {
                      // Just navigate them directly to the table management page!
                      window.location.href = '/staff/tables';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Queue footer info */}
          <div className="p-4 border-t border-neutral-800/40">
            <p className="text-[10px] text-neutral-700 text-center leading-relaxed">
              Please see staff at the counter to<br />join the queue or for assistance.
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="flex-none bg-black/40 border-t border-neutral-800/50 px-6 py-2 flex items-center justify-between">
        <p className="text-[11px] text-neutral-700">Autobase OAX, San Juan, Cainta, Rizal · Mon–Sat 12PM–3AM · Sun 5PM–3AM</p>
        <a
          href="/staff"
          className="text-[11px] text-neutral-700 hover:text-neutral-500 transition-colors"
        >
          ← Staff Dashboard
        </a>
      </footer>
    </div>
  );
}