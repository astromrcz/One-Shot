import { useState, useEffect } from 'react';
import { useAppContext, HOURLY_RATE, DOWN_PAYMENT_RATE, ReservationStatus } from '../context/AppContext';
import emailjs from '@emailjs/browser';
import {
  Plus, X, Calendar, Clock, Users, Phone, Mail, ChevronDown, CheckCircle,
  XCircle, Search, Filter, PhilippinePeso, AlertTriangle, Receipt, RefreshCw
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, isThisMonth, isThisYear } from 'date-fns';

type DateFilter = 'all' | 'today' | 'month' | 'year'; // 🚨 STEP 5
import { motion, AnimatePresence } from 'framer-motion';

const formatPHP = (amount: number) => `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const statusConfig: Record<ReservationStatus, { label: string; color: string; dot: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  'checked-in': { label: 'Checked In', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  completed: { label: 'Completed', color: 'bg-neutral-700/50 text-neutral-400 border-neutral-700', dot: 'bg-neutral-500' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400' },
};

const formatDate = (d: Date) => {
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
};

export function Reservations() {
  const { reservations, addReservation, updateReservationStatus, cancelReservation, updateDownPayment, updateBalance, tables } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ReservationStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [receiptViewer, setReceiptViewer] = useState<{ url: string, ref: string, name: string } | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleVerify = async (r: any) => {
    updateReservationStatus(r.id, 'confirmed');
    
    if (r.email) {
      try {
        const balance = r.totalAmount - r.downPaymentAmount;
        
        await emailjs.send(
          'service_d5kmgtc',   
          'template_48a5pgd',  // ⚠️ Replace with your EmailJS Template ID
          {
            to_email: r.email,
            customer_name: r.customerName,
            date: r.date ? format(new Date(r.date), 'MMM d, yyyy') : '',
            time: r.timeSlot || '',
            duration: r.durationHours,
            total_amount: r.totalAmount.toFixed(2),
            down_payment: r.downPaymentAmount.toFixed(2),
            balance: balance.toFixed(2)
          },
          'agtFkbRS7r_lgBWMV'    // ⚠️ Replace with your EmailJS Public Key
        );
        console.log("Confirmation email sent!");
      } catch (error) {
        console.error("Failed to send email:", error);
      }
    }

    setToast(`${r.customerName} successfully verified! Confirmation email sent.`);
    setTimeout(() => setToast(null), 3500); 
    if (selectedId === r.id) setSelectedId(null);
  };
  // Form state
  const [form, setForm] = useState({
    customerName: '', contactNumber: '', email: '', date: '',
    timeSlot: '', durationHours: 2, partySize: 2, tableId: '',
  });

  const totalAmount = (form.durationHours * HOURLY_RATE);
  const downPayment = totalAmount * DOWN_PAYMENT_RATE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [year, month, day] = form.date.split('-').map(Number);
    const [hour, minute] = form.timeSlot.split(':').map(Number);
    const dateObj = new Date(year, month - 1, day, hour, minute);

    addReservation({
      customerName: form.customerName,
      contactNumber: form.contactNumber,
      email: form.email,
      date: dateObj,
      timeSlot: form.timeSlot,
      durationHours: form.durationHours,
      partySize: form.partySize,
      tableId: form.tableId || undefined,
      status: 'pending',
      totalAmount,
      downPaymentAmount: downPayment,
      downPaymentPaid: false,
      balancePaid: false,
    });
    setShowForm(false);
    setForm({ customerName: '', contactNumber: '', email: '', date: '', timeSlot: '', durationHours: 2, partySize: 2, tableId: '' });
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
      
      {/* Success Notification Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-6 right-6 z-[200] bg-emerald-950/95 border border-emerald-800/50 text-emerald-400 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <CheckCircle size={18} />
            <span className="text-sm font-semibold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Stats */}
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name or contact..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusOptions.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border capitalize transition-all ${
                filterStatus === s
                  ? s === 'all' ? 'bg-neutral-700 text-neutral-200 border-neutral-600' : `${statusConfig[s as ReservationStatus]?.color} border`
                  : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {s === 'all' ? 'All' : statusConfig[s as ReservationStatus]?.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl font-semibold transition-all shadow-lg shadow-emerald-900/30 flex-none"
        >
          <Plus size={15} /> New Reservation
        </button>
      </div>

      {/* Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                {['Customer', 'Date & Time', 'Duration', 'Party', 'Table', 'Status', 'Payment', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[10px] text-neutral-500 uppercase tracking-wider font-semibold px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Calendar size={28} className="mx-auto text-neutral-700 mb-2" />
                    <p className="text-sm text-neutral-600">No reservations found</p>
                  </td>
                </tr>
              ) : filtered.map(r => {
                const cfg = statusConfig[r.status];
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className="hover:bg-neutral-900/60 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-neutral-200">{r.customerName}</p>
                      <p className="text-xs text-neutral-500">{r.contactNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-300">{formatDate(r.date)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-400">{r.durationHours}h</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-400">{r.partySize} pax</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-400">{r.tableId ? tables.find(t => t.id === r.tableId)?.name || r.tableId : '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    {/* STEP 4: Moved Payment/Collect buttons directly to the dashboard table! */}
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
                        {/* Reference Number displayed inline */}
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
                              <button
                                onClick={() => setReceiptViewer({ url: r.receiptUrl!, ref: r.paymentReference || '', name: r.customerName })}
                                className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-bold rounded border border-blue-700/30 transition-colors flex items-center gap-1"
                              >
                                <Receipt size={10} /> Receipt
                              </button>
                            )}
                            <button
                              onClick={() => handleVerify(r)}
                              className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-[10px] font-bold rounded border border-emerald-700/30 transition-colors"
                            >
                              Verify
                            </button>
                          </>
                        )}
                        {r.status === 'confirmed' && (
                          <button
                            onClick={() => updateReservationStatus(r.id, 'checked-in')}
                            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-bold rounded border border-blue-700/30 transition-colors"
                          >
                            Check In
                          </button>
                        )}
                        {r.status === 'checked-in' && (
                          <button
                            onClick={() => updateReservationStatus(r.id, 'completed')}
                            className="px-2 py-1 bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300 text-[10px] font-bold rounded border border-neutral-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {(r.status !== 'cancelled' && r.status !== 'completed') && (
                          <button
                            onClick={() => {
                              setCancelTarget(r.id);
                              setShowCancelDialog(true);
                            }}
                            className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 text-[10px] font-bold rounded border border-rose-700/30 transition-colors"
                          >
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
                <p className="text-xs text-neutral-500">Reservation #{selected.id.toUpperCase()}</p>
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
                  <p className="text-neutral-500 text-xs">{selected.timeSlot}</p>
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
                <div className="space-y-0.5">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Table</p>
                  <p className="text-neutral-300">{selected.tableId ? tables.find(t => t.id === selected.tableId)?.name || selected.tableId : 'Not assigned'}</p>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="bg-neutral-900 rounded-xl p-4 space-y-2.5 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Payment</p>
                  {selected.receiptUrl && (
                    <button
                      onClick={() => setReceiptViewer({ url: selected.receiptUrl!, ref: selected.paymentReference || '', name: selected.customerName })}
                      className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-bold rounded border border-blue-700/30 transition-colors flex items-center gap-1"
                    >
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
                      <button
                        onClick={() => updateDownPayment(selected.id, !selected.downPaymentPaid)}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border transition-colors ${
                          selected.downPaymentPaid
                            ? 'bg-emerald-600/20 text-emerald-400 border-emerald-700/30'
                            : 'bg-neutral-800 text-neutral-500 border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        {selected.downPaymentPaid ? '✓ Paid' : 'Mark Paid'}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-neutral-800 pt-2">
                    <span className="text-neutral-400">Balance</span>
                    <div className="flex items-center gap-2">
                      <span className={selected.balancePaid ? 'text-emerald-400' : 'text-rose-400'}>{formatPHP(selected.totalAmount - selected.downPaymentAmount)}</span>
                      <button
                        onClick={() => updateBalance(selected.id, !selected.balancePaid)}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border transition-colors ${
                          selected.balancePaid
                            ? 'bg-emerald-600/20 text-emerald-400 border-emerald-700/30'
                            : 'bg-rose-600/20 text-rose-400 border-rose-700/30 hover:bg-rose-600/30'
                        }`}
                      >
                        {selected.balancePaid ? '✓ Paid' : 'Collect'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex gap-2 flex-wrap">
                {selected.status === 'pending' && (
                  <button onClick={() => handleVerify(selected)} className="flex-1 px-3 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-semibold rounded-xl border border-emerald-700/30 transition-colors">
                    Confirm Booking
                  </button>
                )}
                {selected.status === 'confirmed' && (
                  <button onClick={() => { updateReservationStatus(selected.id, 'checked-in'); setSelectedId(null); }} className="flex-1 px-3 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm font-semibold rounded-xl border border-blue-700/30 transition-colors">
                    Check In Customer
                  </button>
                )}
                {selected.status === 'checked-in' && (
                  <button onClick={() => { updateReservationStatus(selected.id, 'completed'); setSelectedId(null); }} className="flex-1 px-3 py-2.5 bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300 text-sm font-semibold rounded-xl border border-neutral-700 transition-colors">
                    Mark Complete
                  </button>
                )}
                {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                  <button onClick={() => { updateReservationStatus(selected.id, 'cancelled'); setSelectedId(null); }} className="px-3 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-sm font-semibold rounded-xl border border-rose-700/30 transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Reservation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center sticky top-0 bg-neutral-950">
              <h2 className="text-base font-bold text-neutral-100">New Reservation</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Customer Name *</label>
                  <input required value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder-neutral-600"
                    placeholder="Full name" />
                </div>
                {/* STEP 16: Limit Phone Field to exactly 11 numbers */}
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Contact Number *</label>
                  <input required value={form.contactNumber} 
                    onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                    maxLength={11}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder-neutral-600"
                    placeholder="09xx-xxx-xxxx" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Email (optional)</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder-neutral-600"
                    placeholder="email@example.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Date *</label>
                  <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Time Slot *</label>
                  <input required type="time" value={form.timeSlot} onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Duration (hours)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(h => (
                      <button key={h} type="button" onClick={() => setForm(f => ({ ...f, durationHours: h }))}
                        className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                          form.durationHours === h ? 'bg-emerald-600/15 border-emerald-600 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                        }`}>
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Party Size</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <button key={n} type="button" onClick={() => setForm(f => ({ ...f, partySize: n }))}
                        className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                          form.partySize === n ? 'bg-emerald-600/15 border-emerald-600 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 space-y-2">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Payment Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Total ({form.durationHours}h × ₱{HOURLY_RATE})</span>
                  <span className="text-neutral-200 font-semibold">{formatPHP(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-neutral-800 pt-2">
                  <span className="text-neutral-400">Down Payment (25%)</span>
                  <span className="text-amber-400 font-semibold">{formatPHP(downPayment)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl font-semibold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2">
                  <Plus size={15} /> Create Reservation
                </button>
              </div>
            </form>
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
              <button onClick={() => setShowCancelDialog(false)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-500">Are you sure you want to cancel this reservation?</p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation (optional)"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder-neutral-600"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCancelDialog(false)} className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (cancelTarget) {
                      // 1. Find the reservation details so we know who to email
                      const r = reservations.find(res => res.id === cancelTarget);
                      
                      // 2. Cancel it in the database
                      await cancelReservation(cancelTarget, cancelReason);
                      
                      // 3. Send the Cancellation Email!
                      if (r && r.email) {
                        try {
                          await emailjs.send(
                            'service_d5kmgtc',       
                            'template_0wj40mo', 
                            {
                              to_email: r.email,
                              customer_name: r.customerName,
                              date: r.date ? format(new Date(r.date), 'MMM d, yyyy') : '',
                              reason: cancelReason || 'Cancelled by Management',
                            },
                            'agtFkbRS7r_lgBWMV'        // ⚠️ Replace with your Public Key
                          );
                          console.log("Cancellation email sent!");
                        } catch (error) {
                          console.error("Failed to send cancellation email:", error);
                        }
                      }
                      
                      setShowCancelDialog(false);
                      setCancelTarget(null);
                      setCancelReason('');
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm rounded-xl font-semibold transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2"
                >
                  <X size={15} /> Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      <AnimatePresence>
        {receiptViewer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setReceiptViewer(null); setIsZoomed(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl flex flex-col max-h-[95vh]"
            >
              <div className="flex items-center justify-between mb-4 flex-none">
                <div>
                  <h3 className="text-lg font-bold text-white">GCash Receipt</h3>
                  <p className="text-xs text-neutral-500">{receiptViewer.name}</p>
                </div>
                <button onClick={() => { setReceiptViewer(null); setIsZoomed(false); }} className="text-neutral-600 hover:text-neutral-300">
                  <X size={18} />
                </button>
              </div>
              
              <div className={`relative w-full h-[70vh] min-h-[400px] max-h-[800px] bg-black rounded-lg border border-neutral-800 mb-4 flex ${isZoomed ? 'overflow-auto items-start p-0' : 'overflow-hidden items-center justify-center p-2'}`}>
                <img 
                  src={receiptViewer.url} 
                  alt="Receipt" 
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`transition-all duration-300 rounded mx-auto ${
                    isZoomed 
                      ? 'w-[200%] h-auto max-w-none cursor-zoom-out' 
                      : 'w-full h-full object-contain cursor-zoom-in'
                  }`}
                />
              </div>

              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 text-center flex-none">
                <p className="text-[10px] text-blue-500 uppercase tracking-widest font-semibold mb-1">Reference Number</p>
                <p className="text-lg font-mono font-bold text-blue-400">{receiptViewer.ref || 'N/A'}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}