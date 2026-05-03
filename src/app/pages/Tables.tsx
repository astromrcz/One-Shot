import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { TableCard } from '../components/TableCard';
import {
  Search, Play, Zap, X, UserPlus, Clock,
  Calendar, Users, CheckCircle, ChevronRight,
  CreditCard, Banknote, AlertTriangle, CircleCheck,
  ShoppingCart
} from 'lucide-react';
import { isToday, differenceInSeconds, addMinutes, format } from 'date-fns';
import { useSearchParams, useNavigate } from 'react-router'; 

// 🚨 POS HARDCODED MENU
const POS_MENU = [
  { id: 'm1', name: 'San Miguel Pale', price: 80, category: 'Drinks' },
  { id: 'm2', name: 'Red Horse', price: 85, category: 'Drinks' },
  { id: 'm3', name: 'Nachos Platter', price: 150, category: 'Snacks' },
  { id: 'm4', name: 'French Fries', price: 120, category: 'Snacks' },
];

type FilterStatus = 'all' | 'available' | 'occupied' | 'reserved';
type PaymentMethod = 'gcash' | 'cash';
type PaymentStatus = 'paid' | 'partial' | 'unpaid';

const formatPHP = (amount: number) => `₱${(amount || 0).toFixed(2)}`;

// Formats seconds into strictly HH:MM:SS
const formatHHMMSS = (totalSeconds: number) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Formats 24-hour time to 12-hour AM/PM
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
    addOrderToTable, removeOrderFromTable,
    rates
  } = useAppContext();
  
  const [searchParams] = useSearchParams(); 
  const navigate = useNavigate();           

  const [filter, setFilter]       = useState<FilterStatus>('all');
  const [search, setSearch]       = useState('');
  
  const [selectedPosTableId, setSelectedPosTableId] = useState<string | null>(null);
  const [voidOrderId, setVoidOrderId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [voidError, setVoidError] = useState('');

  // Global tick to make POS Sidebar & Modals live update every second
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleConfirmVoid = async () => {
    const isAdminValid = staffUsers.some(u => (u.isAdmin || u.role?.toLowerCase() === 'admin') && u.password === adminPassword);
    if (!isAdminValid) {
      setVoidError('Invalid admin password.');
      return;
    }
    if (selectedPosTableId && voidOrderId) {
      if (voidOrderId === 'OPEN_TIME_CONVERSION') {
        const activeTable = tables.find(t => t.id === selectedPosTableId);
        if (activeTable?.session && activeTable.session.durationMinutes < 0) {
          await assignTable(activeTable.id, {
            ...activeTable.session,
            durationMinutes: Math.abs(activeTable.session.durationMinutes)
          });
        }
      } else {
        await removeOrderFromTable(selectedPosTableId, voidOrderId);
      }
    }
    setVoidOrderId(null);
    setAdminPassword('');
    setVoidError('');
  };

  const handleAddOrder = async (menuItem: typeof POS_MENU[0]) => {
    if (!selectedPosTableId) return;
    const order = {
      id: Date.now().toString(),
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1,
      timestamp: new Date()
    };
    await addOrderToTable(selectedPosTableId, order);
  };

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

  const [endPayStatus,     setEndPayStatus]     = useState<PaymentStatus>('paid');
  const [endPayMethod,     setEndPayMethod]     = useState<PaymentMethod>('cash');
  const [endPartialAmount, setEndPartialAmount] = useState('');
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

  // 🚨 SMART CAPACITY ENGINE
  // Mathematically checks if extending/assigning a table will steal a slot from a future reservation
  const checkCapacityConflict = (targetTableId: string, proposedEnd: Date, isAssigningResId?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const pendingRes = reservations.filter(r => 
      (r.status === 'pending' || r.status === 'confirmed') && 
      r.id !== isAssigningResId && 
      new Date(r.date).toISOString().split('T')[0] === todayStr
    );

    // 1. Direct Table Conflict (If this specific table is pre-reserved)
    const specificConflict = pendingRes.find(r => r.tableId === targetTableId);
    if (specificConflict) {
      const specStart = new Date(specificConflict.date);
      const [sh, sm] = specificConflict.timeSlot.split(':').map(Number);
      specStart.setHours(sh, sm, 0, 0);
      if (proposedEnd > specStart) {
        return { safe: false, conflictTime: specificConflict.timeSlot, reason: 'Specific Table Reserved' };
      }
    }

    // 2. Global Capacity Conflict (Are we running out of tables for Walk-ins vs Reservations?)
    for (const res of pendingRes) {
      const resStart = new Date(res.date);
      const [h, m] = res.timeSlot.split(':').map(Number);
      resStart.setHours(h, m, 0, 0);

      const checkTime = resStart < now ? now : resStart;

      let occupiedCount = 0;
      for (const t of activeTables) {
        if (t.id === targetTableId) {
          if (proposedEnd > checkTime) occupiedCount++;
        } else if (t.session) {
          const tEnd = t.session.durationMinutes <= 0 
            ? addMinutes(new Date(t.session.startTime), 12 * 60) 
            : addMinutes(new Date(t.session.startTime), Math.abs(t.session.durationMinutes));
          if (tEnd > checkTime) occupiedCount++;
        }
      }

      const overlappingRes = pendingRes.filter(other => {
        const oStart = new Date(other.date);
        const [oh, om] = other.timeSlot.split(':').map(Number);
        oStart.setHours(oh, om, 0, 0);
        const oEnd = addMinutes(oStart, other.durationHours * 60);
        
        const targetTime = oStart < now ? now : oStart;
        return targetTime <= checkTime && oEnd > checkTime;
      }).length;

      const availableCount = activeTables.length - occupiedCount;
      if (availableCount < overlappingRes) {
        return { safe: false, conflictTime: res.timeSlot, reason: 'Global Capacity Reached' };
      }
    }
    return { safe: true };
  };

  useEffect(() => {
    const assignTableId = searchParams.get('assignTable');
    const queueId = searchParams.get('queueId');
    const reservationId = searchParams.get('reservationId');

    if (assignTableId) {
      setAssigningTableId(assignTableId);
      
      if (queueId) {
        const matchingQueueCustomer = waitingCustomers.find(c => c.id === queueId);
        if (matchingQueueCustomer) {
          setSelectedCustomer(matchingQueueCustomer);
          setCustomerName(matchingQueueCustomer.name);
          setDurationMinutes(60);
          setAmountPaid(((60 / 60) * rates.hourlyRate).toFixed(2));
        }
      } else if (reservationId) {
        const matchingRes = reservations.find(r => r.id === reservationId);
        if (matchingRes) {
          const resSource: CustomerSource = {
            kind: 'reservation', 
            id: matchingRes.id, 
            name: matchingRes.customerName, 
            partySize: matchingRes.partySize, 
            contact: matchingRes.contactNumber, 
            durationHours: matchingRes.durationHours, 
            timeSlot: matchingRes.timeSlot,
            date: matchingRes.date
          };
          setSelectedCustomer(resSource);
          setCustomerName(matchingRes.customerName);
          const mins = matchingRes.durationHours * 60;
          setDurationMinutes(mins);
          
          const advance = matchingRes.downPaymentPaid ? matchingRes.downPaymentAmount : 0;
          setAmountPaid(advance > 0 ? advance.toFixed(2) : '0.00');
        }
      }
      navigate('/staff/tables', { replace: true });
    }
  }, [searchParams, navigate, queue, reservations, rates.hourlyRate]);

  const endingTable = tables.find(t => t.id === endingTableId);
  const getEndSessionInfo = () => {
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
      if (now <= endTime) {
        totalDue = (baseMins / 60) * hourlyRate;
        bookedCharge = totalDue;
      } else {
        const extraMins = Math.ceil(differenceInSeconds(now, endTime) / 60);
        totalDue = ((baseMins + extraMins) / 60) * hourlyRate;
        bookedCharge = totalDue;
      }
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
    
    return { 
      elapsedMins, elapsedSecs, alreadyPaid: totalAlreadyPaid, bookedCharge, overtimeCharge, 
      totalDue, balance, isOvertime, overtimeMins, overtimeSecs, hasResFee: resFee > 0 
    };
  };
  const endInfo = getEndSessionInfo();

  const extendingTable = tables.find(t => t.id === extendingTableId);
  const extendCharge = (extendMinutes / 60) * rates.hourlyRate;

  let currentOvertimeSecs = 0;
  if (extendingTable?.session && extendingTable.session.durationMinutes > 0) {
    const endTime = addMinutes(new Date(extendingTable.session.startTime), extendingTable.session.durationMinutes);
    if (now > endTime) {
      currentOvertimeSecs = differenceInSeconds(now, endTime);
    }
  }

  const handleSetOpenTime = async () => {
    if (!selectedPosTableId) return;
    const activeTable = tables.find(t => t.id === selectedPosTableId);
    if (!activeTable || !activeTable.session || activeTable.session.durationMinutes <= 0) return;

    const currentMins = activeTable.session.durationMinutes;
    await extendSession(selectedPosTableId, -(currentMins * 2), 0);
  };

  const openAssign = (tableId: string) => {
    setAssigningTableId(tableId);
    setSelectedCustomer(null);
    setCustomerName('');
    setDurationMinutes(60);
    setAmountPaid('');
  };

  const openEnd = (tableId: string) => {
    setEndingTableId(tableId);
    setEndPayStatus('paid');
    setEndPayMethod('cash');
    setEndPartialAmount('');
    setEndGcashRef('');
    setEndAdminPassword(''); 
    setEndAdminError('');    
  };

  const openExtend = (tableId: string) => {
    setExtendingTableId(tableId);
    setExtendMinutes(60);
    setExtendPayStatus('paid');
    setExtendPayMethod('cash');
    setExtendPartialAmount('');
  };

  const pickCustomer = (c: CustomerSource) => {
    setSelectedCustomer(c);
    setCustomerName(c.name);
    if (c.kind === 'reservation') {
      const mins = c.durationHours * 60;
      setDurationMinutes(mins);
      setAmountPaid(((mins / 60) * rates.hourlyRate).toFixed(2));
    } else {
      setAmountPaid(((durationMinutes / 60) * rates.hourlyRate).toFixed(2));
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTableId || !customerName) return;
    
    const finalAmountPaid = selectedCustomer?.kind === 'reservation' 
      ? (parseFloat(amountPaid) || 0) 
      : 0;
    
    await assignTable(assigningTableId, {
      customerName, durationMinutes, startTime: new Date(), isPaid: true,
      hourlyRate: rates.hourlyRate, amountPaid: finalAmountPaid,
    });

    if (selectedCustomer) {
      if (selectedCustomer.kind === 'queue') {
        await removeFromQueue(selectedCustomer.id);
      } else if (selectedCustomer.kind === 'reservation') {
        await updateReservationStatus(selectedCustomer.id, 'checked-in');
      }
    }

    setAssigningTableId(null);
    setSelectedCustomer(null);
    setCustomerName('');
    setDurationMinutes(60);
    setAmountPaid('');
  };

  const handleConfirmEnd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!endingTableId || !endInfo) return;
    
    if (endInfo.elapsedMins < 30) {
      const isAdminValid = staffUsers.some(u => (u.isAdmin || u.role?.toLowerCase() === 'admin') && u.password === endAdminPassword);
      if (!isAdminValid) {
        setEndAdminError('Invalid admin password.');
        return;
      }
    }

    if (endPayMethod === 'gcash' && endPayStatus !== 'unpaid' && endInfo.balance > 0 && !endGcashRef) return;
    
    freeTable(endingTableId);
    setEndingTableId(null);
  };

  const handleConfirmExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingTableId) return;

    if (extendMinutes === 0) {
      const activeTable = tables.find(t => t.id === extendingTableId);
      if (activeTable && activeTable.session && activeTable.session.durationMinutes > 0) {
        const currentMins = activeTable.session.durationMinutes;
        await extendSession(extendingTableId, -(currentMins * 2), 0);
      }
      setExtendingTableId(null);
      return;
    }

    const charge = extendPayStatus === 'paid' ? extendCharge : extendPayStatus === 'partial' ? parseFloat(extendPartialAmount) || 0 : 0;
    await extendSession(extendingTableId, extendMinutes, charge);
    setExtendingTableId(null);
  };

  const getNextReservation = (tableId: string) => {
    const upcoming = reservations
      .filter(r => r.tableId === tableId && (r.status === 'pending' || r.status === 'confirmed') && new Date(r.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (!upcoming.length) return null;
    const r = upcoming[0];
    return { date: new Date(r.date), customerName: r.customerName, timeSlot: r.timeSlot };
  };

  const filterBtns: { key: FilterStatus; label: string; count: number; color: string }[] = [
    { key: 'all',       label: 'All',       count: tables.length, color: 'bg-neutral-800 text-neutral-200 border-neutral-700' },
    { key: 'available', label: 'Available', count: available,     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { key: 'occupied',  label: 'Occupied',  count: occupied,      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    { key: 'reserved',  label: 'Reserved',  count: reserved,      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  ];

  const durationOptions = [0, 60, 120, 180, 240, 300]; 
  const extendOptions   = [0, 60, 90, 120]; 

  const PayStatusBtn = ({ value, current, label, onChange }: { value: PaymentStatus; current: PaymentStatus; label: string; onChange: (v: PaymentStatus) => void }) => (
    <button
      type="button" onClick={() => onChange(value)}
      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
        current === value
          ? value === 'paid'    ? 'bg-emerald-600/15 border-emerald-600 text-emerald-400'
          : value === 'partial' ? 'bg-amber-600/15 border-amber-600 text-amber-400'
          :                       'bg-rose-600/15 border-rose-600 text-rose-400'
          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
      }`}
    >
      {label}
    </button>
  );

  const PayMethodBtn = ({ value, current, icon: Icon, label, onChange }: { value: PaymentMethod; current: PaymentMethod; icon: any; label: string; onChange: (v: PaymentMethod) => void }) => (
    <button
      type="button" onClick={() => onChange(value)}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
        current === value
          ? 'bg-emerald-600/15 border-emerald-600 text-emerald-400'
          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Available', value: available, color: 'text-emerald-400' },
          { label: 'Occupied',  value: occupied,  color: 'text-rose-400' },
          { label: 'Reserved',  value: reserved,  color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text" placeholder="Search tables or customers..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterBtns.map(b => (
            <button key={b.key} onClick={() => setFilter(b.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                filter === b.key ? b.color : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {b.label}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${filter === b.key ? '' : 'bg-neutral-800'}`}>{b.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid and POS */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(table => (
              <div 
                key={table.id} onClick={() => setSelectedPosTableId(table.id)} 
                className={`cursor-pointer rounded-2xl transition-all ${
                  selectedPosTableId === table.id ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-900/20 scale-[1.02]' : 'ring-1 ring-transparent hover:ring-neutral-700'
                }`}
              >
                <TableCard
                  table={table} onAssign={() => openAssign(table.id)} onExtend={() => openExtend(table.id)}
                  onEnd={() => openEnd(table.id)} nextReservation={table.status === 'reserved' ? getNextReservation(table.id) : null}
                />
              </div>
            ))}
          </div>
        </div>

        {/* POS SIDEBAR */}
        <div className="w-full xl:w-[340px] flex-none bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sticky top-6 flex flex-col max-h-[calc(100vh-48px)]">
          {(() => {
            if (!selectedPosTableId) {
              return (
                <>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-800">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2"><ShoppingCart size={16} className="text-emerald-500" /> Quick Sale POS</h2>
                  </div>
                  <div className="flex-1 flex items-center justify-center text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl p-6">Click on any active table card to open the POS system and add orders.</div>
                </>
              );
            }

            const activeTable = tables.find(t => t.id === selectedPosTableId);
            const session = activeTable?.session;

            if (!session) {
              return (
                <>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-800">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2"><ShoppingCart size={16} className="text-emerald-500" /> POS: {activeTable?.name || 'Table'}</h2>
                    <button onClick={() => setSelectedPosTableId(null)} className="text-neutral-500 hover:text-rose-400"><X size={16}/></button>
                  </div>
                  <div className="flex-1 flex items-center justify-center text-center text-xs text-amber-500 border border-dashed border-amber-900/30 bg-amber-950/10 rounded-xl p-6">Table {activeTable?.name} is currently inactive. Start a session to add items to their bill.</div>
                </>
              );
            }

            let tableCost = 0;
            let overtimeCost = 0;
            let overtimeSecs = 0;
            
            const elapsedSecs = Math.max(0, differenceInSeconds(now, new Date(session.startTime)));

            if (session.durationMinutes === 0) {
              const billableSecs = Math.max(elapsedSecs, 30 * 60);
              tableCost = (billableSecs / 3600) * session.hourlyRate;
            } else if (session.durationMinutes < 0) {
              const baseMins = Math.abs(session.durationMinutes);
              const endTime = addMinutes(new Date(session.startTime), baseMins);
              if (now <= endTime) {
                tableCost = (baseMins / 60) * session.hourlyRate;
              } else {
                const extraMins = Math.ceil(differenceInSeconds(now, endTime) / 60);
                tableCost = ((baseMins + extraMins) / 60) * session.hourlyRate;
              }
            } else {
              tableCost = (session.durationMinutes / 60) * session.hourlyRate;
              const endTime = addMinutes(new Date(session.startTime), session.durationMinutes);
              if (now > endTime) {
                overtimeSecs = differenceInSeconds(now, endTime);
                overtimeCost = (Math.ceil(overtimeSecs / 60) / 60) * session.hourlyRate;
              }
            }

            const ordersTotal = session.orders?.reduce((sum, o) => sum + (o.price * o.quantity), 0) || 0;
            const grandTotal = tableCost + overtimeCost + ordersTotal;

            return (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-800 flex-none">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShoppingCart size={16} className="text-emerald-500" /> {activeTable.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-emerald-400 font-semibold max-w-[100px] truncate" title={session.customerName}>{session.customerName}</span>
                    <button onClick={() => setSelectedPosTableId(null)} className="text-neutral-500 hover:text-rose-400"><X size={16}/></button>
                  </div>
                </div>

                <div className="flex-none mb-3">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-2">Quick Add Menu</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {POS_MENU.map(item => (
                      <button key={item.id} onClick={() => handleAddOrder(item)} className="bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 rounded-lg p-2 text-left transition-colors flex flex-col group relative overflow-hidden">
                        <span className="text-[11px] font-semibold text-neutral-300 truncate w-full group-hover:text-emerald-300">{item.name}</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-neutral-500">₱{item.price.toFixed(2)}</span>
                          <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 group-hover:text-emerald-400 transition-colors">Add +</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <p className="flex-none text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-1.5">Current Bill</p>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 mb-3 min-h-0 custom-scrollbar">
                  <div className="flex justify-between items-start bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-800">
                    <div>
                      <p className="text-[11px] text-neutral-300 font-semibold">Table Time <span className="font-mono text-emerald-400 ml-1">({formatHHMMSS(elapsedSecs)})</span></p>
                      <p className="text-[9px] text-neutral-500">@ ₱{session.hourlyRate.toFixed(2)}/hr</p>
                    </div>
                    <span className="text-[11px] font-bold text-neutral-200">₱{tableCost.toFixed(2)}</span>
                  </div>

                  {overtimeSecs > 0 && (
                    <div className="flex justify-between items-start bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-900/30">
                      <div>
                        <p className="text-[11px] text-amber-500 font-semibold flex items-center gap-1"><AlertTriangle size={10} /> Overtime <span className="font-mono ml-0.5">({formatHHMMSS(overtimeSecs)})</span></p>
                        <p className="text-[9px] text-amber-500/70">@ ₱{session.hourlyRate.toFixed(2)}/hr</p>
                      </div>
                      <span className="text-[11px] font-bold text-amber-500">₱{overtimeCost.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {session.orders?.map(o => (
                    <div key={o.id} className="flex justify-between items-center bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 group">
                      <p className="text-[11px] text-neutral-300 font-semibold"><span className="text-neutral-500 mr-1.5">{o.quantity}x</span>{o.name}</p>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-bold text-neutral-200">₱{(o.price * o.quantity).toFixed(2)}</span>
                        <button type="button" onClick={() => setVoidOrderId(o.id)} className="px-1.5 py-0.5 bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 border border-rose-900/50 rounded text-[9px] font-bold uppercase tracking-wider transition-colors">Void</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex-none border-t border-neutral-800 pt-3 bg-neutral-900 shadow-[0_-10px_20px_-5px_rgba(23,23,23,0.8)] z-10">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span>Subtotal</span><span>₱{grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-amber-500">
                      <span>Less: Advance</span><span>- ₱{session.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-emerald-400 mt-2 pt-2 border-t border-neutral-800/50">
                      <span>AMOUNT DUE</span><span>₱{Math.max(0, grandTotal - session.amountPaid).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-800 border-dashed flex-wrap">
                    {session.durationMinutes > 0 ? (
                      <>
                        <button 
                          onClick={async () => {
                            const capacityCheck = checkCapacityConflict(activeTable.id, addMinutes(now, 12 * 60));
                            if (!capacityCheck.safe) {
                               toast.error("Capacity Conflict", { description: `Cannot convert to Open Time. We need this table for a reservation at ${formatTimeSlot(capacityCheck.conflictTime!)}.` });
                               return;
                            }
                            handleSetOpenTime();
                          }} 
                          className="w-full mb-1 bg-blue-950/30 hover:bg-blue-900/40 text-blue-500 border border-blue-900/50 hover:border-blue-700/50 py-2 rounded-lg text-[11px] font-semibold transition-colors flex justify-center items-center gap-1.5"
                        >
                          <Clock size={13} /> Change to Open Time
                        </button>
                        <button onClick={() => openExtend(activeTable.id)} className="flex-1 bg-amber-950/30 hover:bg-amber-900/40 text-amber-500 border border-amber-900/50 hover:border-amber-700/50 py-2 rounded-lg text-[11px] font-semibold transition-colors flex justify-center items-center gap-1.5">
                          <Zap size={13} /> Extend
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between bg-blue-950/10 py-1.5 px-3 rounded-lg border border-blue-900/20 mb-2">
                        <span className="text-[10px] text-blue-500/80 font-semibold">Session is on Open Time</span>
                        {session.durationMinutes < 0 && (
                          <button type="button" onClick={() => setVoidOrderId('OPEN_TIME_CONVERSION')} className="px-2 py-0.5 bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 border border-rose-900/50 rounded text-[9px] font-bold uppercase tracking-wider transition-colors">
                            Void
                          </button>
                        )}
                      </div>
                    )}
                    <button onClick={() => openEnd(activeTable.id)} className="flex-1 bg-rose-950/30 hover:bg-rose-900/40 text-rose-500 border border-rose-900/50 hover:border-rose-700/50 py-2 rounded-lg text-[11px] font-semibold transition-colors flex justify-center items-center gap-1.5">
                      <CheckCircle size={13} /> End Session
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* START SESSION MODAL */}
      {assigningTableId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh]">
            <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center flex-none">
              <div>
                <h2 className="text-base font-bold text-neutral-100">Start Session</h2>
                <p className="text-xs text-neutral-500">{tables.find(t => t.id === assigningTableId)?.name} · ₱{rates.hourlyRate}/hour</p>
              </div>
              <button onClick={() => setAssigningTableId(null)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {allCustomers.length > 0 && (
                <div className="px-6 pt-5 pb-4 border-b border-neutral-800/60">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
                    <Users size={11} /> Assign to Waiting Customer
                  </p>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {waitingCustomers.length > 0 && (
                      <>
                        <p className="text-[10px] text-amber-500/80 uppercase tracking-wider font-semibold flex items-center gap-1.5 mt-1">
                          <UserPlus size={10} /> Walk-in Queue ({waitingCustomers.length})
                        </p>
                        {waitingCustomers.map((c, i) => (
                          <button key={`queue-${c.id}`} type="button" onClick={() => pickCustomer(c)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                              selectedCustomer?.id === c.id && selectedCustomer.kind === 'queue' ? 'bg-emerald-600/15 border-emerald-600/50' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                              i === 0 ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-neutral-800 border border-neutral-700 text-neutral-400'
                            }`}>{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-neutral-200 truncate">{c.name}</p>
                              <p className="text-[11px] text-neutral-500">{c.partySize} {c.partySize === 1 ? 'person' : 'people'}{c.notes ? ` · ${c.notes}` : ''}</p>
                            </div>
                            {selectedCustomer?.id === c.id && selectedCustomer.kind === 'queue'
                              ? <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                              : <ChevronRight size={14} className="text-neutral-600 flex-shrink-0" />}
                          </button>
                        ))}
                      </>
                    )}
                    {todayReservations.length > 0 && (
                      <>
                        <p className="text-[10px] text-blue-400/80 uppercase tracking-wider font-semibold flex items-center gap-1.5 mt-2">
                          <Calendar size={10} /> Today's Reservations ({todayReservations.length})
                        </p>
                        {todayReservations.map(c => (
                          <button key={`res-${c.id}`} type="button" onClick={() => pickCustomer(c)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                              selectedCustomer?.id === c.id && selectedCustomer.kind === 'reservation' ? 'bg-emerald-600/15 border-emerald-600/50' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                              <Calendar size={11} className="text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-neutral-200 truncate">{c.name}</p>
                              <p className="text-[11px] text-neutral-500">{c.timeSlot} · {c.durationHours}h · {c.partySize} {c.partySize === 1 ? 'person' : 'people'}</p>
                            </div>
                            {selectedCustomer?.id === c.id && selectedCustomer.kind === 'reservation'
                              ? <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                              : <ChevronRight size={14} className="text-neutral-600 flex-shrink-0" />}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-px bg-neutral-800" />
                    <span className="text-[10px] text-neutral-600 uppercase tracking-wider">or walk-in</span>
                    <div className="flex-1 h-px bg-neutral-800" />
                  </div>
                </div>
              )}

              <form onSubmit={handleAssign} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <UserPlus size={11} />{selectedCustomer ? 'Selected Customer' : 'Customer Name'}
                  </label>
                  <div className="relative">
                    <input type="text" value={customerName} onChange={e => { setCustomerName(e.target.value); if (selectedCustomer) setSelectedCustomer(null); }}
                      className={`w-full bg-neutral-900 border rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder-neutral-600 transition-colors ${
                        selectedCustomer ? 'border-emerald-600/40 bg-emerald-950/20' : 'border-neutral-800'
                      }`} placeholder="Enter customer name" required autoFocus={allCustomers.length === 0}
                    />
                    {selectedCustomer && (
                      <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerName(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  {selectedCustomer && (
                    <p className="text-[11px] text-emerald-500 flex items-center gap-1">
                      <CheckCircle size={10} />
                      {selectedCustomer.kind === 'queue' 
                        ? 'Assigned from walk-in queue' 
                        : `Assigned from reservation · ${(selectedCustomer as any).date && !isToday(new Date((selectedCustomer as any).date)) ? format(new Date((selectedCustomer as any).date), 'MMM d') : "Today"} @ ${formatTimeSlot((selectedCustomer as any).timeSlot)}`}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Clock size={11} /> Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {durationOptions.map(d => {
                      // 🚨 CAPACITY CHECK FOR ASSIGN BUTTONS
                      const proposedEnd = d <= 0 ? addMinutes(now, 12 * 60) : addMinutes(now, d);
                      const isSafe = checkCapacityConflict(assigningTableId, proposedEnd, selectedCustomer?.kind === 'reservation' ? selectedCustomer.id : undefined).safe;
                      
                      return (
                        <button key={d} type="button" disabled={!isSafe}
                          onClick={() => { setDurationMinutes(d); setAmountPaid(((d / 60) * rates.hourlyRate).toFixed(2)); }}
                          className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                            !isSafe ? 'opacity-30 cursor-not-allowed bg-neutral-900 border-neutral-800 text-neutral-600' :
                            durationMinutes === d ? 'bg-emerald-600/15 border-emerald-600 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >{d === 0 ? 'Open Time' : d < 60 ? `${d}m` : `${d / 60}h`}</button>
                      );
                    })}
                  </div>
                  {!checkCapacityConflict(assigningTableId, addMinutes(now, Math.max(...durationOptions)), selectedCustomer?.kind === 'reservation' ? selectedCustomer.id : undefined).safe && (
                    <p className="text-[10px] text-amber-500/90 flex gap-1 mt-1 font-medium"><AlertTriangle size={12}/> Some options are disabled to ensure tables are available for upcoming reservations.</p>
                  )}
                </div>

                {selectedCustomer?.kind === 'reservation' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Down Payment Settled (PHP)</label>
                    <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      placeholder={`₱${((durationMinutes / 60) * rates.hourlyRate * 0.25).toFixed(2)}`} step="0.01" />
                    <p className="text-[10px] text-neutral-600">Enter the advance payment collected for this reservation.</p>
                  </div>
                ) : (
                  <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 flex items-start gap-2">
                    <Clock size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-400">Pending Payment</p>
                      <p className="text-[10px] text-amber-500/70">Walk-in customers will settle their total bill at the end of the session.</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button 
                    type="button" 
                    onClick={() => {
                      setAssigningTableId(null);
                      setSelectedCustomer(null);
                      setCustomerName('');
                      setDurationMinutes(60);
                      setAmountPaid('');
                    }} 
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 font-semibold">
                    <Play size={14} /> Start Timer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* END SESSION MODAL */}
      {endingTableId && endingTable?.session && endInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center flex-none bg-rose-950/20">
              <div>
                <h2 className="text-base font-bold text-neutral-100">End Session</h2>
                <p className="text-xs text-neutral-500">{endingTable.name} · {endingTable.session.customerName}</p>
              </div>
              <button onClick={() => setEndingTableId(null)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-3">Session Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Customer</span><span className="text-neutral-200 font-semibold">{endingTable.session.customerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Booked Duration</span>
                  <span className="text-neutral-200 font-mono">
                    {endingTable.session.durationMinutes === 0 ? 'Open Time' : 
                     endingTable.session.durationMinutes < 0 ? `Converted Open Time (${formatHHMMSS(Math.abs(endingTable.session.durationMinutes) * 60)} Base)` : 
                     formatHHMMSS(endingTable.session.durationMinutes * 60)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-neutral-800/50 mt-1 pt-1">
                  <span className="text-neutral-400">Total Elapsed</span>
                  <span className="text-neutral-200 font-mono">{formatHHMMSS(endInfo.elapsedSecs)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-neutral-400">Booked Charge</span><span className="text-neutral-200">{formatPHP(endInfo.bookedCharge)}</span>
                </div>
                {endInfo.isOvertime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={12} /> Overtime <span className="font-mono text-xs">({formatHHMMSS(endInfo.overtimeSecs)})</span></span>
                    <span className="text-amber-400 font-semibold">+{formatPHP(endInfo.overtimeCharge)}</span>
                  </div>
                )}
                <div className="border-t border-neutral-800 pt-2 mt-2 flex justify-between text-sm">
                  <span className="text-neutral-300 font-semibold">Total Due</span><span className="text-white font-black">{formatPHP(endInfo.totalDue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Already Paid {endInfo.hasResFee && <span className="text-[10px] text-emerald-500 ml-1">(Res. Fee applied)</span>}</span>
                  <span className="text-emerald-400 font-semibold">−{formatPHP(endInfo.alreadyPaid)}</span>
                </div>
                <div className={`flex justify-between text-sm pt-1 rounded-lg px-2 py-1.5 ${endInfo.balance > 0 ? 'bg-rose-950/30' : 'bg-emerald-950/20'}`}>
                  <span className={endInfo.balance > 0 ? 'text-rose-300 font-semibold' : 'text-emerald-400 font-semibold'}>
                    {endInfo.balance > 0 ? 'Outstanding Balance' : 'Settled ✓'}
                  </span>
                  <span className={`font-black ${endInfo.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {endInfo.balance > 0 ? formatPHP(endInfo.balance) : formatPHP(0)}
                  </span>
                </div>
              </div>

              {/* 🚨 EARLY END ADMIN OVERRIDE WARNING */}
              {endInfo.elapsedMins < 30 && (
                <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Early End Override</span>
                  </div>
                  <p className="text-[10px] text-rose-400/80 leading-relaxed">
                    This session has only been active for {endInfo.elapsedMins} minute{endInfo.elapsedMins !== 1 ? 's' : ''}. A minimum of 30 minutes is required. An Admin password is required to end this early.
                  </p>
                  <div>
                    <input 
                      type="password" 
                      value={endAdminPassword} 
                      onChange={e => { setEndAdminPassword(e.target.value); setEndAdminError(''); }} 
                      placeholder="Enter Admin Password" 
                      className="w-full bg-neutral-900 border border-rose-900/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" 
                    />
                    {endAdminError && <p className="text-[10px] text-rose-500 font-bold mt-1.5">{endAdminError}</p>}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Payment Status</label>
                <div className="flex gap-2">
                  <PayStatusBtn value="paid"    current={endPayStatus} label="Fully Paid"  onChange={setEndPayStatus} />
                  <PayStatusBtn value="partial" current={endPayStatus} label="Partial"      onChange={setEndPayStatus} />
                  <PayStatusBtn value="unpaid"  current={endPayStatus} label="Unpaid"       onChange={setEndPayStatus} />
                </div>
                {endPayStatus === 'partial' && (
                  <div>
                    <label className="text-xs text-neutral-500 mb-1.5 block">Amount Collected (PHP)</label>
                    <input type="number" value={endPartialAmount} onChange={e => setEndPartialAmount(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      placeholder={formatPHP(endInfo.balance)} step="0.01" />
                  </div>
                )}
                {endPayStatus === 'unpaid' && (
                  <div className="flex items-center gap-2 bg-rose-950/30 border border-rose-800/30 rounded-xl px-4 py-3 text-xs text-rose-400">
                    <AlertTriangle size={13} className="flex-shrink-0" />
                    <span>Mark session as ended with outstanding balance of {formatPHP(endInfo.balance)}.</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Payment Method</label>
                <div className="flex gap-2">
                  <PayMethodBtn value="cash"  current={endPayMethod} icon={Banknote}   label="Cash"  onChange={setEndPayMethod} />
                  <PayMethodBtn value="gcash" current={endPayMethod} icon={CreditCard}  label="GCash" onChange={setEndPayMethod} />
                </div>
                {endPayMethod === 'gcash' && endPayStatus !== 'unpaid' && endInfo.balance > 0 && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                    <input type="text" value={endGcashRef} onChange={e => setEndGcashRef(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-neutral-900 border border-blue-900/30 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      placeholder="Enter GCash Reference Number" required />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEndingTableId(null)} className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleConfirmEnd} 
                  disabled={(endPayMethod === 'gcash' && endPayStatus !== 'unpaid' && endInfo.balance > 0 && !endGcashRef) || (endInfo.elapsedMins < 30 && !endAdminPassword)}
                  className="flex-1 px-4 py-2.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-sm rounded-xl shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 font-semibold">
                  <CircleCheck size={15} /> Confirm End
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXTEND SESSION MODAL */}
      {extendingTableId && extendingTable?.session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center flex-none bg-amber-950/20">
              <div>
                <h2 className="text-base font-bold text-neutral-100">Extend Session</h2>
                <p className="text-xs text-neutral-500">{extendingTable.name} · {extendingTable.session.customerName}</p>
              </div>
              <button onClick={() => setExtendingTableId(null)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmExtend} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Extra Time</label>
                <div className="grid grid-cols-2 gap-2">
                  {extendOptions.map(d => {
                     // 🚨 CAPACITY CHECK FOR EXTEND BUTTONS
                     const currentEnd = extendingTable.session!.durationMinutes <= 0 
                       ? now 
                       : addMinutes(new Date(extendingTable.session!.startTime), Math.abs(extendingTable.session!.durationMinutes));
                     const proposedEnd = d <= 0 ? addMinutes(now, 12 * 60) : addMinutes(currentEnd, d);
                     const isSafe = checkCapacityConflict(extendingTableId, proposedEnd).safe;

                     return (
                      <button key={d} type="button" disabled={!isSafe} onClick={() => setExtendMinutes(d)}
                        className={`py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                          !isSafe ? 'opacity-30 cursor-not-allowed bg-neutral-900 border-neutral-800 text-neutral-600' :
                          extendMinutes === d ? 'bg-amber-600/15 border-amber-600 text-amber-400' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        {d === 0 ? 'Open Time' : `+${d < 60 ? `${d}min` : `${d / 60}hr`}`}
                        <br />
                        <span className="text-[10px] font-normal opacity-70">
                          {d === 0 ? 'Pay at end' : `+${formatPHP((d / 60) * rates.hourlyRate)}`}
                        </span>
                      </button>
                     );
                  })}
                </div>
              </div>

              {/* 🚨 NEW: OVERTIME ABSORPTION NOTICE */}
              {currentOvertimeSecs > 0 && extendMinutes > 0 && (
                <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 text-xs text-rose-400 mt-2">
                  <div className="flex items-center gap-1.5 font-bold mb-1"><AlertTriangle size={12}/> Overtime Applied</div>
                  <p className="text-[10px] leading-relaxed">
                    This table is currently <strong>{formatHHMMSS(currentOvertimeSecs)} in overtime</strong>. 
                    Extending by {extendMinutes}m will automatically absorb the overtime charge, 
                    giving the customer <strong>{formatHHMMSS(Math.max(0, (extendMinutes * 60) - currentOvertimeSecs))}</strong> of new playing time.
                  </p>
                </div>
              )}

              {extendMinutes > 0 ? (
                <>
                  <div className="bg-neutral-900 rounded-xl p-3 text-xs border border-neutral-800">
                    <div className="flex justify-between text-neutral-400">
                      <span>Extension charge</span><span className="font-semibold text-amber-400">{formatPHP(extendCharge)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-500 mt-1">
                      <span>Rate</span><span>₱{rates.hourlyRate}/hr</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Extension Payment</label>
                    <div className="flex gap-2">
                      <PayStatusBtn value="paid"    current={extendPayStatus} label="Paid Now"  onChange={setExtendPayStatus} />
                      <PayStatusBtn value="partial" current={extendPayStatus} label="Partial"   onChange={setExtendPayStatus} />
                      <PayStatusBtn value="unpaid"  current={extendPayStatus} label="Defer"     onChange={setExtendPayStatus} />
                    </div>
                    {extendPayStatus === 'partial' && (
                      <input type="number" value={extendPartialAmount} onChange={e => setExtendPartialAmount(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        placeholder={`Amount collected (of ${formatPHP(extendCharge)})`} step="0.01" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Payment Method</label>
                    <div className="flex gap-2">
                      <PayMethodBtn value="cash"  current={extendPayMethod} icon={Banknote}   label="Cash"  onChange={setExtendPayMethod} />
                      <PayMethodBtn value="gcash" current={extendPayMethod} icon={CreditCard} label="GCash" onChange={setExtendPayMethod} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 flex items-start gap-2 text-blue-400 text-xs">
                  <Clock size={14} className="mt-0.5 flex-shrink-0" />
                  <p className="leading-relaxed">This table will be converted to an Open Time session. The timer will continue counting and the final bill will be collected when the session ends.</p>
                </div>
              )}

             <div className="flex gap-3">
                <button type="button" onClick={() => setExtendingTableId(null)} className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-xl shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 font-semibold">
                  <Zap size={15} /> Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN VOID MODAL */}
      {voidOrderId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 w-full max-w-xs shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-rose-500" />
              <h3 className="text-sm font-bold text-white">Admin Override Required</h3>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              {voidOrderId === 'OPEN_TIME_CONVERSION' 
                ? "Please enter an admin password to void the Open Time extension and revert the table to its previous fixed duration."
                : "Please enter an admin password to void this order."}
            </p>
            
            {voidError && <p className="text-xs text-rose-400 mb-3 bg-rose-950/40 border border-rose-800/50 p-2 rounded-lg">{voidError}</p>}
            
            <input type="password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setVoidError(''); }} 
              placeholder="Enter Admin Password" 
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white mb-4 focus:outline-none focus:border-rose-500" 
            />
            
            <div className="flex gap-2">
              <button onClick={() => { setVoidOrderId(null); setAdminPassword(''); setVoidError(''); }} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2.5 rounded-lg text-xs font-semibold transition-colors">Cancel</button>
              <button onClick={handleConfirmVoid} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-lg text-xs font-semibold transition-colors">Void Action</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}