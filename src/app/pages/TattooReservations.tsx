import { useState } from 'react';
import { useAppContext, TattooReservationStatus, TattooReservation } from '../context/AppContext';
import { Search, Phone, Mail, Calendar, Clock, CheckCircle, XCircle, User, ChevronDown, FileText, Shield, X, ImageIcon, CreditCard, Banknote, AlertTriangle } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

const statusConfig: Record<TattooReservationStatus, { label: string; color: string; dot: string }> = {
  pending:     { label: 'Pending',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   dot: 'bg-amber-400' },
  confirmed:   { label: 'Confirmed',   color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  completed:   { label: 'Completed',   color: 'bg-neutral-700/50 text-neutral-400 border-neutral-700',  dot: 'bg-neutral-500' },
  cancelled:   { label: 'Cancelled',   color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',     dot: 'bg-rose-400' },
};

const formatDate = (d: Date) => {
  const date = new Date(d);
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
};

export function TattooReservationsPage() {
  const { tattooReservations, updateTattooReservationStatus, updateTattooDepositPaid, tattooArtists } = useAppContext();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | TattooReservationStatus>('all');
  const [filterArtist, setFilterArtist] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);

  // Deposit confirmation modal state
  const [depositModal, setDepositModal] = useState<{ reservation: TattooReservation; paymentMethod: 'gcash' | 'cash' } | null>(null);
  const [depositConfirming, setDepositConfirming] = useState(false);

  const filtered = tattooReservations
    .filter(r => {
      const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase()) || r.contactNumber.includes(search);
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchArtist = filterArtist === 'all' || r.artistId === filterArtist;
      return matchSearch && matchStatus && matchArtist;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const selected = tattooReservations.find(r => r.id === selectedId);

  const todayCount     = tattooReservations.filter(r => isToday(new Date(r.date))).length;
  const pendingCount   = tattooReservations.filter(r => r.status === 'pending').length;
  const confirmedCount = tattooReservations.filter(r => r.status === 'confirmed').length;
  const depositPending = tattooReservations.filter(r => !r.depositPaid && r.status !== 'cancelled').length;

  const statusOrder: TattooReservationStatus[] = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];

  const openDepositModal = (r: TattooReservation) => {
    setDepositModal({ reservation: r, paymentMethod: 'gcash' });
  };

  const confirmDeposit = () => {
    if (!depositModal) return;
    setDepositConfirming(true);
    setTimeout(() => {
      // Mark deposit as paid
      updateTattooDepositPaid(depositModal.reservation.id, true);
      // Auto-confirm if still pending
      if (depositModal.reservation.status === 'pending') {
        updateTattooReservationStatus(depositModal.reservation.id, 'confirmed');
      }
      setDepositModal(null);
      setDepositConfirming(false);
    }, 800);
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Sessions", value: todayCount,     color: 'text-violet-400' },
          { label: 'Pending Review',   value: pendingCount,   color: 'text-amber-400' },
          { label: 'Confirmed',        value: confirmedCount, color: 'text-emerald-400' },
          { label: 'Deposit Pending',  value: depositPending, color: 'text-rose-400' },
        ].map(s => (
          <div key={s.label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or contact..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 placeholder-neutral-600"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 appearance-none">
          <option value="all">All Statuses</option>
          {statusOrder.map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
        </select>
        <select value={filterArtist} onChange={e => setFilterArtist(e.target.value)}
          className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 appearance-none">
          <option value="all">All Artists</option>
          {tattooArtists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <span className="text-xs text-neutral-600">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* List */}
        <div className={`space-y-3 ${selected ? 'xl:col-span-3' : 'xl:col-span-5'}`}>
          {filtered.length === 0 ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-12 text-center">
              <Calendar size={32} className="mx-auto text-neutral-700 mb-3" />
              <p className="text-neutral-500">No tattoo reservations found.</p>
            </div>
          ) : filtered.map(r => {
            const cfg = statusConfig[r.status];
            const artist = tattooArtists.find(a => a.id === r.artistId);
            return (
              <div
                key={r.id}
                onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}
                className={`bg-neutral-950 border rounded-xl p-5 cursor-pointer hover:border-neutral-600 transition-all ${selectedId === r.id ? 'border-violet-600/50' : 'border-neutral-800'}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-600/30 flex items-center justify-center text-sm font-bold text-violet-400 flex-none">
                      {r.customerName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-200">{r.customerName}</p>
                      <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-0.5">
                        <span className="flex items-center gap-1"><Phone size={10} />{r.contactNumber}</span>
                        {r.email && <span className="flex items-center gap-1 hidden sm:flex"><Mail size={10} />{r.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color} flex items-center gap-1`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.depositPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {r.depositPaid ? 'Deposit Paid' : 'Deposit Pending'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-neutral-900/60 rounded-lg px-3 py-2">
                    <p className="text-neutral-600 text-[10px] mb-0.5">Schedule</p>
                    <p className="text-neutral-300">{formatDate(r.date)}</p>
                  </div>
                  <div className="bg-neutral-900/60 rounded-lg px-3 py-2">
                    <p className="text-neutral-600 text-[10px] mb-0.5">Artist</p>
                    <p className="text-neutral-300">{r.artistName}</p>
                  </div>
                  <div className="bg-neutral-900/60 rounded-lg px-3 py-2">
                    <p className="text-neutral-600 text-[10px] mb-0.5">Placement</p>
                    <p className="text-neutral-300">{r.placement}</p>
                  </div>
                  <div className="bg-neutral-900/60 rounded-lg px-3 py-2">
                    <p className="text-neutral-600 text-[10px] mb-0.5">Size</p>
                    <p className="text-neutral-300">{r.estimatedSize}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <span className={`flex items-center gap-1 text-[10px] ${r.agreementSigned ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {r.agreementSigned ? <CheckCircle size={11} /> : <XCircle size={11} />} Agreement
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] ${r.consentSigned ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {r.consentSigned ? <CheckCircle size={11} /> : <XCircle size={11} />} Consent
                  </span>
                </div>

                {/* Action row */}
                <div className="mt-3 flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                  {/* Deposit confirmation button */}
                  {!r.depositPaid && r.status !== 'cancelled' && (
                    <button
                      onClick={() => openDepositModal(r)}
                      className="flex items-center gap-1.5 text-xs bg-violet-700/30 hover:bg-violet-700/50 border border-violet-600/40 text-violet-300 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                    >
                      <CreditCard size={12} /> Confirm Deposit
                    </button>
                  )}

                  {/* Status changer */}
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusMenu(showStatusMenu === r.id ? null : r.id)}
                      disabled={r.status === 'completed' || r.status === 'cancelled'}
                      className="flex items-center gap-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg text-neutral-300 transition-colors"
                    >
                      Update Status <ChevronDown size={12} />
                    </button>
                    {showStatusMenu === r.id && (
                      <div className="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-20 overflow-hidden min-w-36">
                        {statusOrder.filter(s => s !== r.status).map(s => (
                          <button key={s}
                            onClick={() => { updateTattooReservationStatus(r.id, s); setShowStatusMenu(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors text-left">
                            <span className={`w-2 h-2 rounded-full ${statusConfig[s].dot}`} />
                            {statusConfig[s].label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="xl:col-span-2">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden sticky top-0">
              <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">Reservation Details</h3>
                  <p className="text-[10px] text-neutral-600">ID: {selected.id}</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1.5 text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg">
                  <X size={14} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                {/* Customer */}
                <div>
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold mb-2">Customer</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-600/30 flex items-center justify-center text-sm font-bold text-violet-400">
                      {selected.customerName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-200">{selected.customerName}</p>
                      <p className="text-xs text-neutral-500 flex items-center gap-1"><Phone size={10} />{selected.contactNumber}</p>
                      {selected.email && <p className="text-xs text-neutral-500 flex items-center gap-1"><Mail size={10} />{selected.email}</p>}
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-neutral-900 rounded-xl p-3 space-y-1.5 text-xs">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold">Schedule</p>
                  <div className="flex justify-between"><span className="text-neutral-500">Date</span><span className="text-neutral-200">{format(new Date(selected.date), 'MMMM d, yyyy')}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Time</span><span className="text-neutral-200">{selected.timeSlot}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Booked On</span><span className="text-neutral-200">{format(new Date(selected.createdAt), 'MMM d, h:mm a')}</span></div>
                </div>

                {/* Artist */}
                <div className="bg-neutral-900 rounded-xl p-3 space-y-1.5 text-xs">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold">Artist</p>
                  <div className="flex justify-between"><span className="text-neutral-500">Name</span><span className="text-neutral-200">{selected.artistName}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Contact</span><span className="text-neutral-200">{selected.artistContact}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Specialty</span><span className="text-neutral-200">{tattooArtists.find(a => a.id === selected.artistId)?.specialty}</span></div>
                </div>

                {/* Tattoo Details */}
                <div className="bg-neutral-900 rounded-xl p-3 space-y-1.5 text-xs">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold">Tattoo Details</p>
                  <div className="flex justify-between"><span className="text-neutral-500">Placement</span><span className="text-neutral-200">{selected.placement}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Size</span><span className="text-neutral-200">{selected.estimatedSize}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Style</span><span className="text-neutral-200">{selected.colorStyle}</span></div>
                  <div className="pt-1">
                    <p className="text-neutral-600 mb-1">Description</p>
                    <p className="text-neutral-300 leading-relaxed">{selected.designDescription}</p>
                  </div>
                </div>

                {/* Inspiration Images */}
                {selected.inspirationImages && selected.inspirationImages.length > 0 && (
                  <div className="bg-neutral-900 rounded-xl p-3 text-xs">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-2">
                      <ImageIcon size={10} /> Inspiration Images ({selected.inspirationImages.length})
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {selected.inspirationImages.map((src, idx) => (
                        <a key={`detail-img-${idx}`} href={src} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-neutral-700 hover:border-violet-500 transition-colors">
                          <img src={src} alt={`Inspiration ${idx + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment */}
                <div className="bg-neutral-900 rounded-xl p-3 space-y-2 text-xs">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold">Payment</p>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Deposit (₱{selected.depositAmount})</span>
                    <span className={selected.depositPaid ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                      {selected.depositPaid ? '✓ Paid' : 'Pending'}
                    </span>
                  </div>
                  {!selected.depositPaid && selected.status !== 'cancelled' && (
                    <button
                      onClick={() => openDepositModal(selected)}
                      className="w-full flex items-center justify-center gap-2 bg-violet-700/30 hover:bg-violet-700/50 border border-violet-600/40 text-violet-300 py-2 rounded-xl transition-colors font-semibold mt-1"
                    >
                      <CreditCard size={13} /> Confirm Deposit Received
                    </button>
                  )}
                </div>

                {/* Consent Status */}
                <div className="bg-neutral-900 rounded-xl p-3 space-y-1.5 text-xs">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold">Legal Documents</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-neutral-500"><FileText size={11} /> Service Agreement</span>
                    <span className={`flex items-center gap-1 font-semibold ${selected.agreementSigned ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selected.agreementSigned ? <><CheckCircle size={11} /> Signed</> : <><XCircle size={11} /> Unsigned</>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-neutral-500"><Shield size={11} /> Informed Consent</span>
                    <span className={`flex items-center gap-1 font-semibold ${selected.consentSigned ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selected.consentSigned ? <><CheckCircle size={11} /> Signed</> : <><XCircle size={11} /> Unsigned</>}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold">Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {statusOrder.filter(s => s !== selected.status && s !== 'cancelled').map(s => (
                        <button key={s}
                          onClick={() => updateTattooReservationStatus(selected.id, s)}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${statusConfig[s].color}`}>
                          → {statusConfig[s].label}
                        </button>
                      ))}
                      <button
                        onClick={() => { updateTattooReservationStatus(selected.id, 'cancelled'); setSelectedId(null); }}
                        className="py-2 px-3 rounded-lg text-xs font-semibold transition-all border border-rose-500/20 bg-rose-500/10 text-rose-400 col-span-2">
                        Cancel Reservation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Deposit Confirmation Modal ── */}
      {depositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-violet-900/40 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-100">Confirm Deposit</h2>
                <p className="text-xs text-neutral-500">Tattoo reservation deposit</p>
              </div>
              <button onClick={() => setDepositModal(null)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Amount */}
              <div className="bg-violet-950/30 border border-violet-800/30 rounded-xl p-4 text-center">
                <p className="text-xs text-violet-400 mb-1 uppercase tracking-wider">Deposit Amount</p>
                <p className="text-4xl font-black text-violet-300">₱{depositModal.reservation.depositAmount.toLocaleString()}</p>
              </div>

              {/* Reservation info */}
              <div className="bg-neutral-900 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Customer</span>
                  <span className="text-neutral-200 font-semibold">{depositModal.reservation.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Artist</span>
                  <span className="text-neutral-200">{depositModal.reservation.artistName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Schedule</span>
                  <span className="text-neutral-200">{format(new Date(depositModal.reservation.date), 'MMM d')} · {depositModal.reservation.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Placement</span>
                  <span className="text-neutral-200">{depositModal.reservation.placement}</span>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDepositModal(m => m ? { ...m, paymentMethod: 'gcash' } : m)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${depositModal.paymentMethod === 'gcash' ? 'bg-blue-600/20 border-blue-500/50 text-blue-300' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
                  >
                    <CreditCard size={14} /> GCash
                  </button>
                  <button
                    onClick={() => setDepositModal(m => m ? { ...m, paymentMethod: 'cash' } : m)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${depositModal.paymentMethod === 'cash' ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
                  >
                    <Banknote size={14} /> Cash
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2.5 bg-amber-950/20 border border-amber-900/30 rounded-xl px-3 py-2.5">
                <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-600/80 leading-relaxed">
                  Confirming this deposit will mark it as received and automatically confirm the reservation if it's still pending.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDepositModal(null)}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeposit}
                  disabled={depositConfirming}
                  className="flex-1 bg-violet-700 hover:bg-violet-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
                >
                  {depositConfirming
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                    : <><CheckCircle size={15} /> Confirm ₱{depositModal.reservation.depositAmount} {depositModal.paymentMethod === 'gcash' ? 'GCash' : 'Cash'}</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}