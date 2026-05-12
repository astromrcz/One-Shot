import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { TableCard } from '../components/TableCard';
import {
  Search, Play, Zap, X, UserPlus, Clock,
  Calendar, Users, CheckCircle, ChevronRight,
  CreditCard, Banknote, AlertTriangle, CircleCheck
} from 'lucide-react';
import { isToday, differenceInSeconds, addMinutes, format } from 'date-fns';
import { useSearchParams, useNavigate } from 'react-router'; 
import { toast } from 'sonner';

type FilterStatus = 'all' | 'available' | 'occupied' | 'reserved';
type PaymentMethod = 'gcash' | 'cash';
type PaymentStatus = 'paid' | 'partial' | 'unpaid';

const formatPHP = (amount: number) => `₱${(amount || 0).toFixed(2)}`;

const formatHHMMSS = (totalSeconds: number) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeSlot = (time24: string) => {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${m} ${ampm}`;
};

type CustomerSource =
  | { kind: 'queue';        id: string; name: string; partySize: number; contact: string; notes?: string }
  | { kind: 'reservation';  id: string; name: string; partySize: number; contact: string; durationHours: number; timeSlot: string; date?: Date };

export function Tables() {
  const { 
    tables, queue, reservations, staffUsers,
    assignTable, extendSession, freeTable,
    removeFromQueue, updateReservationStatus,
    rates
  } = useAppContext();
  
  const [searchParams] = useSearchParams(); 
  const navigate = useNavigate();            

  const [filter, setFilter]       = useState<FilterStatus>('all');
  const [search, setSearch]       = useState('');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [assigningTableId, setAssigningTableId] = useState<string | null>(null);
  const [extendingTableId, setExtendingTableId] = useState<string | null>(null);
  const [endingTableId,    setEndingTableId]    = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSource | null>(null);
  const [customerName,     setCustomerName]      = useState('');
  const [durationMinutes,  setDurationMinutes]   = useState(60);
  const [amountPaid,       setAmountPaid]        = useState('');

  const [extendMinutes,       setExtendMinutes]       = useState(60);
  const [extendPayStatus,     setExtendPayStatus]     = useState<PaymentStatus>('paid');
  const [extendPayMethod,     setExtendPayMethod]     = useState<PaymentMethod>('cash');
  const [extendPartialAmount, setExtendPartialAmount] = useState('');

  // 🚨 END SESSION / CHECKOUT STATES
  const [endPayMethod,     setEndPayMethod]     = useState<PaymentMethod>('cash');
  const [endCashReceived,  setEndCashReceived]  = useState<string>('');
  const [endGcashRef,      setEndGcashRef]      = useState('');
  const [endAdminPassword, setEndAdminPassword] = useState('');
  const [endAdminError,    setEndAdminError]    = useState('');

  const activeTables = tables.filter(t => t.isActive);
  const available = activeTables.filter(t => t.status === 'available').length;
  const occupied  = activeTables.filter(t => t.status === 'occupied').length;
  const reserved  = activeTables.filter(t => t.status === 'reserved').length;

  const filtered = activeTables.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = !search
      || t.name.toLowerCase().includes(search.toLowerCase())
      || (t.session?.customerName.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const waitingCustomers: CustomerSource[] = queue
    .filter(q => q.status === 'waiting' || q.status === 'called') 
    .map(q => ({ kind: 'queue', id: q.id, name: q.customerName, partySize: q.partySize, contact: q.contactNumber, notes: q.notes }));

  const todayReservations: CustomerSource[] = reservations
    .filter(r => (r.status === 'confirmed' || r.status === 'pending') && isToday(new Date(r.date)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => ({ kind: 'reservation', id: r.id, name: r.customerName, partySize: r.partySize, contact: r.contactNumber, durationHours: r.durationHours, timeSlot: r.timeSlot, date: r.date }));

  const allCustomers: CustomerSource[] = [...waitingCustomers, ...todayReservations];

  useEffect(() => {
    const assignTableId = searchParams.get('assignTable');
    const queueId = searchParams.get('queueId');
    const reservationId = searchParams.get('reservationId');

    if (assignTableId) {
      setAssigningTableId(assignTableId);
      if (queueId) {
        const c = waitingCustomers.find(c => c.id === queueId);
        if (c) {
          setSelectedCustomer(c);
          setCustomerName(c.name);
          setDurationMinutes(60);
          setAmountPaid(((60 / 60) * rates.hourlyRate).toFixed(2));
        }
      } else if (reservationId) {
        const matchingRes = reservations.find(r => r.id === reservationId);
        if (matchingRes) {
          setSelectedCustomer({ kind: 'reservation', id: matchingRes.id, name: matchingRes.customerName, partySize: matchingRes.partySize, contact: matchingRes.contactNumber, durationHours: matchingRes.durationHours, timeSlot: matchingRes.timeSlot, date: matchingRes.date });
          setCustomerName(matchingRes.customerName);
          setDurationMinutes(matchingRes.durationHours * 60);
          setAmountPaid(matchingRes.downPaymentPaid ? matchingRes.downPaymentAmount.toFixed(2) : '0.00');
        }
      }
      navigate('/staff/tables', { replace: true });
    }
  }, [searchParams, navigate, queue, reservations, rates.hourlyRate]);

  // CALCULATION LOGIC FOR ENDING TABLE
  const endInfo = (() => {
    const endingTable = tables.find(t => t.id === endingTableId);
    if (!endingTable?.session) return null;
    const { startTime, durationMinutes: bookedMins, amountPaid: alreadyPaid, hourlyRate } = endingTable.session;
    const elapsedSecs = Math.max(0, differenceInSeconds(now, new Date(startTime)));
    const elapsedMins = Math.ceil(elapsedSecs / 60);
    let bookedCharge = 0, overtimeCharge = 0, totalDue = 0, isOvertime = false, overtimeMins = 0, overtimeSecs = 0;

    if (bookedMins === 0) {
      const billableSecs = Math.max(elapsedSecs, 30 * 60); 
      totalDue = (billableSecs / 3600) * hourlyRate;
      bookedCharge = totalDue;
    } else if (bookedMins < 0) {
      const baseMins = Math.abs(bookedMins);
      const endTime = addMinutes(new Date(startTime), baseMins);
      bookedCharge = (Math.max(baseMins, now <= endTime ? baseMins : baseMins + Math.ceil(differenceInSeconds(now, endTime) / 60)) / 60) * hourlyRate;
      totalDue = bookedCharge;
    } else {
      const endTime = addMinutes(new Date(startTime), bookedMins);
      isOvertime = now > endTime;
      if (isOvertime) {
        overtimeSecs = differenceInSeconds(now, endTime);
        overtimeMins = Math.ceil(overtimeSecs / 60);
      }
      bookedCharge = (bookedMins / 60) * hourlyRate;
      overtimeCharge = (overtimeMins / 60) * hourlyRate;
      totalDue = bookedCharge + overtimeCharge;
    }
    const linkedRes = reservations.find(r => r.customerName === endingTable.session!.customerName && r.status === 'checked-in');
    const resFee = (linkedRes && linkedRes.downPaymentPaid) ? linkedRes.downPaymentAmount : 0;
    const totalAlreadyPaid = Math.max(alreadyPaid, resFee);
    
    const balance = Math.max(0, totalDue - totalAlreadyPaid);
    return { elapsedMins, elapsedSecs, alreadyPaid: totalAlreadyPaid, bookedCharge, overtimeCharge, totalDue, balance, isOvertime, overtimeMins, overtimeSecs, hasResFee: resFee > 0 };
  })();

  const changeDue = endInfo ? (parseFloat(endCashReceived || '0') - endInfo.balance) : 0;
  const isReadyToEnd = endInfo && (
    endInfo.balance <= 0 || 
    (endPayMethod === 'cash' ? parseFloat(endCashReceived || '0') >= endInfo.balance : endGcashRef.trim().length >= 8)
  );

  const openAssign = (tableId: string) => { setAssigningTableId(tableId); setSelectedCustomer(null); setCustomerName(''); setDurationMinutes(60); setAmountPaid(''); };
  const openEnd = (tableId: string) => { 
    setEndingTableId(tableId); 
    setEndPayMethod('cash'); 
    setEndCashReceived(''); 
    setEndGcashRef(''); 
    setEndAdminPassword(''); 
    setEndAdminError(''); 
  };
  const openExtend = (tableId: string) => { setExtendingTableId(tableId); setExtendMinutes(60); setExtendPayStatus('paid'); setExtendPayMethod('cash'); setExtendPartialAmount(''); };

  const pickCustomer = (c: CustomerSource) => {
    setSelectedCustomer(c);
    setCustomerName(c.name);
    const mins = c.kind === 'reservation' ? c.durationHours * 60 : 60;
    setDurationMinutes(mins);
    setAmountPaid(((mins / 60) * rates.hourlyRate).toFixed(2));
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTableId || !customerName) return;
    await assignTable(assigningTableId, { customerName, durationMinutes, startTime: new Date(), isPaid: true, hourlyRate: rates.hourlyRate, amountPaid: selectedCustomer?.kind === 'reservation' ? (parseFloat(amountPaid) || 0) : 0 });
    if (selectedCustomer?.kind === 'queue') await removeFromQueue(selectedCustomer.id);
    else if (selectedCustomer?.kind === 'reservation') await updateReservationStatus(selectedCustomer.id, 'checked-in');
    setAssigningTableId(null);
  };

  const handleConfirmEnd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!endingTableId || !endInfo) return;
    
    // Check Admin Password for early endings
    if (endInfo.elapsedMins < 30) {
      if (!staffUsers.some(u => (u.isAdmin || u.role?.toLowerCase() === 'admin') && u.password === endAdminPassword)) {
        setEndAdminError('Invalid admin password.');
        return;
      }
    }
    
    // Prevent ending if balance isn't resolved properly
    if (endInfo.balance > 0) {
      if (endPayMethod === 'cash' && changeDue < 0) {
        toast.error("Insufficient cash received.");
        return;
      }
      if (endPayMethod === 'gcash' && endGcashRef.trim().length < 8) {
        toast.error("Please enter a valid GCash Reference Number.");
        return;
      }
    }

    freeTable(endingTableId);
    toast.success("Table session completed and settled!");
    setEndingTableId(null);
  };

  const handleConfirmExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingTableId) return;
    if (extendMinutes === 0) {
      const activeTable = tables.find(t => t.id === extendingTableId);
      if (activeTable?.session && activeTable.session.durationMinutes > 0) await extendSession(extendingTableId, -(activeTable.session.durationMinutes * 2), 0);
    } else {
      await extendSession(extendingTableId, extendMinutes, extendPayStatus === 'paid' ? (extendMinutes / 60) * rates.hourlyRate : extendPayStatus === 'partial' ? parseFloat(extendPartialAmount) || 0 : 0);
    }
    setExtendingTableId(null);
  };

  const getNextReservation = (tableId: string) => {
    const upcoming = reservations.filter(r => r.tableId === tableId && (r.status === 'pending' || r.status === 'confirmed') && new Date(r.date) > now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming.length ? { date: new Date(upcoming[0].date), customerName: upcoming[0].customerName, timeSlot: upcoming[0].timeSlot } : null;
  };

  const PayMethodBtn = ({ value, current, icon: Icon, label, onChange }: { value: PaymentMethod; current: PaymentMethod; icon: any; label: string; onChange: (v: PaymentMethod) => void }) => (
    <button type="button" onClick={() => onChange(value)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${current === value ? (value === 'cash' ? 'bg-emerald-600/15 border-emerald-600 text-emerald-400' : 'bg-blue-600/15 border-blue-600 text-blue-400') : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}><Icon size={13} />{label}</button>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'Available', value: available, color: 'text-emerald-400' }, { label: 'Occupied', value: occupied, color: 'text-rose-400' }, { label: 'Reserved', value: reserved, color: 'text-amber-400' }].map(s => (
          <div key={s.label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input type="text" placeholder="Search tables or customers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[ { key: 'all', label: 'All', count: tables.length, color: 'bg-neutral-800 text-neutral-200 border-neutral-700' }, { key: 'available', label: 'Available', count: available, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }, { key: 'occupied', label: 'Occupied', count: occupied, color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' }, { key: 'reserved', label: 'Reserved', count: reserved, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' } ].map(b => (
            <button key={b.key} onClick={() => setFilter(b.key as FilterStatus)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${filter === b.key ? b.color : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'}`}>
              {b.label} <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${filter === b.key ? '' : 'bg-neutral-800'}`}>{b.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(table => (
          <div key={table.id} onClick={() => setSelectedTableId(table.id)} className={`cursor-pointer rounded-2xl transition-all ${selectedTableId === table.id ? 'ring-2 ring-emerald-500 shadow-lg scale-[1.02]' : 'ring-1 ring-transparent hover:ring-neutral-700'}`}>
            <TableCard table={table} onAssign={() => openAssign(table.id)} onExtend={() => openExtend(table.id)} onEnd={() => openEnd(table.id)} nextReservation={table.status === 'reserved' ? getNextReservation(table.id) : null} />
          </div>
        ))}
      </div>

      {/* MODALS (Assign, End, Extend) */}
      {assigningTableId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh]">
            <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center flex-none">
              <div><h2 className="text-base font-bold text-neutral-100">Start Session</h2><p className="text-xs text-neutral-500">{tables.find(t => t.id === assigningTableId)?.name} · ₱{rates.hourlyRate}/hour</p></div>
              <button onClick={() => setAssigningTableId(null)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {allCustomers.length > 0 && (
                <div className="px-6 pt-5 pb-4 border-b border-neutral-800/60">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5"><Users size={11} /> Assign Customer</p>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {allCustomers.map((c) => (
                      <button key={`${c.kind}-${c.id}`} type="button" onClick={() => pickCustomer(c)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${selectedCustomer?.id === c.id ? 'bg-emerald-600/15 border-emerald-600/50' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'}`}>
                        <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center"><Users size={11} className="text-neutral-400"/></div>
                        <div className="flex-1 truncate"><p className="text-sm font-semibold text-neutral-200">{c.name}</p><p className="text-[10px] text-neutral-500">{c.kind === 'reservation' ? `${c.timeSlot} Reservation` : 'Walk-in Queue'}</p></div>
                        {selectedCustomer?.id === c.id && <CheckCircle size={15} className="text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <form onSubmit={handleAssign} className="p-6 space-y-4">
                <input type="text" value={customerName} onChange={e => { setCustomerName(e.target.value); if (selectedCustomer) setSelectedCustomer(null); }} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/40" placeholder="Customer Name" required />
                <div className="grid grid-cols-3 gap-2">
                  {[0, 60, 120, 180, 240, 300].map(d => (
                    <button key={d} type="button" onClick={() => setDurationMinutes(d)} className={`py-2 rounded-xl border text-xs font-semibold ${durationMinutes === d ? 'bg-emerald-600/15 border-emerald-600 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}>{d === 0 ? 'Open' : `${d/60}h`}</button>
                  ))}
                </div>
                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setAssigningTableId(null)} className="flex-1 py-2.5 bg-neutral-800 text-neutral-300 rounded-xl text-sm">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg">Start Session</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 REVISED END SESSION / CHECKOUT MODAL 🚨 */}
      {endingTableId && endInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 flex-none">
              <div>
                <h2 className="text-base font-bold text-neutral-100">End Session</h2>
                <p className="text-xs text-neutral-500">Checkout & Receipt Summary</p>
              </div>
              <button onClick={() => setEndingTableId(null)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={16} /></button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              
              {/* Summary Box */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
                 <div className="flex justify-between text-sm"><span className="text-neutral-400">Total Due</span><span className="text-white font-semibold">{formatPHP(endInfo.totalDue)}</span></div>
                 <div className="flex justify-between text-sm"><span className="text-neutral-400">Paid Balance</span><span className="text-emerald-400 font-semibold">- {formatPHP(endInfo.alreadyPaid)}</span></div>
                 <div className="w-full h-px bg-neutral-800 my-2" />
                 <div className="flex justify-between text-lg font-black"><span className="text-neutral-200">Balance Due</span><span className="text-amber-400">{formatPHP(endInfo.balance)}</span></div>
              </div>

              {/* Admin Check for early ending */}
              {endInfo.elapsedMins < 30 && (
                <div className="bg-rose-950/20 border border-rose-900/50 p-4 rounded-xl">
                  <p className="text-xs text-rose-400 font-bold mb-2 flex items-center gap-1.5"><AlertTriangle size={14}/> Admin Authorization Required</p>
                  <p className="text-[10px] text-rose-400/80 mb-3">Sessions under 30 minutes require an admin password to end early.</p>
                  <input type="password" value={endAdminPassword} onChange={e => setEndAdminPassword(e.target.value)} className="w-full bg-neutral-900 border border-rose-900/50 focus:border-rose-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" placeholder="Enter Admin Password" />
                  {endAdminError && <p className="text-[10px] text-rose-500 mt-1.5">{endAdminError}</p>}
                </div>
              )}

              {/* Payment Section (only if they owe money) */}
              {endInfo.balance > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Payment Method</label>
                    <div className="flex gap-2">
                      <PayMethodBtn value="cash" current={endPayMethod} icon={Banknote} label="Cash" onChange={setEndPayMethod} />
                      <PayMethodBtn value="gcash" current={endPayMethod} icon={CreditCard} label="GCash" onChange={setEndPayMethod} />
                    </div>
                  </div>

                  {endPayMethod === 'cash' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1.5">Cash Received</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">₱</span>
                          <input type="number" min={endInfo.balance} value={endCashReceived} onChange={e => setEndCashReceived(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" placeholder="0.00" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1.5">Change Due</label>
                        <div className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-400 font-mono flex items-center h-[38px]">
                          ₱{changeDue >= 0 ? changeDue.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}
                        </div>
                      </div>
                    </div>
                  ) : (
                     <div>
                        <label className="block text-xs text-neutral-400 mb-1.5">GCash Reference No.</label>
                        <input type="text" value={endGcashRef} onChange={e => setEndGcashRef(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="Enter Reference Number" />
                     </div>
                  )}
                </div>
              )}

            </div>
            <div className="p-4 border-t border-neutral-800 bg-neutral-900/30 flex gap-3 flex-none">
              <button type="button" onClick={() => setEndingTableId(null)} className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">Cancel</button>
              <button type="button" onClick={() => handleConfirmEnd()}
                disabled={(endInfo.elapsedMins < 30 && !endAdminPassword) || !isReadyToEnd}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-sm rounded-xl font-semibold transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2">
                <CheckCircle size={15} /> Finalize & End
              </button>
            </div>
          </div>
        </div>
      )}

      {extendingTableId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-100">Extend Session</h2>
            <div className="grid grid-cols-2 gap-2">
              {[0, 60, 90, 120].map(d => (
                <button key={d} type="button" onClick={() => setExtendMinutes(d)} className={`py-2.5 rounded-lg border text-xs font-semibold ${extendMinutes === d ? 'bg-amber-600/15 border-amber-600 text-amber-400' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}>{d === 0 ? 'Open Time' : `+${d/60}h`}</button>
              ))}
            </div>
            <div className="flex gap-3 pt-2"><button onClick={() => setExtendingTableId(null)} className="flex-1 py-2.5 bg-neutral-800 text-neutral-300 rounded-xl">Cancel</button><button onClick={handleConfirmExtend} className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-bold">Confirm</button></div>
          </div>
        </div>
      )}
    </div>
  );
}