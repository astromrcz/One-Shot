import { useState } from 'react';
import { useAppContext, HOURLY_RATE, ReservationStatus } from '../context/AppContext';
import emailjs from '@emailjs/browser';
import {
  X, Calendar, Clock, Users, Phone, CheckCircle,
  XCircle, Search, AlertTriangle, Receipt, CalendarDays, Copy, Loader2, ImageOff,
  MapPin, FileText, Mail
} from 'lucide-react';
import { format, isToday, isTomorrow, isThisMonth, isThisYear } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const formatPHP = (amount: number) => `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  'checked-in': { label: 'Checked In', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  completed: { label: 'Completed', color: 'bg-neutral-700/50 text-neutral-400 border-neutral-700', dot: 'bg-neutral-500' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400' },
  denied: { label: 'Denied', color: 'bg-red-500/10 text-red-500 border-red-500/20', dot: 'bg-red-500' },
};

const formatTimeSlot = (time24: string) => {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${m} ${ampm}`;
};

const formatReservationDate = (r: any) => {
  const timeStr = r.timeSlot ? formatTimeSlot(r.timeSlot) : format(r.date, 'h:mm a');
  if (isToday(r.date)) return `Today, ${timeStr}`;
  if (isTomorrow(r.date)) return `Tomorrow, ${timeStr}`;
  return `${format(r.date, 'MMM d, yyyy')} at ${timeStr}`;
};

const isSessionFinished = (date: Date | string | number, timeSlot: string, durationHours: number = 2) => {
  try {
    const now = new Date();
    const start = new Date(date);
    if (timeSlot) {
      const [h, m] = timeSlot.split(':').map(Number);
      start.setHours(h, m, 0, 0);
    }
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return now >= end;
  } catch {
    return true; 
  }
};

type DateFilter = 'all' | 'today' | 'month' | 'year'; 

// ─── TABLE RESERVATIONS VIEW ──────────────────────────────────────────────────
function TableReservationsView() {
  const navigate = useNavigate();
  const { tables, reservations, updateReservationStatus, cancelReservation, updateDownPayment, updateBalance, proposeReschedule } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ReservationStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // 🚨 GCASH PHOTO VERIFICATION STATES 
  const [receiptViewer, setReceiptViewer] = useState<{ url: string, ref: string, name: string } | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const handleVerify = async (r: any) => {
    updateReservationStatus(r.id, 'confirmed');
    if (r.email) {
      try {
        const balance = r.totalAmount - r.downPaymentAmount;
        await emailjs.send('service_d5kmgtc', 'template_48a5pgd', {
            to_email: r.email, customer_name: r.customerName,
            date: r.date ? format(new Date(r.date), 'MMM d, yyyy') : '',
            time: r.timeSlot ? formatTimeSlot(r.timeSlot) : '',
            duration: r.durationHours, total_amount: r.totalAmount.toFixed(2),
            down_payment: r.downPaymentAmount.toFixed(2), balance: balance.toFixed(2)
          }, 'agtFkbRS7r_lgBWMV');
      } catch (error) {
        console.error("Failed to send email:", error);
      }
    }
    setToastMessage(`${r.customerName} successfully verified! Confirmation email sent.`);
    setTimeout(() => setToastMessage(null), 3500); 
    if (selectedId === r.id) setSelectedId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`ID ${text} copied to clipboard!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleProposeReschedule = async () => {
    if (!selectedId || !rescheduleDate || !rescheduleTime) return;
    const [year, month, day] = rescheduleDate.split('-').map(Number);
    const [hour, minute] = rescheduleTime.split(':').map(Number);
    const proposedDateObj = new Date(year, month - 1, day, hour, minute);
    await proposeReschedule(selectedId, proposedDateObj, rescheduleTime);
    setToastMessage(`Reschedule proposed for ${format(proposedDateObj, 'MMM d')} at ${formatTimeSlot(rescheduleTime)}`);
    setTimeout(() => setToastMessage(null), 3500);
    setShowRescheduleForm(false);
  };

  const handleCheckInClick = (r: any) => {
    // 🚨 FIXED: Prevent checking in if the reservation is not for today
    const resDate = new Date(r.date);
    resDate.setHours(0, 0, 0, 0); // Normalize time to start of day
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to start of day

    if (resDate.getTime() !== today.getTime()) {
      toast.error("Invalid Check-In Date", { 
        description: "Customers can only be checked in on the exact date of their reservation. If they are arriving on a different day, please accommodate them as a regular Walk-In." 
      });
      return;
    }
    
    executeCheckIn(r);
  };

  const executeCheckIn = async (r: any) => {
    const now = new Date();
    const end = new Date(now.getTime() + r.durationHours * 60 * 60 * 1000);
    const todayStr = now.toISOString().split('T')[0];

    let targetTableId = null;

    if (r.tableId) {
      const assignedTable = tables.find(t => t.id === r.tableId);
      if (assignedTable && assignedTable.status === 'available') {
         const hasConflict = reservations.some(otherRes => {
            if (otherRes.id === r.id || otherRes.tableId !== assignedTable.id || otherRes.status === 'cancelled' || otherRes.status === 'completed') return false;
            const rDateStr = new Date(otherRes.date).toISOString().split('T')[0];
            if (rDateStr !== todayStr || !otherRes.timeSlot) return false;
            const otherStart = new Date(otherRes.date);
            const [hours, minutes] = otherRes.timeSlot.split(':').map(Number);
            otherStart.setHours(hours, minutes, 0, 0);
            return end > otherStart;
         });
         if (!hasConflict) targetTableId = assignedTable.id;
      }
    }

    if (!targetTableId) {
      for (const table of tables) {
        if (!table.isActive || table.status !== 'available') continue;
        
        const hasConflict = reservations.some(otherRes => {
          if (otherRes.id === r.id || otherRes.tableId !== table.id || otherRes.status === 'cancelled' || otherRes.status === 'completed') return false;
          const rDateStr = new Date(otherRes.date).toISOString().split('T')[0];
          if (rDateStr !== todayStr || !otherRes.timeSlot) return false;
          
          const otherStart = new Date(otherRes.date);
          const [hours, minutes] = otherRes.timeSlot.split(':').map(Number);
          otherStart.setHours(hours, minutes, 0, 0);
          
          return end > otherStart;
        });

        if (!hasConflict) {
          targetTableId = table.id;
          break;
        }
      }
    }

    if (!targetTableId) {
      toast.error("No free tables available", { description: "There are currently no free tables that don't conflict with another booking for this duration." });
      return;
    }

    setSelectedId(null);
    navigate(`/staff/tables?assignTable=${targetTableId}&reservationId=${r.id}`);
  };

  const filtered = reservations
    .filter(r => {
      const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase()) || r.contactNumber.includes(search);
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const selected = reservations.find(r => r.id === selectedId);
  const statusOptions: Array<'all' | ReservationStatus> = ['all', 'pending', 'confirmed', 'checked-in', 'completed', 'cancelled'];

  const todayCount = reservations.filter(r => isToday(r.date)).length;
  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const totalRevenue = reservations.filter(r => r.status === 'completed').reduce((s, r) => s + r.totalAmount, 0);
  const pendingPayment = reservations.filter(r => r.status !== 'cancelled').reduce((s, r) => {
    if (!r.downPaymentPaid) return s + r.downPaymentAmount;
    if (!r.balancePaid) return s + (r.totalAmount - r.downPaymentAmount);
    return s;
  }, 0);

  return (
    <div className="space-y-5 relative">
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -20, x: 20 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-6 right-6 z-[200] bg-emerald-950/95 border border-emerald-800/50 text-emerald-400 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <CheckCircle size={18} />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Today's Bookings", value: todayCount, color: 'text-blue-400' },
          { label: 'Pending Confirmation', value: pendingCount, color: 'text-amber-400' },
          { label: 'Total Revenue', value: formatPHP(totalRevenue), color: 'text-emerald-400' },
          { label: 'Pending Payments', value: formatPHP(pendingPayment), color: 'text-rose-400' },
        ].map(s => (
          <div key={s.label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input type="text" placeholder="Search by name or contact..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusOptions.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border capitalize transition-all ${
                filterStatus === s ? s === 'all' ? 'bg-neutral-700 text-neutral-200 border-neutral-600' : `${statusConfig[s as ReservationStatus]?.color} border`
                  : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'
              }`}>
              {s === 'all' ? 'All' : statusConfig[s as ReservationStatus]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                {['Customer', 'Date & Time', 'Duration', 'Party', 'Status', 'Payment', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[10px] text-neutral-500 uppercase tracking-wider font-semibold px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Calendar size={28} className="mx-auto text-neutral-700 mb-2" />
                    <p className="text-sm text-neutral-600">No reservations found</p>
                  </td>
                </tr>
              ) : filtered.map(r => {
                const cfg = statusConfig[r.status];
                return (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)} className="hover:bg-neutral-900/60 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-neutral-200">{r.customerName}</p>
                      <p className="text-xs text-neutral-500">{r.contactNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-300">{formatReservationDate(r)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-400">{r.durationHours}h</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-400">{r.partySize} pax</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="space-y-1.5 flex flex-col items-start">
                        <button onClick={() => updateDownPayment(r.id, !r.downPaymentPaid)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            r.downPaymentPaid ? 'bg-emerald-600/20 text-emerald-400 border-emerald-700/30' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-emerald-400'
                          }`}>
                          {r.downPaymentPaid ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          DP: {formatPHP(r.downPaymentAmount)}
                        </button>
                        <button onClick={() => updateBalance(r.id, !r.balancePaid)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            r.balancePaid ? 'bg-emerald-600/20 text-emerald-400 border-emerald-700/30' : 'bg-rose-600/10 text-rose-400 border-rose-700/30 hover:bg-rose-600/30'
                          }`}>
                          {r.balancePaid ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                          Bal: {formatPHP(r.totalAmount - r.downPaymentAmount)}
                        </button>
                        {r.paymentReference && (
                          <p className="text-[9px] text-neutral-500 pt-1">
                            Ref: <span className="font-mono text-neutral-300">{r.paymentReference}</span>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        {r.status === 'pending' && (
                          <>
                            {r.receiptUrl && (
                              <button onClick={() => { setImgStatus('loading'); setReceiptViewer({ url: r.receiptUrl!, ref: r.paymentReference || '', name: r.customerName }); }}
                                className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-bold rounded border border-blue-700/30 transition-colors flex items-center gap-1">
                                <Receipt size={10} /> Receipt
                              </button>
                            )}
                            <button onClick={() => handleVerify(r)} className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-[10px] font-bold rounded border border-emerald-700/30 transition-colors">
                              Verify
                            </button>
                          </>
                        )}
                        {r.status === 'confirmed' && (
                          <button onClick={() => handleCheckInClick(r)} className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-bold rounded border border-blue-700/30 transition-colors">
                            Check In
                          </button>
                        )}
                        {r.status === 'checked-in' && (
                          <button 
                            onClick={() => {
                              if (!isSessionFinished(r.date, r.timeSlot, r.durationHours)) {
                                toast.error("Session Not Finished", { description: "You can only mark this reservation as complete after its scheduled time has ended." });
                                return;
                              }
                              setCompleteTarget(r.id);
                              setShowCompleteDialog(true);
                            }} 
                            className="px-2 py-1 bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300 text-[10px] font-bold rounded border border-neutral-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {(r.status !== 'cancelled' && r.status !== 'completed') && (
                          <button onClick={() => { setCancelTarget(r.id); setShowCancelDialog(true); }} className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 text-[10px] font-bold rounded border border-rose-700/30 transition-colors">
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-neutral-100">{selected.customerName}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-neutral-500 font-mono">#{selected.id.toUpperCase()}</p>
                  <button onClick={() => copyToClipboard(selected.id.toUpperCase())} className="text-neutral-500 hover:text-neutral-300 transition-colors" title="Copy ID">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <button onClick={() => { setSelectedId(null); setShowRescheduleForm(false); }} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Date & Time</p>
                  <p className="text-neutral-300">{format(selected.date, 'MMM d, yyyy')}</p>
                  <p className="text-neutral-500 text-xs">{selected.timeSlot ? formatTimeSlot(selected.timeSlot) : format(selected.date, 'h:mm a')}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Duration</p>
                  <p className="text-neutral-300">{selected.durationHours} hour{selected.durationHours > 1 ? 's' : ''}</p>
                  <p className="text-neutral-500 text-xs">{selected.partySize} pax</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Contact</p>
                  <p className="text-neutral-300">{selected.contactNumber}</p>
                  {selected.email && <p className="text-neutral-500 text-xs">{selected.email}</p>}
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="bg-neutral-900 rounded-xl p-4 space-y-2.5 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Payment</p>
                  {selected.receiptUrl && (
                    <button onClick={() => { setImgStatus('loading'); setReceiptViewer({ url: selected.receiptUrl!, ref: selected.paymentReference || '', name: selected.customerName }); }}
                      className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-bold rounded border border-blue-700/30 transition-colors flex items-center gap-1">
                      <Receipt size={10} /> View GCash Receipt
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {selected.paymentReference && (
                    <div className="flex justify-between text-sm pb-1.5 border-b border-neutral-800/50">
                      <span className="text-neutral-400">Reference No.</span>
                      <span className="font-mono text-neutral-200">{selected.paymentReference}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Total ({selected.durationHours}h × ₱{HOURLY_RATE})</span>
                    <span className="text-neutral-200 font-semibold">{formatPHP(selected.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Down Payment (25%)</span>
                    <div className="flex items-center gap-2">
                      <span className={selected.downPaymentPaid ? 'text-emerald-400' : 'text-neutral-400'}>{formatPHP(selected.downPaymentAmount)}</span>
                      <button onClick={() => updateDownPayment(selected.id, !selected.downPaymentPaid)}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border transition-colors ${selected.downPaymentPaid ? 'bg-emerald-600/20 text-emerald-400 border-emerald-700/30' : 'bg-neutral-800 text-neutral-500 border-neutral-700 hover:border-neutral-600'}`}>
                        {selected.downPaymentPaid ? '✓ Paid' : 'Mark Paid'}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-neutral-800 pt-2">
                    <span className="text-neutral-400">Balance</span>
                    <div className="flex items-center gap-2">
                      <span className={selected.balancePaid ? 'text-emerald-400' : 'text-rose-400'}>{formatPHP(selected.totalAmount - selected.downPaymentAmount)}</span>
                      <button onClick={() => updateBalance(selected.id, !selected.balancePaid)}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border transition-colors ${selected.balancePaid ? 'bg-emerald-600/20 text-emerald-400 border-emerald-700/30' : 'bg-rose-600/20 text-rose-400 border-rose-700/30 hover:bg-rose-600/30'}`}>
                        {selected.balancePaid ? '✓ Paid' : 'Collect'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rescheduling UI */}
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-amber-500 uppercase tracking-wider font-semibold flex items-center gap-1.5"><CalendarDays size={12}/> Reschedule</p>
                  {selected.rescheduleRequested && (
                     <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Pending Customer Approval</span>
                  )}
                </div>
                {showRescheduleForm ? (
                  <div className="space-y-3 mt-3">
                    <div className="flex gap-2">
                      <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500/50" />
                      <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowRescheduleForm(false)} className="flex-1 py-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-semibold transition-colors">Cancel</button>
                      <button onClick={handleProposeReschedule} disabled={!rescheduleDate || !rescheduleTime} className="flex-1 py-2 text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg font-bold transition-colors">Propose New Time</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-neutral-500 mb-3">Propose a new date/time to the customer. They must accept it via their portal.</p>
                    <button onClick={() => setShowRescheduleForm(true)} className="w-full py-2 text-xs border border-amber-600/50 text-amber-500 hover:bg-amber-600/10 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                      <CalendarDays size={14}/> Propose Reschedule
                    </button>
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div className="flex gap-2 flex-wrap">
                {selected.status === 'pending' && (
                  <button onClick={() => handleVerify(selected)} className="flex-1 px-3 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-semibold rounded-xl border border-emerald-700/30 transition-colors">Confirm Booking</button>
                )}
                {selected.status === 'confirmed' && (
                  <button onClick={() => handleCheckInClick(selected)} className="flex-1 px-3 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm font-semibold rounded-xl border border-blue-700/30 transition-colors">Check In Customer</button>
                )}
                {selected.status === 'checked-in' && (
                  <button 
                    onClick={() => {
                      if (!isSessionFinished(selected.date, selected.timeSlot, selected.durationHours)) {
                        toast.error("Session Not Finished", { description: "You can only mark this reservation as complete after its scheduled time has ended." });
                        return;
                      }
                      setCompleteTarget(selected.id);
                      setShowCompleteDialog(true);
                    }} 
                    className="flex-1 px-3 py-2.5 bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300 text-sm font-semibold rounded-xl border border-neutral-700 transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
                {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                  <button onClick={() => { setCancelTarget(selected.id); setShowCancelDialog(true); }} className="px-3 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-sm font-semibold rounded-xl border border-rose-700/30 transition-colors">Cancel</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reservation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-neutral-100">Cancel Reservation</h2>
                <p className="text-xs text-neutral-500">Reservation #{cancelTarget?.toUpperCase()}</p>
              </div>
              <button onClick={() => setShowCancelDialog(false)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-500">Are you sure you want to cancel this reservation?</p>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Enter reason for cancellation (optional)"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder-neutral-600" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCancelDialog(false)} className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">Cancel</button>
                <button type="button" onClick={async () => {
                    if (cancelTarget) {
                      const r = reservations.find(res => res.id === cancelTarget);
                      await cancelReservation(cancelTarget, cancelReason);
                      if (r && r.email) {
                        try {
                          await emailjs.send('service_d5kmgtc', 'template_0wj40mo', {
                              to_email: r.email, customer_name: r.customerName,
                              date: r.date ? format(new Date(r.date), 'MMM d, yyyy') : '',
                              reason: cancelReason || 'Cancelled by Management',
                            }, 'agtFkbRS7r_lgBWMV');
                        } catch (error) { console.error("Failed to send email:", error); }
                      }
                      setShowCancelDialog(false); setCancelTarget(null); setCancelReason('');
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm rounded-xl font-semibold transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2">
                  <X size={15} /> Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Reservation Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-neutral-100">Complete Reservation</h2>
                <p className="text-xs text-neutral-500">Reservation #{completeTarget?.toUpperCase()}</p>
              </div>
              <button onClick={() => setShowCompleteDialog(false)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-500">Are you sure you want to mark this reservation as complete? This will finalize the session and clear it from reservations.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCompleteDialog(false)} className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">Cancel</button>
                <button type="button" onClick={() => {
                    if (completeTarget) {
                      updateReservationStatus(completeTarget, 'completed');
                      setShowCompleteDialog(false);
                      setCompleteTarget(null);
                      setSelectedId(null);
                      toast.success("Reservation marked as completed!");
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl font-semibold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2">
                  <CheckCircle size={15} /> Confirm Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📸 PERFECTED ZOOMABLE GCASH RECEIPT VIEWER */}
      <AnimatePresence>
        {receiptViewer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setReceiptViewer(null); setIsZoomed(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh]">
              
              <div className="flex items-center justify-between mb-4 flex-none">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Receipt className="text-blue-500" size={20}/> GCash Receipt
                  </h3>
                  <p className="text-sm text-neutral-400">{receiptViewer.name}</p>
                </div>
                <button onClick={() => { setReceiptViewer(null); setIsZoomed(false); }} className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className={`relative w-full rounded-xl border border-neutral-800 mb-4 bg-black/50 ${isZoomed ? 'overflow-auto h-[65vh]' : 'overflow-hidden h-[50vh] flex items-center justify-center'}`}>
                {imgStatus === 'loading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-500 gap-3">
                    <Loader2 size={32} className="animate-spin" />
                    <p className="text-xs font-semibold uppercase tracking-wider">Loading receipt...</p>
                  </div>
                )}
                {imgStatus === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-500 gap-3">
                    <ImageOff size={48} className="opacity-50" />
                    <p className="text-sm font-bold">Image Failed to Load</p>
                  </div>
                )}
                <img 
                  src={receiptViewer.url} 
                  alt="Receipt" 
                  onLoad={() => setImgStatus('loaded')} 
                  onError={() => setImgStatus('error')}
                  onClick={() => { if(imgStatus === 'loaded') setIsZoomed(!isZoomed) }}
                  className={`transition-all duration-300 rounded-lg ${imgStatus !== 'loaded' ? 'hidden' : ''} ${isZoomed ? 'w-[200%] sm:w-[150%] h-auto max-w-none cursor-zoom-out origin-top-left' : 'w-full h-full object-contain cursor-zoom-in'}`} 
                />
              </div>
              
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 text-center flex-none">
                <p className="text-[11px] text-blue-500 uppercase tracking-widest font-bold mb-1">Reference Number</p>
                <p className="text-xl font-mono font-black text-blue-400 tracking-wider">{receiptViewer.ref || 'N/A'}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ─── TATTOO RESERVATIONS VIEW ─────────────────────────────────────────────────
function TattooReservationsView() {
  const { tattooReservations, updateTattooReservationStatus, proposeReschedule } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all'); 
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showRescheduleForm, setShowRescheduleForm] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  // 🚨 GCASH PHOTO VERIFICATION STATES (Added for Tattoo)
  const [receiptViewer, setReceiptViewer] = useState<{ url: string, ref: string, name: string } | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const filtered = tattooReservations.filter(r => {
    const matchSearch = !search || 
      r.customerName.toLowerCase().includes(search.toLowerCase()) || 
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.contactNumber.includes(search);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const d = new Date(r.date);
    const matchDate = dateFilter === 'all' ? true : dateFilter === 'today' ? isToday(d) : dateFilter === 'month' ? isThisMonth(d) : dateFilter === 'year' ? isThisYear(d) : true;
    return matchSearch && matchStatus && matchDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const selected = tattooReservations.find(r => r.id === selectedId);

  const handleProposeReschedule = async (id: string) => {
    if (!rescheduleDate || !rescheduleTime) return;
    const [year, month, day] = rescheduleDate.split('-').map(Number);
    const [hour, minute] = rescheduleTime.split(':').map(Number);
    const proposedDateObj = new Date(year, month - 1, day, hour, minute);
    
    await proposeReschedule(id, proposedDateObj, rescheduleTime);
    setShowRescheduleForm(null);
    toast.success(`Reschedule proposed for ${format(proposedDateObj, 'MMM d')} at ${formatTimeSlot(rescheduleTime)}`);
  };

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-neutral-950 border border-neutral-800 rounded-xl p-12 text-center">
            <Calendar size={32} className="mx-auto text-neutral-700 mb-3" />
            <p className="text-neutral-400 font-semibold">No tattoo bookings found</p>
          </div>
        ) : filtered.map(r => {
          const isVerified = ['confirmed', 'in-progress', 'completed'].includes(r.status);
          return (
          <div key={r.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="cursor-pointer" onClick={() => setSelectedId(r.id)}>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-neutral-200 text-base hover:text-violet-400 transition-colors">{r.customerName}</h3>
                  {isVerified && <CheckCircle size={14} className="text-emerald-500" title="Verified Customer" />}
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5 hover:text-neutral-400">Booking #{r.id.split('-')[0].toUpperCase()}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                r.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                r.status === 'confirmed' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                r.status === 'denied' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {r.status === 'in-progress' ? 'In Progress' : r.status}
              </span>
            </div>

            <div className="space-y-2 mb-5 flex-1 cursor-pointer" onClick={() => setSelectedId(r.id)}>
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <Calendar size={13} className="text-neutral-500 flex-shrink-0" />
                {format(new Date(r.date), 'MMM d, yyyy')} <span className="text-neutral-500 mx-1">•</span> {formatTimeSlot(r.timeSlot)}
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
                <div className="cursor-pointer" onClick={() => setSelectedId(r.id)}>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-1">Concept</p>
                  <p className="text-xs text-neutral-400 italic line-clamp-2">"{r.description}"</p>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                {r.referenceImage && (
                  <a href={r.referenceImage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
                    <FileText size={10} /> View Reference Image
                  </a>
                )}
                {/* 🚨 TATTOO GCASH RECEIPT BUTTON */}
                {(r as any).receiptUrl && (
                  <button onClick={(e) => { e.stopPropagation(); setImgStatus('loading'); setReceiptViewer({ url: (r as any).receiptUrl, ref: (r as any).paymentReference || '', name: r.customerName }); }}
                    className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                    <Receipt size={10} /> View GCash Receipt
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-4 mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a href={`tel:${r.contactNumber}`} className="w-7 h-7 rounded bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <Phone size={12} />
                </a>
                {r.email && (
                  <a href={`mailto:${r.email}`} className="w-7 h-7 rounded bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors">
                    <Mail size={12} />
                  </a>
                )}
              </div>
              
              <select value={r.status} onChange={(e) => {
                  const newStatus = e.target.value as any;
                  if (newStatus === 'completed') {
                    if (!isSessionFinished(r.date, r.timeSlot, 2)) {
                      toast.error("Session Not Finished", { description: "You can only mark this reservation as complete after its scheduled time has ended."});
                      return;
                    }
                    setCompleteTarget(r.id);
                    setShowCompleteDialog(true);
                  } else {
                    updateTattooReservationStatus(r.id, newStatus);
                  }
                }}
                className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg px-2 py-1.5 focus:border-violet-500 focus:outline-none cursor-pointer">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="denied">Denied</option> 
              </select>
            </div>

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

            {/* Status Quick Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-800">
              {r.status === 'pending' && (
                <button onClick={() => { updateTattooReservationStatus(r.id, 'confirmed'); toast.success("Tattoo booking confirmed!"); }} className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-700/30 transition-colors">
                  Confirm Booking
                </button>
              )}
              {r.status === 'confirmed' && (
                <button 
                  onClick={() => { 
                    if (!isToday(new Date(r.date))) {
                      toast.error("Invalid Start Date", { description: "You can only start a session on the exact date of the booking." });
                      return;
                    }
                    updateTattooReservationStatus(r.id, 'in-progress'); 
                    toast.success("Session started!"); 
                  }} 
                  className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-700/30 transition-colors"
                >
                  Start Session
                </button>
              )}
              {r.status === 'in-progress' && (
                <button 
                  onClick={() => {
                    if (!isSessionFinished(r.date, r.timeSlot, 2)) {
                      toast.error("Session Not Finished", { description: "You can only mark this reservation as complete after its scheduled time has ended." });
                      return;
                    }
                    setCompleteTarget(r.id);
                    setShowCompleteDialog(true);
                  }} 
                  className="flex-1 py-2 bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300 text-[10px] font-bold rounded-lg border border-neutral-700 transition-colors"
                >
                  Mark Complete
                </button>
              )}
              {(r.status !== 'cancelled' && r.status !== 'completed' && r.status !== 'denied') && (
                <button onClick={() => { setCancelTarget(r.id); setShowCancelDialog(true); }} className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-[10px] font-bold rounded-lg border border-rose-700/30 transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-neutral-100">{selected.customerName}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-neutral-500 font-mono">#{selected.id.toUpperCase()}</p>
                  <button onClick={() => { navigator.clipboard.writeText(selected.id.toUpperCase()); toast.success("ID copied!"); }} className="text-neutral-500 hover:text-neutral-300 transition-colors">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Date & Time</p>
                  <p className="text-neutral-300">{format(selected.date, 'MMM d, yyyy')}</p>
                  <p className="text-neutral-500 text-xs">{selected.timeSlot ? formatTimeSlot(selected.timeSlot) : format(selected.date, 'h:mm a')}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Status</p>
                  <span className={`inline-flex px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    selected.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                    selected.status === 'confirmed' ? 'bg-sky-500/10 text-sky-400' :
                    selected.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    selected.status === 'denied' ? 'bg-red-500/10 text-red-500' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    {selected.status === 'in-progress' ? 'In Progress' : selected.status}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Contact</p>
                  <p className="text-neutral-300">{selected.contactNumber}</p>
                  {selected.email && <p className="text-neutral-500 text-xs">{selected.email}</p>}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Placement</p>
                  <p className="text-neutral-300">{selected.placement}</p>
                  <p className="text-neutral-500 text-xs">{selected.size}</p>
                </div>
              </div>

              {selected.description && (
                <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-2">Design Concept</p>
                  <p className="text-xs text-neutral-300 leading-relaxed">"{selected.description}"</p>
                </div>
              )}
              
              {/* 🚨 GCASH RECEIPT FOR TATTOO DETAIL PANEL */}
              {(selected as any).receiptUrl && (
                <div className="flex justify-between items-center text-sm border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400">Payment Verification</span>
                  <button onClick={() => { setImgStatus('loading'); setReceiptViewer({ url: (selected as any).receiptUrl, ref: (selected as any).paymentReference || '', name: selected.customerName }); }}
                    className="px-2 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-bold rounded border border-blue-700/30 transition-colors flex items-center gap-1">
                    <Receipt size={12} /> View GCash Receipt
                  </button>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reservation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-neutral-100">Cancel Tattoo Booking</h2>
                <p className="text-xs text-neutral-500">Reservation #{cancelTarget?.toUpperCase()}</p>
              </div>
              <button onClick={() => setShowCancelDialog(false)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-500">Are you sure you want to cancel this booking?</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCancelDialog(false)} className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">Keep Booking</button>
                <button type="button" onClick={() => {
                    if (cancelTarget) {
                      updateTattooReservationStatus(cancelTarget, 'cancelled');
                      setShowCancelDialog(false); setCancelTarget(null);
                      toast.success("Booking cancelled.");
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm rounded-xl font-semibold transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2">
                  <X size={15} /> Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Reservation Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-neutral-100">Complete Tattoo Session</h2>
                <p className="text-xs text-neutral-500">Reservation #{completeTarget?.toUpperCase()}</p>
              </div>
              <button onClick={() => setShowCompleteDialog(false)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-500">Are you sure you want to mark this tattoo session as complete? This will finalize the session and lock the record.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCompleteDialog(false)} className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">Cancel</button>
                <button type="button" onClick={() => {
                    if (completeTarget) {
                      updateTattooReservationStatus(completeTarget, 'completed');
                      setShowCompleteDialog(false);
                      setCompleteTarget(null);
                      setSelectedId(null);
                      toast.success("Session marked as completed!");
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl font-semibold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2">
                  <CheckCircle size={15} /> Confirm Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📸 PERFECTED ZOOMABLE GCASH RECEIPT VIEWER FOR TATTOOS */}
      <AnimatePresence>
        {receiptViewer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setReceiptViewer(null); setIsZoomed(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh]">
              
              <div className="flex items-center justify-between mb-4 flex-none">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Receipt className="text-blue-500" size={20}/> GCash Receipt
                  </h3>
                  <p className="text-sm text-neutral-400">{receiptViewer.name}</p>
                </div>
                <button onClick={() => { setReceiptViewer(null); setIsZoomed(false); }} className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className={`relative w-full rounded-xl border border-neutral-800 mb-4 bg-black/50 ${isZoomed ? 'overflow-auto h-[65vh]' : 'overflow-hidden h-[50vh] flex items-center justify-center'}`}>
                {imgStatus === 'loading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-500 gap-3">
                    <Loader2 size={32} className="animate-spin" />
                    <p className="text-xs font-semibold uppercase tracking-wider">Loading receipt...</p>
                  </div>
                )}
                {imgStatus === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-500 gap-3">
                    <ImageOff size={48} className="opacity-50" />
                    <p className="text-sm font-bold">Image Failed to Load</p>
                  </div>
                )}
                <img 
                  src={receiptViewer.url} 
                  alt="Receipt" 
                  onLoad={() => setImgStatus('loaded')} 
                  onError={() => setImgStatus('error')}
                  onClick={() => { if(imgStatus === 'loaded') setIsZoomed(!isZoomed) }}
                  className={`transition-all duration-300 rounded-lg ${imgStatus !== 'loaded' ? 'hidden' : ''} ${isZoomed ? 'w-[200%] sm:w-[150%] h-auto max-w-none cursor-zoom-out origin-top-left' : 'w-full h-full object-contain cursor-zoom-in'}`} 
                />
              </div>
              
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 text-center flex-none">
                <p className="text-[11px] text-blue-500 uppercase tracking-widest font-bold mb-1">Reference Number</p>
                <p className="text-xl font-mono font-black text-blue-400 tracking-wider">{receiptViewer.ref || 'N/A'}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN RESERVATIONS PAGE (TABS) ────────────────────────────────────────────
export function ReservationsPage() {
  const [activeTab, setActiveTab] = useState<'table' | 'tattoo'>('table');

  return (
    <div className="space-y-6">
      {/* Page Header and Tab Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Reservations</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage and track all table and tattoo studio bookings.</p>
        </div>
        <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'table' ? 'bg-neutral-800 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Table Bookings
          </button>
          <button
            onClick={() => setActiveTab('tattoo')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'tattoo' ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20 shadow-md' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Tattoo Bookings
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === 'table' ? <TableReservationsView /> : <TattooReservationsView />}
    </div>
  );
}